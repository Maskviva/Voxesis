package v_web

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
)

var App = gin.Default()

func Init(assets embed.FS) {
	distFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		panic(err)
	}

	App.StaticFS("/", http.FS(distFS))
	App.Run(":8080")
}
