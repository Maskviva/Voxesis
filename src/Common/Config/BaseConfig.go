package v_config

import (
	"context"

	_ "github.com/spf13/viper"
)

type BaseConfig interface {
	// Get 获取配置文件原始数据
	Get() ([]byte, error)

	// Watch 监听配置文件变更
	Watch(ctx context.Context, callback func([]byte)) error

	// Path 获取配置文件路径
	Path() string
}
