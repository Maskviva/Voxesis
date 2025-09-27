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

type ConPtyProcessIpc struct {
	uuidMap map[string]*process.ConPtyProcess
}

func findPtyProcess(p *ConPtyProcessIpc, uuid string) (*string, *process.ConPtyProcess) {
	ptyProcess, ok := p.uuidMap[uuid]
	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的ConPtyProcess实例", uuid)
		return &err, nil
	}

	return nil, ptyProcess
}

func (p *ConPtyProcessIpc) NewConPtyProcess(relPath string, abs bool) (*string, *string) {
	if p.uuidMap == nil {
		p.uuidMap = make(map[string]*process.ConPtyProcess)
	}

	if !abs {
		relPath = path.Join(vcommon.AppDir, relPath)
	}
	fmt.Println(relPath, abs)
	if _, err := os.Stat(relPath); err != nil {
		e := fmt.Sprintf("文件路径 %s 不存在", relPath)
		return nil, &e
	}

	u := uuid.New()
	uuidStr := u.String()

	p.uuidMap[uuidStr] = process.NewConPtyProcess(relPath)

	return &uuidStr, nil
}

func (p *ConPtyProcessIpc) ConPtyProcessStart(uuid string, outputEventName string, args []string) *string {
	ferr, ConPtyProcess := findPtyProcess(p, uuid)

	if ferr != nil {
		return ferr
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
	ferr, ConPtyProcess := findPtyProcess(p, uuid)

	if ferr != nil {
		return ferr
	}

	if err := ConPtyProcess.Stop(); err != nil {
		e := fmt.Sprintf("uuid为 %s 停止普通进程失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *ConPtyProcessIpc) SendCommandToConPtyProcess(uuid string, command string) *string {
	ferr, ConPtyProcess := findPtyProcess(p, uuid)

	if ferr != nil {
		return ferr
	}

	if err := ConPtyProcess.SendCommand(command); err != nil {
		e := fmt.Sprintf("uuid为 %s 发送命令失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return &e
	}

	return nil
}

func (p *ConPtyProcessIpc) GetConPtyProcessStatus(uuid string) (*entity.ProcessState, *string) {
	ferr, ConPtyProcess := findPtyProcess(p, uuid)

	if ferr != nil {
		return nil, ferr
	}

	status, err := ConPtyProcess.GetStatus()
	if err != nil {
		e := fmt.Sprintf("uuid为 %s 获取进程状态失败: %e", uuid, err)
		vlogger.AppLogger.Error(e)
		return nil, &e
	}
	return &status, nil
}
