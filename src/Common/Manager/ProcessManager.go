package v_manager

import (
	"fmt"
	"sync"

	"voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"
	vprocess "voxesis/src/System/Process"
)

// ProcessType 定义进程类型
type ProcessType int

const (
	ConPty ProcessType = iota
	Ordinary
)

// String 方法让 ProcessType 在日志中更具可读性
func (pt ProcessType) String() string {
	switch pt {
	case ConPty:
		return "ConPty"
	case Ordinary:
		return "Ordinary"
	default:
		return "Unknown"
	}
}

// IProcess 统一进程接口
type IProcess interface {
	Start(logCallback func(string), args []string) error
	Stop() error
	SendCommand(command string) error
	IsRunning() bool
	GetStatus() (entity.ProcessState, error)
}

// ProcessManager 统一进程管理器
type ProcessManager struct {
	ProcessType ProcessType
	Path        string
	args        []string

	activeProcess IProcess
	mu            sync.RWMutex
}

// NewProcessManager 创建并配置一个新的进程管理器
func NewProcessManager(processType ProcessType, path string, args ...string) *ProcessManager {
	return &ProcessManager{
		ProcessType: processType,
		Path:        path,
		args:        args,
	}
}

// createProcess 使用管理器的配置来创建一个新的 Process 实例
func (pm *ProcessManager) createProcess() (IProcess, error) {
	switch pm.ProcessType {
	case ConPty:
		return vprocess.NewConPtyProcess(pm.Path), nil
	case Ordinary:
		return vprocess.NewOrdinaryProcess(pm.Path), nil
	default:
		return nil, fmt.Errorf("不支持的进程类型: %s", pm.ProcessType)
	}
}

// Start 创建并启动由该管理器配置的进程
func (pm *ProcessManager) Start(logCallback func(log string)) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	// 如果当前有进程正在运行，先停止它
	if pm.activeProcess != nil && pm.activeProcess.IsRunning() {
		vlogger.AppLogger.Infof("进程已在运行，将先停止它...")
		if err := pm.activeProcess.Stop(); err != nil {
			vlogger.AppLogger.Errorf("无法停止现有进程: %v", err)
			return fmt.Errorf("无法停止现有进程: %w", err)
		}
	}

	// 创建新的进程实例
	vlogger.AppLogger.Infof("正在创建新进程, 类型: %s, 路径: %s", pm.ProcessType, pm.Path)
	proc, err := pm.createProcess()
	if err != nil {
		return fmt.Errorf("创建进程实例失败: %w", err)
	}
	pm.activeProcess = proc

	// 启动进程
	vlogger.AppLogger.Info("正在启动进程...")
	if err := pm.activeProcess.Start(logCallback, pm.args); err != nil {
		vlogger.AppLogger.Errorf("启动进程失败: %v", err)
		pm.activeProcess = nil // 如果启动失败，清除实例引用
		return fmt.Errorf("启动进程失败: %w", err)
	}

	vlogger.AppLogger.Info("进程启动成功。")
	return nil
}

// Stop 停止当前正在运行的进程
func (pm *ProcessManager) Stop() error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.activeProcess == nil || !pm.activeProcess.IsRunning() {
		return nil // 没有正在运行的进程
	}

	vlogger.AppLogger.Info("正在停止进程...")
	if err := pm.activeProcess.Stop(); err != nil {
		vlogger.AppLogger.Errorf("无法停止进程: %v", err)
		return fmt.Errorf("无法停止进程: %w", err)
	}

	return nil
}

// IsRunning 检查由管理器控制的进程当前是否正在运行
func (pm *ProcessManager) IsRunning() bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.activeProcess == nil {
		return false
	}
	return pm.activeProcess.IsRunning()
}

// GetStatus 获取当前运行进程的状态
func (pm *ProcessManager) GetStatus() (entity.ProcessState, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.activeProcess == nil || !pm.activeProcess.IsRunning() {
		return entity.ProcessState{}, fmt.Errorf("进程未在运行")
	}
	return pm.activeProcess.GetStatus()
}

// SendCommand 向当前运行的进程发送一个命令
func (pm *ProcessManager) SendCommand(command string) error {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.activeProcess == nil || !pm.activeProcess.IsRunning() {
		return fmt.Errorf("进程未在运行，无法发送命令")
	}
	return pm.activeProcess.SendCommand(command)
}
