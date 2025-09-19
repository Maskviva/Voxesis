package v_plugins

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	vcommon "voxesis/src/Common"
	"voxesis/src/Common/Entity"
)

func GetPluginList() (*[]entity.Plugin, error) {
	dirList, err := os.ReadDir(vcommon.PluginDir)
	if err != nil {
		return nil, fmt.Errorf("读取插件目录失败: %w", err)
	}

	pluginList, err := validate(dirList)
	if err != nil {
		return nil, err
	}

	return pluginList, nil
}

func validate(dirList []os.DirEntry) (*[]entity.Plugin, error) {
	var pluginList []entity.Plugin
	var data map[string]interface{}

	for _, dir := range dirList {
		if !dir.IsDir() {
			return nil, fmt.Errorf("插件 %s 不是一个目录", dir.Name())
		}

		manifestFile, err := os.ReadFile(path.Join(vcommon.PluginDir, dir.Name(), "manifest.json"))
		if err != nil {
			return nil, fmt.Errorf("读取插件 %s 的 manifest.json 失败: %w", dir.Name(), err)
		}

		err = json.Unmarshal(manifestFile, &data)
		if err != nil {
			return nil, fmt.Errorf("JSON 解析错误: %e", err)
		}

		if _, err := os.Stat(path.Join(vcommon.PluginDir, dir.Name(), data["mian"].(string))); err == nil {
			return nil, fmt.Errorf("插件缺少主文件 %s", data["mian"])
		}

		pluginList = append(pluginList, entity.Plugin{
			PluginName: dir.Name(),
			Manifest:   manifestFile,
		})
	}
	return &pluginList, nil
}
