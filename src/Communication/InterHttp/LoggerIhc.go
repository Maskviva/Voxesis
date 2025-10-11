package inter_http

import (
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
)

type Logger struct {
}

func (c *Logger) NewLogger(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["logDir"] == nil || data["logFileName"] == nil || data["date"] == nil {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	uuid, err := communication.LoggerIpc.NewLogger(data["logDir"].(string), data["logFileName"].(string), data["date"].(bool))
	if err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, *uuid)
}

func (c *Logger) CloseLogger(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	if err := communication.LoggerIpc.CloseLogger(data["uuid"]); err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}

func (c *Logger) LogInfo(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" || data["logLine"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	err := communication.LoggerIpc.LogInfo(data["uuid"], data["logLine"])
	if err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}

func (c *Logger) LogDebug(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	err := communication.ConfigIpc.SetValueOfKey(data["uuid"], data["key"], data["value"], data["section"])
	if err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}

func (c *Logger) LogWarn(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	err := communication.ConfigIpc.DelValueOfKey(data["uuid"], data["key"])
	if err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}

func (c *Logger) LogError(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	err := communication.ConfigIpc.DelValueOfKey(data["uuid"], data["key"])
	if err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}
