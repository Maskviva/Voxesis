package v_web_routes

import (
	"github.com/gin-gonic/gin"
)

func ApiRoutes(r *gin.Engine) {
	group := r.Group("/api")

	Config(group.Group("/config"))
	Logger(group.Group("/logger"))

	Process(group.Group("/process"))
	Plugins(group.Group("/plugins"))

	Utils(group.Group("/utils"))
}
