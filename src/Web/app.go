package v_web

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	vcommon "voxesis/src/Common"
	vlogger "voxesis/src/Common/Logger"
	vwebmiddlewares "voxesis/src/Web/Middlewares"
	vwebroutes "voxesis/src/Web/Routes"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

var (
	//go:embed Resources/Public
	publicFS embed.FS
	App      = gin.Default()
)

func Init(assets embed.FS) {
	distFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		panic(err)
	}

	vwebroutes.AuthRoutes(App)

	App.GET("/login", func(c *gin.Context) {
		c.FileFromFS("Resources/Public/login.html", http.FS(publicFS))
	})

	App.GET("/login/logo_no_background.png", func(c *gin.Context) {
		c.FileFromFS("Resources/Public/logo_no_background.png", http.FS(publicFS))
	})

	App.Use(vwebmiddlewares.AutoCookie(), static.Serve("/plugins", static.LocalFile(path.Join(vcommon.AppDir, "plugins"), true)))

	authorized := App.Group("/")
	authorized.Use(vwebmiddlewares.AutoCookie())
	{
		vwebroutes.ApiRoutes(authorized)

		authorized.StaticFS("/dashboard", http.FS(distFS))

		authorized.GET("/assets/*filepath", func(c *gin.Context) {
			c.FileFromFS(c.Request.URL.Path, http.FS(distFS))
		})
	}
}

func Run() error {
	err := App.Run(fmt.Sprintf(":%d", getPort()))
	if err != nil {
		vlogger.AppLogger.Error(err)
		return err
	}

	return nil
}

func getPort() int {
	file, err := os.ReadFile(path.Join(vcommon.AppDir, "config/app.config.json"))
	if err != nil {
		vlogger.AppLogger.Error(err)
		return 8080
	}
	var data map[string]interface{}

	err = json.Unmarshal(file, &data)
	if err != nil {
		vlogger.AppLogger.Error(err)
		return 8080
	}

	if data["ihc_port"] == nil {
		return 8080
	}

	_, ok := data["ihc_port"].(int)
	if !ok {
		return 8080
	}

	return data["ihc_port"].(int)
}
