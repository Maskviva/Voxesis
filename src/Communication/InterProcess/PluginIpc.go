package InterProcess

import (
	entity "voxesis/src/Common/Entity"
	vplugins "voxesis/src/Common/Plugins"
)

type PluginIpc struct {
}

func (p *PluginIpc) GetPluginList() (*[]entity.Plugin, *string) {
	plugins, err := vplugins.GetPluginList()
	if err != nil {
		e := err.Error()
		return nil, &e
	}

	return plugins, nil
}
