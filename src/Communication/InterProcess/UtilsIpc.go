package inter_process

import (
	entity "voxesis/src/Common/Entity"
	vlogger "voxesis/src/Common/Logger"
	vutils "voxesis/src/Common/Utils"
)

type UtilsIpc struct {
}

func (u *UtilsIpc) GetSystemState() *entity.SystemState {
	state, err := vutils.GetSystemState()
	if err != nil {
		vlogger.AppLogger.Errorf("获取系统状态失败: %e", err)
		return nil
	}

	return state
}

func (u *UtilsIpc) GetBeServerStatus(host string, port uint16) *entity.BedrockMcServerStatus {
	status, err := vutils.GetBedrockMcServerStatus(host, port)
	if err != nil {
		vlogger.AppLogger.Errorf("ip: %s port: %d 的基岩版服务器状态获取失败: %e", host, port,
			err)
		return nil
	}

	return status
}

func (u *UtilsIpc) HttpRequest(options vutils.HttpRequestOptions) (*string, *string) {
	request, err := vutils.HttpRequest(options)
	if err != nil {
		e := err.Error()
		return nil, &e
	}

	return &request, nil
}
