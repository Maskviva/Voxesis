package v_dialog

import (
	"fmt"
	"os"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func OpenDirectoryDialog(title string) (string, error) {
	dialog := application.OpenFileDialog()
	dialog.SetTitle(title)
	dialog.CanChooseDirectories(true)

	if path, err := dialog.PromptForSingleSelection(); err == nil {
		return path, nil
	} else {
		return "", err
	}
}

func OpenFileDialog(title string, displayName string, pattern string) (string, error) {
	dialog := application.OpenFileDialog()
	dialog.SetTitle(title)
	dialog.AddFilter(displayName, pattern)

	if path, err := dialog.PromptForSingleSelection(); err == nil {
		return path, nil
	} else {
		return "", err
	}
}

func AuthDirectory(path string, filesList ...[]string) error {
	dir, err := os.Open(path)
	if err != nil {
		return err
	}

	defer func(dir *os.File) {
		_ = dir.Close()
	}(dir)

	files, err := dir.Readdir(-1)
	if err != nil {
		return err
	}

	checkFiles := func(list []string) error {
		requiredFiles := make(map[string]bool)
		for _, file := range list {
			requiredFiles[file] = true
		}

		fileMap := make(map[string]bool)
		for _, file := range files {
			if !file.IsDir() {
				fileMap[file.Name()] = true
			}
		}

		for file := range requiredFiles {
			if !fileMap[file] {
				return fmt.Errorf("无法使用的目录")
			}
		}
		return nil
	}

	for _, files := range filesList {
		if err := checkFiles(files); err == nil {
			return nil
		}
	}

	return fmt.Errorf("无法使用的目录")
}
