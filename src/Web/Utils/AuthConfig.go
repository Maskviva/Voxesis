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
		if err := createAuthConfig(); err != nil {
			return nil, err
		}
	}

	var config AuthConfigData

	if err = json.Unmarshal(file, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

func createAuthConfig() error {
	configPath := path.Join(vcommon.AppDir, "config", "auth.json")

	if err := os.MkdirAll(path.Dir(configPath), 0755); err != nil {
		return err
	}

	defaultConfig := AuthConfigData{
		Username: "admin",
		Password: "123456",
		Secure:   false,
		Deadline: 86400,
		Token:    "a4fq-23qe-df15-6wf1-s12a-fa8s",
	}

	data, err := json.MarshalIndent(defaultConfig, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return err
	}

	return nil
}
