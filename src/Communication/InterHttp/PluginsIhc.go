package inter_http

import (
	communication "voxesis/src/Communication"

	"github.com/gin-gonic/gin"
)

type Plugins struct {
}

func (p *Plugins) LoadPlugins(context *gin.Context) {
	if err := communication.PluginIpc.LoadPlugins(); err != nil {
		context.JSON(400, gin.H{"error": *err})
		return
	}
	context.JSON(200, nil)
}

func (p *Plugins) GetPluginList(context *gin.Context) {
	plugins := communication.PluginIpc.GetPluginList()

	context.JSON(200, plugins)
}
