package inter_http

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
	vwebroutes "voxesis/src/Communication/InterHttp/Routes"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

var App = gin.Default()

func Init(assets embed.FS) {
	distFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		panic(err)
	}

	vwebroutes.ApiRoutes(App)

	App.StaticFS("/view", http.FS(distFS))

	App.Use(static.Serve("/plugins", static.LocalFile(path.Join(vcommon.AppDir, "plugins"), true)))

	App.GET("/assets/*filepath", func(c *gin.Context) {
		c.FileFromFS(c.Request.URL.Path, http.FS(distFS))
	})
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
