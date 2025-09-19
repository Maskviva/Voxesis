package v_config_impl

import (
	"context"
	"encoding/json"
)

// BaseJsonImpl JSON配置文件管理类，继承自BaseConfig
type BaseJsonImpl struct {
	*BaseConfig // 嵌入基础配置类
}

// NewBaseJsonImpl 创建新的JSON配置实例
// 确保文件内容是有效的JSON格式
func NewBaseJsonImpl(filePath string) (*BaseJsonImpl, error) {
	// 创建基础配置实例
	baseConfig, err := NewBaseConfig(filePath)
	if err != nil {
		return nil, err
	}

	// 验证或初始化JSON文件内容
	if err := validateOrCreateJSON(baseConfig); err != nil {
		return nil, err
	}

	return &BaseJsonImpl{
		BaseConfig: baseConfig,
	}, nil
}

// validateOrCreateJSON 验证或创建有效的JSON文件
func validateOrCreateJSON(config *BaseConfig) error {
	data, err := config.Get()
	if err != nil {
		return err
	}

	// 如果文件为空，写入一个空的JSON对象
	if len(data) == 0 {
		return config.Set([]byte("{}"))
	}

	// 验证是否为有效的JSON
	var temp interface{}
	return json.Unmarshal(data, &temp)
}

// GetStruct 读取JSON配置并解析到结构体中
func (j *BaseJsonImpl) GetStruct(v interface{}) error {
	data, err := j.Get()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

// SetStruct 将结构体序列化为JSON并写入配置文件
func (j *BaseJsonImpl) SetStruct(v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return j.Set(data)
}

// GetMap 读取JSON配置并解析为map[string]interface{}
func (j *BaseJsonImpl) GetMap() (map[string]interface{}, error) {
	result := make(map[string]interface{})
	err := j.GetStruct(&result)
	return result, err
}

// SetMap 将map[string]interface{}序列化为JSON并写入配置文件
func (j *BaseJsonImpl) SetMap(m map[string]interface{}) error {
	return j.SetStruct(m)
}

// GetValue 获取JSON中的特定字段值
func (j *BaseJsonImpl) GetValue(key string) (interface{}, error) {
	m, err := j.GetMap()
	if err != nil {
		return nil, err
	}
	return m[key], nil
}

// SetValue 设置JSON中的特定字段值
func (j *BaseJsonImpl) SetValue(key string, value interface{}) error {
	m, err := j.GetMap()
	if err != nil {
		// 如果读取失败，创建一个新的map
		m = make(map[string]interface{})
	}
	m[key] = value
	return j.SetMap(m)
}

// WatchStruct 监听配置文件变更并解析到结构体中
func (j *BaseJsonImpl) WatchStruct(ctx context.Context, callback func(interface{}), structFactory func() interface{}) error {
	return j.Watch(ctx, func(data []byte) {
		v := structFactory()
		if err := json.Unmarshal(data, v); err == nil {
			callback(v)
		}
	})
}

// WatchMap 监听配置文件变更并解析为map[string]interface{}
func (j *BaseJsonImpl) WatchMap(ctx context.Context, callback func(map[string]interface{})) error {
	return j.Watch(ctx, func(data []byte) {
		var m map[string]interface{}
		if err := json.Unmarshal(data, &m); err == nil {
			callback(m)
		}
	})
}
