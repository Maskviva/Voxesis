package v_web_api

import (
	vwebcontroller "voxesis/src/Communication/InterHttp"

	"github.com/gin-gonic/gin"
)

func Config(group *gin.RouterGroup) {
	ctrl := &vwebcontroller.Config{}

	group.POST("/NewConfigManager", ctrl.NewConfigManager)
	group.POST("/GetValueOfKey", ctrl.GetValueOfKey)
	group.POST("/GetAllValue", ctrl.GetAllValue)
	group.PATCH("/SetValueOfKey", ctrl.SetValueOfKey)
	group.DELETE("/DelValueOfKey", ctrl.DelValueOfKey)
}
