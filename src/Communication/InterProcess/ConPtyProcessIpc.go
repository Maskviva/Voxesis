package InterProcess

import (
	"fmt"
	"path"
	vcommon "voxesis/src/Common"
	entity "voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"
	process "voxesis/src/System/Process"

	"github.com/google/uuid"
)

type ConPtyProcessIpc struct {
	uuidMap map[string]*process.ConPtyProcess
}

func findPtyProcess(p *ConPtyProcessIpc, uuid string) (bool, *process.ConPtyProcess) {
	logger, ok := p.uuidMap[uuid]
	if !ok {
		return false, nil
	}

	return true, logger
}

func (p *ConPtyProcessIpc) NewConPtyProcess(relPath string) *string {
	u := uuid.New()
	uuidStr := u.String()

	pPath := path.Join(vcommon.AppDir, relPath)

	p.uuidMap[uuidStr] = process.NewConPtyProcess(pPath)

	return &uuidStr
}

func (p *ConPtyProcessIpc) ConPtyProcessStart(uuid string, outputEventName string, args []string) *string {
	ok, ConPtyProcess := findPtyProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的ConPtyProcess实例", uuid)
		return &err
	}

	err := ConPtyProcess.Start(func(log string) {
		vcommon.App.EmitEvent(outputEventName, log)
	}, args)

	if err != nil {
		e := fmt.Sprintf("uuid为 %s 启动普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *ConPtyProcessIpc) ConPtyProcessStop(uuid string) *string {
	ok, ConPtyProcess := findPtyProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的ConPtyProcess实例", uuid)
		return &err
	}

	if err := ConPtyProcess.Stop(); err != nil {
		e := fmt.Sprintf("uuid为 %s 停止普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *ConPtyProcessIpc) SendCommandToConPtyProcess(uuid string, command string) *string {
	ok, ConPtyProcess := findPtyProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的ConPtyProcess实例", uuid)
		return &err
	}

	if err := ConPtyProcess.SendCommand(command); err != nil {
		e := fmt.Sprintf("uuid为 %s 发送命令失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *ConPtyProcessIpc) GetConPtyProcessStatus(uuid string) (*entity.ProcessState, *string) {
	ok, ConPtyProcess := findPtyProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的ConPtyProcess实例", uuid)
		return nil, &err
	}

	status, err := ConPtyProcess.GetStatus()
	if err != nil {
		e := fmt.Sprintf("uuid为 %s 获取进程状态失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return nil, &e
	}
	return &status, nil
}
