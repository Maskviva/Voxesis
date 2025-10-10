package v_web_controller

import (
	vlogger "voxesis/src/Common/Logger"
	vmanager "voxesis/src/Common/Manager"
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
)

type Process struct {
}

func (p *Process) NewProcess(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		vlogger.AppLogger.Error(err.Error())
		context.JSON(400, nil)
		return
	}

	processType, ok := data["processType"].(float64)
	if !ok {
		context.JSON(400, []interface{}{nil, "invalid processType type"})
		return
	}

	abs, ok := data["abs"].(bool)
	if !ok {
		context.JSON(400, []interface{}{nil, "invalid abs type"})
		return
	}

	relPath, ok := data["relPath"].(string)
	if !ok {
		context.JSON(400, []interface{}{nil, "invalid relPath type"})
		return
	}

	var args []string
	if argsData, exists := data["args"]; exists && argsData != nil {
		argsInterface, ok := argsData.([]interface{})
		if !ok {
			context.JSON(400, []interface{}{nil, "invalid args type"})
			return
		}

		args = make([]string, len(argsInterface))
		for i, arg := range argsInterface {
			argStr, ok := arg.(string)
			if !ok {
				context.JSON(400, []interface{}{nil, "invalid argument type in args"})
				return
			}
			args[i] = argStr
		}
	}

	uuid := communication.ProcessIpc.NewProcess(vmanager.ProcessType(processType), abs, relPath, args...)

	context.JSON(200, uuid)
}

func (p *Process) Start(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, err.Error())
		return
	}

	uuid, ok := data["uuid"].(float64)
	if !ok {
		context.JSON(400, "invalid uuid type")
		return
	}

	err := communication.ProcessIpc.Start(int(uuid))
	if err != nil {
		context.JSON(400, *err)
		return
	}
	context.JSON(200, nil)
}

func (p *Process) Stop(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, err.Error())
		return
	}

	uuid, ok := data["uuid"].(float64)
	if !ok {
		context.JSON(400, "invalid uuid type")
		return
	}

	err := communication.ProcessIpc.Stop(int(uuid))
	if err != nil {
		context.JSON(400, *err)
		return
	}
	context.JSON(200, nil)
}

func (p *Process) SendCommand(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, err.Error())
		return
	}

	uuid, ok := data["uuid"].(float64)
	if !ok {
		context.JSON(400, "invalid uuid type")
		return
	}

	err := communication.ProcessIpc.SendCommand(int(uuid), data["command"].(string))
	if err != nil {
		context.JSON(400, *err)
		return
	}
	context.JSON(200, nil)
}

func (p *Process) GetProcessStatus(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(200, []interface{}{nil, err.Error()})
		return
	}

	uuid, ok := data["uuid"].(float64)
	if !ok {
		context.JSON(200, []interface{}{nil, "invalid uuid type"})
		return
	}

	state, err := communication.ProcessIpc.GetProcessStatus(int(uuid))

	if err != nil {
		context.JSON(200, []interface{}{nil, *err})
		return
	}

	context.JSON(200, []interface{}{*state, nil})
}
