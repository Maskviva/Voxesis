package v_config

import (
	"context"
)

type BaseIni interface {
	// GetSections 读取INI配置并解析为map[string]map[string]string
	GetSections() (map[string]map[string]string, error)

	// SetSections 将map[string]map[string]string序列化为INI并写入配置文件
	SetSections(sections map[string]map[string]string) error

	// GetSection 获取INI配置中的特定节
	GetSection(sectionName string) (map[string]string, error)

	// SetSection 设置INI配置中的特定节
	SetSection(sectionName string, sectionData map[string]string) error

	// GetKey 获取INI配置xi中特定节的键值
	GetKey(sectionName, keyName string) (string, error)

	// SetKey 设置INI配置中特定节的键值
	SetKey(sectionName, keyName, value string) error

	// WatchSections 监听配置文件变更并解析为map[string]map[string]string
	WatchSections(ctx context.Context, callback func(map[string]map[string]string)) error

	// WatchSection 监听配置文件变更并解析为特定节
	WatchSection(ctx context.Context, sectionName string, callback func(map[string]string)) error
}
