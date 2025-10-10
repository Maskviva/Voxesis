package v_web_controller

import (
	"net/http"
	vlogger "voxesis/src/Common/Logger"
	vmanager "voxesis/src/Common/Manager"
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Process struct {
	ws *websocket.Conn
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

func (p *Process) GetProcessOutput(context *gin.Context) {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	var err error
	p.ws, err = upgrader.Upgrade(context.Writer, context.Request, nil)
	if err != nil {
		vlogger.AppLogger.Error(err.Error())
		return
	}

	go func() {
		defer p.ws.Close()
		for {
			if _, _, err := p.ws.ReadMessage(); err != nil {
				p.ws = nil
				return
			}
		}
	}()
}

func (p *Process) WriteProcessOutput(uuid int, output string) {
	if p.ws == nil {
		return
	}

	message := map[string]interface{}{
		"uuid": uuid,
		"data": output,
	}

	if err := p.ws.WriteJSON(message); err != nil {
		p.ws = nil
	}
}
