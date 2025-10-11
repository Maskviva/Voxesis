package v_web_api

import (
	vwebcontroller "voxesis/src/Communication/InterHttp"

	"github.com/gin-gonic/gin"
)

func Plugins(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Plugins{}

	group.POST("/LoadPlugins", ctrl.LoadPlugins)
	group.GET("/GetPluginList", ctrl.GetPluginList)
}
