package v_web_controller

import (
	vmanager "voxesis/src/Common/Manager"
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
)

type Config struct {
}

func (c *Config) NewConfigManager(context *gin.Context) {
	var data map[string]interface{}

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, []interface{}{nil, err.Error()})
		return
	}

	if data["managerType"] == nil || data["filePath"] == nil || data["abs"] == nil {
		context.JSON(400, []interface{}{nil, "missing required fields"})
		return
	}

	managerType, ok := data["managerType"].(float64)
	if !ok {
		context.JSON(400, []interface{}{nil, "invalid managerType type"})
		return
	}

	uuid, err := communication.ConfigIpc.NewConfigManager(vmanager.ConfigType(managerType), data["filePath"].(string), data["abs"].(bool))
	if err != nil {
		context.JSON(400, []interface{}{nil, *err})
		return
	}

	context.JSON(200, []interface{}{*uuid, nil})
}

func (c *Config) GetValueOfKey(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if data["uuid"] == "" || data["key"] == "" || data["value"] == "" || data["section"] == "" {
		context.JSON(400, gin.H{"error": "missing required fields"})
		return
	}

	if err := communication.ConfigIpc.SetValueOfKey(data["uuid"], data["key"], data["value"], data["section"]); err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}

	context.JSON(200, nil)
}

func (c *Config) GetAllValue(context *gin.Context) {
	var data map[string]string

	if err := context.ShouldBindJSON(&data); err != nil {
		context.JSON(200, []interface{}{nil, err.Error()})
		return
	}

	if data["uuid"] == "" {
		context.JSON(200, []interface{}{nil, "missing required fields"})
		return
	}

	values, err := communication.ConfigIpc.GetAllValue(data["uuid"])
	if err != nil {
		context.JSON(200, []interface{}{nil, *err})
		return
	}

	context.JSON(200, []interface{}{values, nil})
}

func (c *Config) SetValueOfKey(context *gin.Context) {
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

func (c *Config) DelValueOfKey(context *gin.Context) {
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
