package inter_process

import (
	"fmt"
	"path"
	"sync"
	"time"
	vcommon "voxesis/src/Common"
	entity "voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"
	vmanager "voxesis/src/Common/Manager"
	vutils "voxesis/src/Common/Utils"
)

type Process struct {
	logBuffer      *vutils.RateLimitBuffer
	precessManager *vmanager.ProcessManager
}

type ProcessIpc struct {
	ProcessMap map[int]Process
	NextID     int
	mu         sync.RWMutex
}

func (p *ProcessIpc) NewProcess(processType vmanager.ProcessType, abs bool, relPath string, args ...string) int {
	p.mu.Lock()
	defer p.mu.Unlock()
	id := p.NextID

	if !abs {
		relPath = path.Join(vcommon.AppDir, relPath)
	}

	// 检查该路径是否已经存在
	for id, manager := range p.ProcessMap {
		if manager.precessManager.Path == relPath && manager.precessManager.ProcessType == processType {
			return id
		}
	}

	p.ProcessMap[id] = Process{
		logBuffer: vutils.NewRateLimitBuffer(10*time.Millisecond, func(data interface{}) {
			vcommon.App.EmitEvent(fmt.Sprintf("process-%d-output", id), data)
		}),
		precessManager: vmanager.NewProcessManager(processType, relPath, args...),
	}
	p.NextID++
	return id
}

func (p *ProcessIpc) getProcess(id int) (Process, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	proc, ok := p.ProcessMap[id]
	if !ok {
		return Process{}, fmt.Errorf("ID为 %d 的进程未找到", id)
	}
	return proc, nil
}

// Start 启动指定ID的进程。
// 返回一个 string 类型的错误信息，如果成功则为空字符串。
func (p *ProcessIpc) Start(id int) *string {
	proc, err := p.getProcess(id)
	if err != nil {
		e := err.Error()
		vlogger.AppLogger.Error(err.Error())
		return &e
	}

	err = proc.precessManager.Start(func(log string) {
		proc.logBuffer.Add(log)
	})

	if err != nil {
		e := fmt.Sprintf("启动ID为 %d 的进程失败: %v", id, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

// Stop 停止指定ID的进程。
func (p *ProcessIpc) Stop(id int) *string {
	proc, err := p.getProcess(id)
	if err != nil {
		e := err.Error()
		return &e
	}

	err = proc.precessManager.Stop()
	if err != nil {
		e := fmt.Sprintf("停止ID为 %d 的进程失败: %v", id, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

// SendCommand 向指定ID的进程发送命令。
func (p *ProcessIpc) SendCommand(id int, command string) *string {
	proc, err := p.getProcess(id)
	if err != nil {
		e := err.Error()
		return &e
	}

	err = proc.precessManager.SendCommand(command)
	if err != nil {
		e := fmt.Sprintf("向ID为 %d 的进程发送命令失败: %v", id, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

// GetProcessStatus 获取指定ID进程的状态。
// 返回 (状态指针, 错误信息字符串)
func (p *ProcessIpc) GetProcessStatus(id int) (*entity.ProcessState, *string) {
	proc, err := p.getProcess(id)
	if err != nil {
		e := err.Error()
		return nil, &e
	}

	status, err := proc.precessManager.GetStatus()
	if err != nil {
		e := fmt.Sprintf("获取ID为 %d 的进程状态失败: %v", id, err)
		vlogger.AppLogger.Error(e)
		return nil, &e
	}

	return &status, nil
}
