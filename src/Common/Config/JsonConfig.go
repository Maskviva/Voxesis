package v_config

import (
	"context"
)

type BaseJson interface {
	// GetStruct 读取JSON配置并解析到结构体中
	GetStruct(v interface{}) error

	// SetStruct 将结构体序列化为JSON并写入配置文件
	SetStruct(v interface{}) error

	// GetMap 读取JSON配置并解析为map[string]interface{}
	GetMap() (map[string]interface{}, error)

	// SetMap 将map[string]interface{}序列化为JSON并写入配置文件
	SetMap(m map[string]interface{}) error

	// GetValue 获取JSON中的特定字段值
	GetValue(key string) (interface{}, error)

	// SetValue 设置JSON中的特定字段值
	SetValue(key string, value interface{}) error

	// WatchStruct 监听配置文件变更并解析到结构体中
	WatchStruct(ctx context.Context, callback func(interface{}), structFactory func() interface{}) error

	// WatchMap 监听配置文件变更并解析为map[string]interface{}
	WatchMap(ctx context.Context, callback func(map[string]interface{})) error
}
