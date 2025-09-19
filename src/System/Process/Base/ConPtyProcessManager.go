package BaseProcess

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"
	"voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"

	"github.com/UserExistsError/conpty" // 使用现代化的 conpty 库
	"github.com/shirou/gopsutil/v3/process"
)

// ConPtyProcessManager 负责管理一个独立的外部进程。
// 此版本使用原生的 ConPTY API，是 Windows 10+ 的现代化标准方案。
// 此结构体的所有方法都是并发安全的。
type ConPtyProcessManager struct {
	mu             sync.RWMutex
	binary         string
	cpty           *conpty.ConPty // 使用 conpty 对象管理进程和 I/O
	proc           *process.Process
	outputCallback func(log string)

	// 用于准确监控 CPU 的字段
	cpuPercentCache float64
	stopMonitorChan chan struct{}
}

// NewConPtyProcessManager 为给定的可执行文件路径创建一个新的 ConPTY 进程管理器。
func NewConPtyProcessManager(path string) (*ConPtyProcessManager, error) {
	binaryPath, err := exec.LookPath(path)
	if err != nil {
		return nil, fmt.Errorf("未能找到可执行文件 '%s': %w", path, err)
	}
	return &ConPtyProcessManager{binary: binaryPath}, nil
}

// SetOutputCallback 设置一个回调函数来处理进程的合并输出。
func (pm *ConPtyProcessManager) SetOutputCallback(callback func(log string)) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.outputCallback = callback
}

// Start 使用给定的命令行参数和工作目录来执行进程，并启动后台监控。
func (pm *ConPtyProcessManager) Start(workingDir string, options ...string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.cpty != nil {
		return fmt.Errorf("此管理器已在运行一个进程")
	}

	// ConPTY 方案仅在 Windows 上有效
	if runtime.GOOS != "windows" {
		return fmt.Errorf("ConPTY 方案仅支持 Windows 平台")
	}

	// 构造完整的命令行。conpty.Start 需要一个单一的字符串。
	// 我们用引号包裹主程序路径，以安全地处理路径中的空格。
	cmdParts := []string{fmt.Sprintf(`"%s"`, pm.binary)}
	cmdParts = append(cmdParts, options...)
	fullCommand := strings.Join(cmdParts, " ")

	// conpty.Start 没有直接设置工作目录的选项，
	// 所以我们使用一个标准技巧：先切换目录，启动后再切回来。
	originalDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("无法获取当前工作目录: %w", err)
	}
	if err := os.Chdir(workingDir); err != nil {
		return fmt.Errorf("无法切换到工作目录 '%s': %w", workingDir, err)
	}
	// 确保在函数返回时切回原始目录
	defer func(dir string) {
		_ = os.Chdir(dir)
	}(originalDir)

	// 【核心实现】使用 conpty.Start 启动进程。
	// 我们在这里直接设置一个超宽的终端尺寸，从源头上解决所有日志换行问题。
	cpty, err := conpty.Start(fullCommand, conpty.ConPtyDimensions(8192, 100))
	if err != nil {
		return fmt.Errorf("启动 ConPTY 进程失败: %w", err)
	}
	pm.cpty = cpty

	// 异步等待进程结束，并在结束后自动清理状态
	go func() {
		pm.mu.Lock()
		cpty := pm.cpty
		pm.mu.Unlock()

		if cpty != nil {
			_, _ = cpty.Wait(context.Background()) // 阻塞直到进程退出
			vlogger.AppLogger.Info("ConPTY 进程 (PID: ", cpty.Pid(), " ) 已退出。")
		}
		_ = pm.Stop() // 调用 Stop 来进行状态清理
	}()

	// 创建 gopsutil 进程对象用于监控
	pm.proc, err = process.NewProcess(int32(pm.cpty.Pid()))
	if err != nil {
		_ = pm.cpty.Close() // 如果监控创建失败，尽力关闭进程
		return fmt.Errorf("进程已启动但创建监控器失败: %w", err)
	}

	// 启动日志读取和 CPU 监控
	if pm.outputCallback != nil {
		go pm.readPipe(pm.cpty, "") // cpty 对象本身就是 io.Reader
	}

	pm.stopMonitorChan = make(chan struct{})
	go pm.monitorCPU()

	vlogger.AppLogger.Info("进程已通过 ConPTY 启动, PID: ", pm.cpty.Pid(), ".")
	return nil
}

// monitorCPU 的逻辑与之前完全相同
func (pm *ConPtyProcessManager) monitorCPU() {
	_, _ = pm.proc.CPUPercent()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-pm.stopMonitorChan:
			vlogger.AppLogger.Info("PID ", pm.proc.Pid, " 的 CPU 监控已停止。")
			return
		case <-ticker.C:
			percent, err := pm.proc.CPUPercent()
			if err != nil {
				return
			}
			pm.mu.Lock()
			pm.cpuPercentCache = percent
			pm.mu.Unlock()
		}
	}
}

// Stop 优雅地终止进程，并停止后台监控。
func (pm *ConPtyProcessManager) Stop() error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.stopMonitorChan != nil {
		close(pm.stopMonitorChan)
		pm.stopMonitorChan = nil
	}

	if pm.cpty == nil {
		return nil
	}

	err := pm.cpty.Close() // Close 会终止进程并释放所有资源
	pm.resetState()
	return err
}

// GetProcessStatus 的逻辑与之前完全相同
func (pm *ConPtyProcessManager) GetProcessStatus() (entity.ProcessState, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	state := entity.ProcessState{}
	if pm.proc == nil {
		return state, nil
	}
	isRunning, err := pm.proc.IsRunning()
	if err != nil || !isRunning {
		return state, nil
	}
	state.Pid = fmt.Sprintf("%d", pm.proc.Pid)
	cpuCores := runtime.NumCPU()
	var taskManagerCpuPercent float64
	if cpuCores > 0 {
		percentOfTotal := pm.cpuPercentCache / float64(cpuCores)
		taskManagerCpuPercent = percentOfTotal * 2
	} else {
		taskManagerCpuPercent = pm.cpuPercentCache
	}
	if taskManagerCpuPercent > 100.0 {
		taskManagerCpuPercent = 100.0
	}
	state.Cpu = taskManagerCpuPercent
	if memInfo, err := pm.proc.MemoryInfo(); err == nil {
		memoryMB := float64(memInfo.RSS) / 1024 / 1024
		state.Memory = memoryMB
	} else {
		state.Memory = 0
	}
	if createTimeMs, err := pm.proc.CreateTime(); err == nil {
		createTime := time.Unix(0, createTimeMs*int64(time.Millisecond))
		uptime := time.Since(createTime).Round(time.Second)
		state.RunTime = uptime.String()
	} else {
		state.RunTime = "unknow"
	}
	return state, nil
}

// readPipe 从 PTY 读取所有输出
func (pm *ConPtyProcessManager) readPipe(ptyReader io.Reader, prefix string) {
	scanner := bufio.NewScanner(ptyReader)
	for scanner.Scan() {
		line := scanner.Text()
		pm.mu.RLock()
		if pm.outputCallback != nil {
			pm.outputCallback(fmt.Sprintf("%s %s", prefix, line))
		}
		pm.mu.RUnlock()
	}
}

// resetState 清理进程状态
func (pm *ConPtyProcessManager) resetState() {
	pm.cpty = nil
	pm.proc = nil
	pm.cpuPercentCache = 0
}

// IsRunning 检查被管理的进程当前是否正在运行
func (pm *ConPtyProcessManager) IsRunning() bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	if pm.proc == nil {
		return false
	}
	running, err := pm.proc.IsRunning()
	return err == nil && running
}

// SendCommand 向 PTY 发送命令
func (pm *ConPtyProcessManager) SendCommand(command string) error {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.cpty == nil {
		return fmt.Errorf("进程未启动或 PTY 不可用")
	}

	// PTY 需要以 \r\n 结尾的命令
	if !strings.HasSuffix(command, "\r\n") {
		command += "\r\n"
	}

	// cpty 对象本身就是 io.Writer
	_, err := pm.cpty.Write([]byte(command))
	if err != nil {
		return fmt.Errorf("向 ConPTY 写入命令失败: %w", err)
	}
	return nil
}
