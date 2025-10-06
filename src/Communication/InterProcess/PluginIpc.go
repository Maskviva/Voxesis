package InterProcess

import (
	entity "voxesis/src/Common/Entity"
	vmanager "voxesis/src/Common/Manager"
)

type PluginIpc struct {
	pluginManager *vmanager.PluginManager
}

func (p *PluginIpc) LoadPlugins() *string {
	p.pluginManager = vmanager.NewPluginManager()

	if err := p.pluginManager.LoadPlugins(); err != nil {
		e := err.Error()
		return &e
	}

	return nil
}

func (p *PluginIpc) GetPluginList() *[]entity.Plugin {
	var pluginList []entity.Plugin

	for _, value := range p.pluginManager.Plugins {
		pluginList = append(pluginList, value)
	}

	return &pluginList
}
