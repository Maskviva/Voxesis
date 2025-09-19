package v_config

import (
	"context"
)

type BaseProperties interface {
	// GetProperties 读取Properties配置并解析为map[string]string
	GetProperties() (map[string]string, error)

	// SetProperties 将map[string]string序列化为Properties格式并写入配置文件
	SetProperties(props map[string]string) error

	// GetProperty 获取Properties中的特定属性值
	GetProperty(key string) (string, error)

	// SetProperty 设置Properties中的特定属性值
	SetProperty(key, value string) error

	// HasProperty 检查是否存在指定的属性
	HasProperty(key string) (bool, error)

	// DeleteProperty 删除指定的属性
	DeleteProperty(key string) error

	// WatchProperties 监听配置文件变更并解析为map[string]string
	WatchProperties(ctx context.Context, callback func(map[string]string)) error

	// WatchProperty 监听配置文件变更并获取特定属性的值
	WatchProperty(ctx context.Context, key string, callback func(string)) error
}
