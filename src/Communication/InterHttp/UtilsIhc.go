package inter_http

import (
	vutils "voxesis/src/Common/Utils"
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

func (u *Utils) HttpRequest(context *gin.Context) {
	var data vutils.HttpRequestOptions

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, []interface{}{nil, err.Error()})
		return
	}

	result, err := vutils.HttpRequest(data)
	if err != nil {
		context.JSON(500, []interface{}{nil, err.Error()})
		return
	}

	context.JSON(200, []interface{}{result, nil})
}
