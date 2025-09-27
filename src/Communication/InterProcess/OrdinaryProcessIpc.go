package InterProcess

import (
	"fmt"
	"os"
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

func findOrdinaryProcess(p *OrdinaryProcessIpc, uuid string) (*string, *process.OrdinaryProcess) {
	ordinaryProcess, ok := p.uuidMap[uuid]
	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的OrdinaryProcess实例", uuid)
		return &err, nil
	}

	return nil, ordinaryProcess
}

func (p *OrdinaryProcessIpc) NewOrdinaryProcess(relPath string, abs bool) (*string, *string) {
	if p.uuidMap == nil {
		p.uuidMap = make(map[string]*process.OrdinaryProcess)
	}

	if !abs {
		relPath = path.Join(vcommon.AppDir, relPath)
	}

	if _, err := os.Stat(relPath); os.IsNotExist(err) {
		e := fmt.Sprintf("文件路径 %s 不存在", relPath)
		return nil, &e
	}

	u := uuid.New()
	uuidStr := u.String()

	p.uuidMap[uuidStr] = process.NewOrdinaryProcess(relPath)

	return &uuidStr, nil
}

func (p *OrdinaryProcessIpc) OrdinaryProcessStart(uuid string, outputEventName string, args []string) *string {
	ferr, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if ferr != nil {
		return ferr
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
	ferr, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if ferr != nil {
		return ferr
	}

	if err := ordinaryProcess.Stop(); err != nil {
		e := fmt.Sprintf("uuid为 %s 停止普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *OrdinaryProcessIpc) SendCommandToOrdinaryProcess(uuid string, command string) *string {
	ferr, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if ferr != nil {
		return ferr
	}

	if err := ordinaryProcess.SendCommand(command); err != nil {
		e := fmt.Sprintf("uuid为 %s 发送命令失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *OrdinaryProcessIpc) GetOrdinaryProcessStatus(uuid string) (*entity.ProcessState, *string) {
	ferr, ordinaryProcess := findOrdinaryProcess(p, uuid)

	if ferr != nil {
		return nil, ferr
	}

	status, err := ordinaryProcess.GetStatus()
	if err != nil {
		e := fmt.Sprintf("uuid为 %s 获取进程状态失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return nil, &e
	}
	return &status, nil
}
