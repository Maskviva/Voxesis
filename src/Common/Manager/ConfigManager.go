package v_manager

import (
	"fmt"
	vconfigimpl "voxesis/src/Common/Config/Impl"
)

// ConfigType 配置文件类型枚举
type ConfigType int

const (
	INI ConfigType = iota
	JSON
	PROPERTIES
	YAML
)

// ConfigManager 配置管理器
type ConfigManager struct {
	configType ConfigType
	iniConfig  *vconfigimpl.BaseIniImpl
	jsonConfig *vconfigimpl.BaseJsonImpl
	propConfig *vconfigimpl.BasePropertiesImpl
	yamlConfig *vconfigimpl.BaseYamlImpl
	Path       string
}

// NewConfigManager 创建一个新的配置管理器实例
func NewConfigManager(configType ConfigType, filePath string) (*ConfigManager, error) {
	manager := &ConfigManager{
		configType: configType,
		Path:       filePath,
	}

	var err error
	switch configType {
	case INI:
		manager.iniConfig, err = vconfigimpl.NewBaseIniImpl(filePath)
	case JSON:
		manager.jsonConfig, err = vconfigimpl.NewBaseJsonImpl(filePath)
	case PROPERTIES:
		manager.propConfig, err = vconfigimpl.NewBasePropertiesImpl(filePath)
	case YAML:
		manager.yamlConfig, err = vconfigimpl.NewBaseYamlImpl(filePath)
	default:
		return nil, fmt.Errorf("unsupported config type: %d", configType)
	}

	if err != nil {
		return nil, err
	}

	return manager, nil
}

// GetValueOfKey 获取指定键的值
func (cm *ConfigManager) GetValueOfKey(section, key string) (string, error) {
	switch cm.configType {
	case INI:
		return cm.iniConfig.GetKey(section, key)
	case JSON:
		value, err := cm.jsonConfig.GetValue(key)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("%v", value), nil
	case PROPERTIES:
		return cm.propConfig.GetProperty(key)
	case YAML:
		value, err := cm.yamlConfig.GetValue(key)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("%v", value), nil
	default:
		return "", fmt.Errorf("unsupported config type: %d", cm.configType)
	}
}

// GetAllValue 获取所有配置值
func (cm *ConfigManager) GetAllValue() (interface{}, error) {
	switch cm.configType {
	case INI:
		return cm.iniConfig.GetSections()
	case JSON:
		return cm.jsonConfig.GetMap()
	case PROPERTIES:
		return cm.propConfig.GetProperties()
	case YAML:
		return cm.yamlConfig.GetMap()
	default:
		return nil, fmt.Errorf("unsupported config type: %d", cm.configType)
	}
}

// SetValueOfKey 设置指定键的值
func (cm *ConfigManager) SetValueOfKey(section, key, value string) error {
	switch cm.configType {
	case INI:
		return cm.iniConfig.SetKey(section, key, value)
	case JSON:
		return cm.jsonConfig.SetValue(key, value)
	case PROPERTIES:
		return cm.propConfig.SetProperty(key, value)
	case YAML:
		return cm.yamlConfig.SetValue(key, value)
	default:
		return fmt.Errorf("unsupported config type: %d", cm.configType)
	}
}

// DelValueOfKey 删除指定键的值
func (cm *ConfigManager) DelValueOfKey(key string) error {
	switch cm.configType {
	case JSON:
		return cm.jsonConfig.DeleteValue(key)
	case PROPERTIES:
		return cm.propConfig.DeleteProperty(key)
	default:
		return fmt.Errorf("delete operation not supported for config type: %d", cm.configType)
	}
}
