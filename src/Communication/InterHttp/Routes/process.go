package v_web_routes

import (
	vwebcontroller "voxesis/src/Communication/InterHttp/Controller"

	"github.com/gin-gonic/gin"
)

func Process(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Process{}

	group.POST("/NewProcess", ctrl.NewProcess)
	group.POST("/Start", ctrl.Start)
	group.POST("/Stop", ctrl.Stop)
	group.POST("/SendCommand", ctrl.SendCommand)
	group.POST("/GetProcessStatus", ctrl.GetProcessStatus)
}
