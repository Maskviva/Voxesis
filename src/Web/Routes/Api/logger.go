package v_web_api

import (
	vwebcontroller "voxesis/src/Communication/InterHttp"

	"github.com/gin-gonic/gin"
)

func Logger(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Logger{}

	group.POST("/NewLogger", ctrl.NewLogger)
	group.POST("/CloseLogger", ctrl.CloseLogger)
	group.POST("/LogInfo", ctrl.LogInfo)
	group.POST("/LogDebug", ctrl.LogDebug)
	group.POST("/LogWarn", ctrl.LogWarn)
	group.POST("/LogError", ctrl.LogError)
}
