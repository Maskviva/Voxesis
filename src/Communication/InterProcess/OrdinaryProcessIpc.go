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

type OrdinaryProcessIpc struct {
	uuidMap map[string]*process.OrdinaryProcess
}

func findOrdinaryProcess(p *OrdinaryProcessIpc, uuid string) (bool, *process.OrdinaryProcess) {
	logger, ok := p.uuidMap[uuid]
	if !ok {
		return false, nil
	}

	return true, logger
}

func (p *OrdinaryProcessIpc) NewOrdinaryProcess(relPath string) *string {
	u := uuid.New()
	uuidStr := u.String()

	pPath := path.Join(vcommon.AppDir, relPath)

	p.uuidMap[uuidStr] = process.NewOrdinaryProcess(pPath)

	return &uuidStr
}

func (p *OrdinaryProcessIpc) OrdinaryProcessStart(uuid string, outputEventName string, args []string) *string {
	ok, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的OrdinaryProcess实例", uuid)
		return &err
	}

	err := ordinaryProcess.Start(func(log string) {
		vcommon.App.EmitEvent(outputEventName, log)
	}, args)

	if err != nil {
		e := fmt.Sprintf("uuid为 %s 启动普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *OrdinaryProcessIpc) OrdinaryProcessStop(uuid string) *string {
	ok, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的OrdinaryProcess实例", uuid)
		return &err
	}

	if err := ordinaryProcess.Stop(); err != nil {
		e := fmt.Sprintf("uuid为 %s 停止普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *OrdinaryProcessIpc) SendCommandToOrdinaryProcess(uuid string, command string) *string {
	ok, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的OrdinaryProcess实例", uuid)
		return &err
	}

	if err := ordinaryProcess.SendCommand(command); err != nil {
		e := fmt.Sprintf("uuid为 %s 发送命令失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *OrdinaryProcessIpc) GetOrdinaryProcessStatus(uuid string) (*entity.ProcessState, *string) {
	ok, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的OrdinaryProcess实例", uuid)
		return nil, &err
	}

	status, err := ordinaryProcess.GetStatus()
	if err != nil {
		e := fmt.Sprintf("uuid为 %s 获取进程状态失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return nil, &e
	}
	return &status, nil
}
