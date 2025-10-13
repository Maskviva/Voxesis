package entity

type PluginType string

const (
	View  PluginType = "view"
	Theme PluginType = "theme"
)

type Plugin struct {
	PluginName string
	PluginType PluginType
	Manifest   []byte
}
