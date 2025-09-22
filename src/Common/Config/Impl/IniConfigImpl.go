package v_config_impl

import (
	"context"
	vconfig "voxesis/src/Common/Config"

	"gopkg.in/ini.v1"
)

// BaseIniImpl INI配置文件管理类，继承自BaseConfigImpl
type BaseIniImpl struct {
	*BaseConfigImpl // 嵌入基础配置类
}

// NewBaseIniImpl 创建新的INI配置实例
func NewBaseIniImpl(filePath string) (*BaseIniImpl, error) {
	// 创建基础配置实例
	BaseConfigImpl, err := NewBaseConfigImpl(filePath)
	if err != nil {
		return nil, err
	}

	// 验证或初始化INI文件内容
	if err := validateOrCreateINI(BaseConfigImpl); err != nil {
		return nil, err
	}

	return &BaseIniImpl{
		BaseConfigImpl: BaseConfigImpl,
	}, nil
}

// validateOrCreateINI 验证或创建有效的INI文件
func validateOrCreateINI(config *BaseConfigImpl) error {
	data, err := config.Get()
	if err != nil {
		return err
	}

	// 如果文件为空，写入一个空的INI注释
	if len(data) == 0 {
		return config.Set([]byte("# Voxesis INI Configuration\n"))
	}

	// 验证是否为有效的INI
	_, err = ini.Load(config.Path())
	return err
}

// GetSections 读取INI配置并解析为map[string]map[string]string
func (i *BaseIniImpl) GetSections() (map[string]map[string]string, error) {
	cfg, err := ini.Load(i.Path())
	if err != nil {
		return nil, err
	}

	result := make(map[string]map[string]string)
	for _, section := range cfg.Sections() {
		sectionMap := make(map[string]string)
		for _, key := range section.Keys() {
			sectionMap[key.Name()] = key.Value()
		}
		result[section.Name()] = sectionMap
	}

	return result, nil
}

// SetSections 将map[string]map[string]string序列化为INI并写入配置文件
func (i *BaseIniImpl) SetSections(sections map[string]map[string]string) error {
	cfg := ini.Empty()

	for sectionName, sectionData := range sections {
		section, err := cfg.NewSection(sectionName)
		if err != nil {
			return err
		}

		for key, value := range sectionData {
			_, err := section.NewKey(key, value)
			if err != nil {
				return err
			}
		}
	}

	return cfg.SaveTo(i.Path())
}

// GetSection 获取INI配置中的特定节
func (i *BaseIniImpl) GetSection(sectionName string) (map[string]string, error) {
	cfg, err := ini.Load(i.Path())
	if err != nil {
		return nil, err
	}

	section := cfg.Section(sectionName)
	result := make(map[string]string)

	for _, key := range section.Keys() {
		result[key.Name()] = key.Value()
	}

	return result, nil
}

// SetSection 设置INI配置中的特定节
func (i *BaseIniImpl) SetSection(sectionName string, sectionData map[string]string) error {
	sections, err := i.GetSections()
	if err != nil {
		// 如果读取失败，创建一个新的sections map
		sections = make(map[string]map[string]string)
	}

	sections[sectionName] = sectionData
	return i.SetSections(sections)
}

// GetKey 获取INI配置中特定节的键值
func (i *BaseIniImpl) GetKey(sectionName, keyName string) (string, error) {
	cfg, err := ini.Load(i.Path())
	if err != nil {
		return "", err
	}

	section, err := cfg.GetSection(sectionName)
	if err != nil {
		return "", err
	}

	key, err := section.GetKey(keyName)
	if err != nil {
		return "", err
	}

	return key.Value(), nil
}

// SetKey 设置INI配置中特定节的键值
func (i *BaseIniImpl) SetKey(sectionName, keyName, value string) error {
	sections, err := i.GetSections()
	if err != nil {
		// 如果读取失败，创建一个新的sections map
		sections = make(map[string]map[string]string)
	}

	// 确保节存在
	if sections[sectionName] == nil {
		sections[sectionName] = make(map[string]string)
	}

	sections[sectionName][keyName] = value
	return i.SetSections(sections)
}

// WatchSections 监听配置文件变更并解析为map[string]map[string]string
func (i *BaseIniImpl) WatchSections(ctx context.Context, callback func(map[string]map[string]string)) error {
	return i.Watch(ctx, func(data []byte) {
		// 重新从文件加载，因为data可能不是最新的
		if sections, err := i.GetSections(); err == nil {
			callback(sections)
		}
	})
}

// WatchSection 监听配置文件变更并解析为特定节
func (i *BaseIniImpl) WatchSection(ctx context.Context, sectionName string, callback func(map[string]string)) error {
	return i.Watch(ctx, func(data []byte) {
		// 重新从文件加载，因为data可能不是最新的
		if section, err := i.GetSection(sectionName); err == nil {
			callback(section)
		}
	})
}

// 验证接口实现
var _ vconfig.BaseIni = (*BaseIniImpl)(nil)
