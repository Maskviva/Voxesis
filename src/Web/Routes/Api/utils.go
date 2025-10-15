package v_web_api

import (
	vwebcontroller "voxesis/src/Communication/InterHttp"

	"github.com/gin-gonic/gin"
)

func Utils(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Utils{}

	group.GET("/GetSystemState", ctrl.GetSystemState)
	group.POST("/GetBeServerStatus", ctrl.GetBeServerStatus)
	group.POST("/HttpRequest", ctrl.HttpRequest)
}
