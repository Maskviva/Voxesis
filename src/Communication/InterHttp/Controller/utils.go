package v_web_controller

import (
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
)

type Utils struct {
}

func (u *Utils) GetSystemState(context *gin.Context) {
	state := communication.UtilsIpc.GetSystemState()

	context.JSON(200, state)
}

func (u *Utils) GetBeServerStatus(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["host"] == nil || data["port"] == nil {
		context.JSON(400, gin.H{"error": "host and port are required"})
		return
	}

	status := communication.UtilsIpc.GetBeServerStatus(data["host"].(string), uint16(data["port"].(int)))

	context.JSON(200, status)
}
