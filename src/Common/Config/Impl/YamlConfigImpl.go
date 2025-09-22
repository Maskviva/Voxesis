package v_config_impl

import (
	"context"
	vconfig "voxesis/src/Common/Config"

	"gopkg.in/yaml.v2"
)

// BaseYamlImpl YAML配置文件管理类，继承自BaseConfigImpl
type BaseYamlImpl struct {
	*BaseConfigImpl // 嵌入基础配置类
}

// NewBaseYamlImpl 创建新的YAML配置实例
// 确保文件内容是有效的YAML格式
func NewBaseYamlImpl(filePath string) (*BaseYamlImpl, error) {
	// 创建基础配置实例
	BaseConfigImpl, err := NewBaseConfigImpl(filePath)
	if err != nil {
		return nil, err
	}

	// 验证或初始化YAML文件内容
	if err := validateOrCreateYAML(BaseConfigImpl); err != nil {
		return nil, err
	}

	return &BaseYamlImpl{
		BaseConfigImpl: BaseConfigImpl,
	}, nil
}

// validateOrCreateYAML 验证或创建有效的YAML文件
func validateOrCreateYAML(config *BaseConfigImpl) error {
	data, err := config.Get()
	if err != nil {
		return err
	}

	// 如果文件为空，写入一个空的YAML对象
	if len(data) == 0 {
		return config.Set([]byte("{}"))
	}

	// 验证是否为有效的YAML
	var temp interface{}
	return yaml.Unmarshal(data, &temp)
}

// GetStruct 读取YAML配置并解析到结构体中
func (y *BaseYamlImpl) GetStruct(v interface{}) error {
	data, err := y.Get()
	if err != nil {
		return err
	}
	return yaml.Unmarshal(data, v)
}

// SetStruct 将结构体序列化为YAML并写入配置文件
func (y *BaseYamlImpl) SetStruct(v interface{}) error {
	data, err := yaml.Marshal(v)
	if err != nil {
		return err
	}
	return y.Set(data)
}

// GetMap 读取YAML配置并解析为map[string]interface{}
func (y *BaseYamlImpl) GetMap() (map[string]interface{}, error) {
	result := make(map[string]interface{})
	err := y.GetStruct(&result)
	return result, err
}

// SetMap 将map[string]interface{}序列化为YAML并写入配置文件
func (y *BaseYamlImpl) SetMap(m map[string]interface{}) error {
	return y.SetStruct(m)
}

// GetValue 获取YAML中的特定字段值
func (y *BaseYamlImpl) GetValue(key string) (interface{}, error) {
	m, err := y.GetMap()
	if err != nil {
		return nil, err
	}
	return m[key], nil
}

// SetValue 设置YAML中的特定字段值
func (y *BaseYamlImpl) SetValue(key string, value interface{}) error {
	m, err := y.GetMap()
	if err != nil {
		// 如果读取失败，创建一个新的map
		m = make(map[string]interface{})
	}
	m[key] = value
	return y.SetMap(m)
}

// WatchStruct 监听配置文件变更并解析到结构体中
func (y *BaseYamlImpl) WatchStruct(ctx context.Context, callback func(interface{}), structFactory func() interface{}) error {
	return y.Watch(ctx, func(data []byte) {
		v := structFactory()
		if err := yaml.Unmarshal(data, v); err == nil {
			callback(v)
		}
	})
}

// WatchMap 监听配置文件变更并解析为map[string]interface{}
func (y *BaseYamlImpl) WatchMap(ctx context.Context, callback func(map[string]interface{})) error {
	return y.Watch(ctx, func(data []byte) {
		var m map[string]interface{}
		if err := yaml.Unmarshal(data, &m); err == nil {
			callback(m)
		}
	})
}

// 验证接口实现
var _ vconfig.BaseYaml = (*BaseYamlImpl)(nil)
