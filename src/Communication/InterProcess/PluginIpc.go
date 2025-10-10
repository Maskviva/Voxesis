package inter_process

import (
	entity "voxesis/src/Common/Entity"
	vmanager "voxesis/src/Common/Manager"
)

type PluginIpc struct {
	PluginManager *vmanager.PluginManager
}

func (p *PluginIpc) LoadPlugins() *string {
	p.PluginManager = vmanager.NewPluginManager()

	if err := p.PluginManager.LoadPlugins(); err != nil {
		e := err.Error()
		return &e
	}

	return nil
}

func (p *PluginIpc) GetPluginList() *[]entity.Plugin {
	var pluginList []entity.Plugin

	for _, value := range p.PluginManager.Plugins {
		pluginList = append(pluginList, value)
	}

	return &pluginList
}
