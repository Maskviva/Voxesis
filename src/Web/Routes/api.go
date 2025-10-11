package v_web_routes

import (
	vwebapi "voxesis/src/Web/Routes/Api"

	"github.com/gin-gonic/gin"
)

func ApiRoutes(r *gin.RouterGroup) {
	group := r.Group("/api")

	vwebapi.Config(group.Group("/config"))
	vwebapi.Logger(group.Group("/logger"))

	vwebapi.Process(group.Group("/process"))
	vwebapi.Plugins(group.Group("/plugins"))

	vwebapi.Utils(group.Group("/utils"))
}
