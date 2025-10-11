package v_web_api

import (
	vcommon "voxesis/src/Common"
	vwebcontroller "voxesis/src/Communication/InterHttp"

	"github.com/gin-gonic/gin"
)

func Process(group *gin.RouterGroup) {
	vcommon.ProcessCtrl = &vwebcontroller.Process{}

	group.POST("/NewProcess", vcommon.ProcessCtrl.NewProcess)
	group.POST("/Start", vcommon.ProcessCtrl.Start)
	group.POST("/Stop", vcommon.ProcessCtrl.Stop)
	group.POST("/SendCommand", vcommon.ProcessCtrl.SendCommand)
	group.POST("/GetProcessStatus", vcommon.ProcessCtrl.GetProcessStatus)
	group.GET("/GetProcessOutput", vcommon.ProcessCtrl.GetProcessOutput)
}
