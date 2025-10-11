package v_web_utils

import (
	"encoding/json"
	"os"
	"path"
	vcommon "voxesis/src/Common"
)

type AuthConfigData struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Token    string `json:"token"`
	Deadline int    `json:"deadline"`
	Secure   bool   `json:"secure"`
}

func GetAuthConfig() (*AuthConfigData, error) {
	configPath := path.Join(vcommon.AppDir, "config", "auth.json")

	file, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config AuthConfigData

	if err = json.Unmarshal(file, &config); err != nil {
		return nil, err
	}

	return &config, nil
}
