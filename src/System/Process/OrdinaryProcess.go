package process

import (
	"fmt"
	"path/filepath"
	"voxesis/src/Common/Entity"
	BaseProcess "voxesis/src/System/Process/Base"
)

type OrdinaryProcess struct {
	manager *BaseProcess.ProcessManager
	path    string
}

func NewOrdinaryProcess(path string) *OrdinaryProcess {
	return &OrdinaryProcess{
		path: path,
	}
}

func (m *OrdinaryProcess) Start(logCallback func(log string), args []string) error {
	// 如果已有实例在运行，先停止
	if m.manager != nil && m.manager.IsRunning() {
		if err := m.manager.Stop(); err != nil {
			return fmt.Errorf("无法停止正在运行的旧服务器: %w", err)
		}
	}

	// 创建一个新的底层管理器
	var err error
	if m.manager, err = BaseProcess.NewProcessManager(m.path); err != nil {
		return err
	}

	// 输出回调
	m.manager.SetOutputCallback(func(log string) {
		go logCallback(log)
	})

	// 启动进程
	workingDir := filepath.Dir(m.path)
	return m.manager.Start(workingDir, args...)
}

func (m *OrdinaryProcess) Stop() error {
	if m.manager == nil || !m.manager.IsRunning() {
		return nil // 未运行，视为成功停止
	}
	return m.manager.Stop()
}

func (m *OrdinaryProcess) SendCommand(command string) error {
	if m.manager == nil || !m.manager.IsRunning() {
		return fmt.Errorf("服务器未在运行")
	}
	return m.manager.SendCommand(command)
}

// IsRunning 检查服务器是否在运行。
func (m *OrdinaryProcess) IsRunning() bool {
	if m.manager == nil {
		return false
	}
	return m.manager.IsRunning()
}

// GetStatus 获取服务器进程的状态。
func (m *OrdinaryProcess) GetStatus() (entity.ProcessState, error) {
	if m.manager == nil || !m.manager.IsRunning() {
		return entity.ProcessState{}, fmt.Errorf("服务器未在运行")
	}
	return m.manager.GetProcessStatus()
}
