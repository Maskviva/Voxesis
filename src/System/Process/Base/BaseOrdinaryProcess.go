package BaseProcess

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"syscall"
	"time"
	"voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"

	"github.com/shirou/gopsutil/v3/process"
)

// ProcessManager 负责管理一个独立的外部进程。
// 此结构体的所有方法都是并发安全的。
type ProcessManager struct {
	mu             sync.RWMutex
	binary         string
	cmd            *exec.Cmd
	stdin          io.WriteCloser
	proc           *process.Process
	outputCallback func(log string)

	// 新增字段，用于准确监控 CPU
	cpuPercentCache float64       // 用于缓存最新的 CPU 使用率
	stopMonitorChan chan struct{} // 用于通知监控 goroutine 停止
}

// NewProcessManager 为给定的可执行文件路径创建一个新的进程管理器。
func NewProcessManager(path string) (*ProcessManager, error) {
	binaryPath, err := exec.LookPath(path)
	if err != nil {
		return nil, fmt.Errorf("未能找到可执行文件 '%s': %w", path, err)
	}
	return &ProcessManager{binary: binaryPath}, nil
}

// SetOutputCallback 设置一个回调函数来处理进程的标准输出和标准错误。
func (pm *ProcessManager) SetOutputCallback(callback func(log string)) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.outputCallback = callback
}

// Start 使用给定的命令行参数和工作目录来执行进程，并启动后台监控。
func (pm *ProcessManager) Start(workingDir string, options ...string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.proc != nil {
		if isRunning, _ := pm.proc.IsRunning(); isRunning {
			return fmt.Errorf("此管理器已在运行一个进程，PID 为 %d", pm.proc.Pid)
		}
	}

	pm.cmd = exec.Command(pm.binary, options...)
	pm.cmd.Dir = workingDir
	pm.cmd.Env = os.Environ()
	pm.cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	if pm.outputCallback != nil {
		stdoutPipe, err := pm.cmd.StdoutPipe()
		if err != nil {
			return fmt.Errorf("创建标准输出管道失败: %w", err)
		}
		stderrPipe, err := pm.cmd.StderrPipe()
		if err != nil {
			return fmt.Errorf("创建标准错误管道失败: %w", err)
		}
		go pm.readPipe(stdoutPipe, "[STDOUT]")
		go pm.readPipe(stderrPipe, "[STDERR]")
	}

	var err error
	pm.stdin, err = pm.cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("创建标准输入管道失败: %w", err)
	}

	if err := pm.cmd.Start(); err != nil {
		return fmt.Errorf("启动进程失败: %w", err)
	}

	go func() { _ = pm.cmd.Wait() }()

	pm.proc, err = process.NewProcess(int32(pm.cmd.Process.Pid))
	if err != nil {
		_ = pm.cmd.Process.Kill()
		return fmt.Errorf("进程已启动但创建监控器失败: %w", err)
	}

	pm.stopMonitorChan = make(chan struct{})
	go pm.monitorCPU()

	vlogger.AppLogger.Info("进程已启动, PID: %d，并已启动后台监控。", pm.cmd.Process.Pid)
	return nil
}

// monitorCPU 是一个后台 goroutine，定期、准确地更新 CPU 使用率。
func (pm *ProcessManager) monitorCPU() {
	// 第一次调用用于设置基准时间点，返回的值是0或无意义的值，应该被忽略。
	// 这是 gopsutil 的标准用法。
	_, _ = pm.proc.CPUPercent()

	ticker := time.NewTicker(2 * time.Second) // 每 2 秒更新一次
	defer ticker.Stop()

	for {
		select {
		case <-pm.stopMonitorChan:
			vlogger.AppLogger.Info("PID %d 的 CPU 监控已停止。", pm.proc.Pid)
			return
		case <-ticker.C:
			// 【核心修正】
			// CPUPercent 不需要参数。它会自动计算自上次调用以来的使用率。
			// 因为我们的 ticker 是 2 秒一次，所以这里计算的就是这 2 秒内的平均值。
			percent, err := pm.proc.CPUPercent()
			if err != nil {
				vlogger.AppLogger.Error("监控 PID %d 时出错: %v，监控将停止。", pm.proc.Pid, err)
				return
			}

			pm.mu.Lock()
			pm.cpuPercentCache = percent
			pm.mu.Unlock()
		}
	}
}

// Stop 优雅地终止进程，并停止后台监控。
func (pm *ProcessManager) Stop() error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.stopMonitorChan != nil {
		select {
		case pm.stopMonitorChan <- struct{}{}:
		default:
		}
		close(pm.stopMonitorChan)
		pm.stopMonitorChan = nil
	}

	if pm.proc == nil {
		return nil
	}
	if isRunning, _ := pm.proc.IsRunning(); !isRunning {
		pm.resetState()
		return nil
	}

	p, err := os.FindProcess(int(pm.proc.Pid))
	if err != nil {
		pm.resetState()
		return nil
	}

	_ = p.Signal(syscall.SIGTERM)

	done := make(chan error, 1)
	go func() { done <- pm.cmd.Wait() }()

	select {
	case <-time.After(5 * time.Second):
		_ = pm.cmd.Process.Kill()
		pm.resetState()
		return fmt.Errorf("进程被强制杀死 (超时)")
	case <-done:
		pm.resetState()
		return nil
	}
}

// GetProcessStatus 返回进程的当前资源使用情况，CPU部分从缓存读取。
func (pm *ProcessManager) GetProcessStatus() (entity.ProcessState, error) {
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

func (pm *ProcessManager) readPipe(pipe io.ReadCloser, prefix string) {
	scanner := bufio.NewScanner(pipe)
	for scanner.Scan() {
		line := scanner.Text()
		pm.mu.RLock()
		if pm.outputCallback != nil {
			pm.outputCallback(fmt.Sprintf("%s %s", prefix, line))
		}
		pm.mu.RUnlock()
	}
}

func (pm *ProcessManager) resetState() {
	pm.cmd = nil
	pm.proc = nil
	pm.stdin = nil
	pm.cpuPercentCache = 0
}

func (pm *ProcessManager) IsRunning() bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	if pm.proc == nil {
		return false
	}
	running, err := pm.proc.IsRunning()
	return err == nil && running
}

func (pm *ProcessManager) SendCommand(command string) error {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	if pm.stdin == nil {
		return fmt.Errorf("进程未启动或标准输入不可用")
	}
	if len(command) == 0 || command[len(command)-1] != '\n' {
		command += "\n"
	}
	if _, err := io.WriteString(pm.stdin, command); err != nil {
		return fmt.Errorf("向进程标准输入写入失败: %w", err)
	}
	return nil
}
