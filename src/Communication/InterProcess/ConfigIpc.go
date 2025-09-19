package InterProcess

import (
	"fmt"
	"path"
	v_common "voxesis/src/Common"
	vconfig "voxesis/src/Common/Config"
	vconfigimpl "voxesis/src/Common/Config/Impl"
	v_logger "voxesis/src/Common/Logger"
)

type ConfigIpc struct {
}

type ConfigManager struct {
	jsonConfig       vconfig.BaseJson
	yamlConfig       vconfig.BaseYaml
	iniConfig        vconfig.BaseIni
	propertiesConfig vconfig.BaseProperties
}

func (c *ConfigIpc) NewConfigManager(mtype string, filePath string) (*string, *string) {
	var (
		conifgManager ConfigManager
		err           error
	)
	cPath := path.Join(v_common.AppDir, filePath)

	switch mtype {
	case "json":
		conifgManager.jsonConfig, err = vconfigimpl.NewBaseJsonImpl(cPath)
		break
	case "yaml":
		conifgManager.yamlConfig, err = vconfigimpl.NewBaseYamlImpl(cPath)
		break
	case "ini":
		conifgManager.iniConfig, err = vconfigimpl.NewBaseIniImpl(cPath)
		break
	case "properties":
		conifgManager.propertiesConfig, err = vconfigimpl.NewBasePropertiesImpl(cPath)
		break
	}

	if err != nil {
		e := fmt.Sprintf("NewConfigManager error: %v", err)
		v_logger.AppLogger.Error(e)
		return nil, &e
	}

	return &conifgManager, nil
}
