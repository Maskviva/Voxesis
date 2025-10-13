package v_manager

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	vcommon "voxesis/src/Common"
	entity "voxesis/src/Common/Entity"
)

type PluginManager struct {
	Plugins map[string]entity.Plugin
}

func NewPluginManager() *PluginManager {
	return &PluginManager{
		Plugins: make(map[string]entity.Plugin),
	}
}

func (pm *PluginManager) LoadPlugins() error {
	if err := os.MkdirAll(vcommon.PluginDir, 0755); err != nil {
		return fmt.Errorf("创建插件目录失败: %w", err)
	}

	// 读取插件目录
	dir, err := os.ReadDir(vcommon.PluginDir)
	if err != nil {
		return err
	}

	// 遍历插件目录
	for _, pluginDir := range dir {
		// 验证插件目录
		if !pluginDir.IsDir() {
			return fmt.Errorf("插件 %s 不是一个目录", pluginDir.Name())
		}

		var data = make(map[string]interface{})

		// 读取插件的manifest.json文件
		manifest, err := os.ReadFile(path.Join(vcommon.PluginDir, pluginDir.Name(), "/manifest.json"))
		if err != nil {
			return err
		}

		err = json.Unmarshal(manifest, &data)
		if err != nil {
			return err
		}

		if data["name"] == nil || data["plugin_type"] == nil {
			return fmt.Errorf("插件 %s 的manifest.json文件缺少必要字段", pluginDir.Name())
		}

		// 创建插件实体
		pm.Plugins[pluginDir.Name()] = entity.Plugin{
			PluginName: pluginDir.Name(),
			Manifest:   manifest,
			PluginType: entity.PluginType(data["plugin_type"].(string)),
		}
	}

	return nil
}
