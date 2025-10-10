package v_web_routes

import (
	vwebcontroller "voxesis/src/Communication/InterHttp/Controller"

	"github.com/gin-gonic/gin"
)

func Plugins(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Plugins{}

	group.POST("/LoadPlugins", ctrl.LoadPlugins)
	group.GET("/GetPluginList", ctrl.GetPluginList)
}
