package InterProcess

import (
	"fmt"
	"path"
	vcommon "voxesis/src/Common"
	vmanager "voxesis/src/Common/Manager"

	"github.com/google/uuid"
)

type ConfigIpc struct {
	uuidMap map[string]*vmanager.ConfigManager
}

func findConfigManager(c *ConfigIpc, uuid string) (*string, *vmanager.ConfigManager) {
	configManager, ok := c.uuidMap[uuid]
	if !ok {
		err := fmt.Sprintf("为找到 uuid为: %s 的 ConfigManager 对象", uuid)
		return &err, nil
	}

	return nil, configManager
}

func (c *ConfigIpc) NewConfigManager(managerType vmanager.ConfigType, filePath string, abs bool) (*string, *string) {
	if c.uuidMap == nil {
		c.uuidMap = make(map[string]*vmanager.ConfigManager)
	}

	if !abs {
		filePath = path.Join(vcommon.AppDir, filePath)
	}

	for mUuid, manager := range c.uuidMap {
		if manager.Path == filePath {
			return &mUuid, nil
		}
	}

	manager, err := vmanager.NewConfigManager(managerType, filePath)
	if err != nil {
		e := err.Error()
		return nil, &e
	}

	u := uuid.New()
	uuidStr := u.String()
	c.uuidMap[uuidStr] = manager

	return &uuidStr, nil
}

func (c *ConfigIpc) GetValueOfKey(uuid string, key string, section string) (*string, *string) {
	ferr, configManager := findConfigManager(c, uuid)

	if ferr != nil {
		return nil, ferr
	}

	if value, err := configManager.GetValueOfKey(section, key); err == nil {
		return &value, nil
	} else {
		e := err.Error()
		return nil, &e
	}
}

func (c *ConfigIpc) GetAllValue(uuid string) (interface{}, *string) {
	ferr, configManager := findConfigManager(c, uuid)

	if ferr != nil {
		return nil, ferr
	}

	if value, err := configManager.GetAllValue(); err == nil {
		return value, nil
	} else {
		e := err.Error()
		return nil, &e
	}
}

func (c *ConfigIpc) SetValueOfKey(uuid string, key string, value string, section string) *string {
	ferr, configManager := findConfigManager(c, uuid)

	if ferr != nil {
		return ferr
	}

	if err := configManager.SetValueOfKey(section, key, value); err == nil {
		return nil
	} else {
		e := err.Error()
		return &e
	}
}

func (c *ConfigIpc) DelValueOfKey(uuid string, key string) *string {
	ferr, configManager := findConfigManager(c, uuid)

	if ferr != nil {
		return ferr
	}

	if err := configManager.DelValueOfKey(key); err == nil {
		return nil
	} else {
		e := err.Error()
		return &e
	}
}
