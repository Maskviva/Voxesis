package v_web_routes

import (
	vwebcontroller "voxesis/src/Web/Controller"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(r *gin.Engine) {
	group := r.Group("/api")

	group.POST("/login", vwebcontroller.Login)
}
