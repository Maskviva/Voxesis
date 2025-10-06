package v_plugins

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	vcommon "voxesis/src/Common"
)

func ValiPlugin(pluginDir os.DirEntry) error {
	if !pluginDir.IsDir() {
		return fmt.Errorf("插件 %s 不是一个目录", pluginDir.Name())
	}

	var (
		data       = make(map[string]interface{})
		pluginName = pluginDir.Name()
	)

	manifestFile, err := os.ReadFile(path.Join(vcommon.PluginDir, pluginName, "manifest.json"))
	if err != nil {
		return fmt.Errorf("读取插件 %s 的 manifest.json 失败: %w", pluginName, err)
	}

	err = json.Unmarshal(manifestFile, &data)
	if err != nil {
		return fmt.Errorf("JSON 解析错误: %e", err)
	}

	if _, err := os.Stat(path.Join(vcommon.PluginDir, pluginName, data["main"].(string))); err != nil {
		return fmt.Errorf("插件缺少主文件 %s", data["main"])
	}

	return nil
}
