package v_common

import (
	"github.com/gin-gonic/gin"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type processController interface {
	NewProcess(c *gin.Context)
	Start(c *gin.Context)
	Stop(c *gin.Context)
	SendCommand(c *gin.Context)
	GetProcessStatus(c *gin.Context)
	GetProcessOutput(c *gin.Context)
	WriteProcessOutput(uuid int, output string)
}

var (
	App       *application.App
	AppDir    string
	PluginDir string

	ProcessCtrl processController
)
