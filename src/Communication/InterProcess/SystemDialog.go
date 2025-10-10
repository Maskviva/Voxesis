package inter_process

import (
	"fmt"
	vdialog "voxesis/src/System/dialog"
)

type SystemDialogIpc struct {
}

func (s *SystemDialogIpc) OpenDirectoryDialog(title string) string {
	path, err := vdialog.OpenDirectoryDialog(title)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}

	return path
}

func (s *SystemDialogIpc) OpenFileDialog(title string, displayName string, pattern string) string {
	path, err := vdialog.OpenFileDialog(title, displayName, pattern)
	if err != nil {
		fmt.Println(err.Error())
		return ""
	}

	return path
}

func (s *SystemDialogIpc) AuthDirectory(path string, filesList [][]string) bool {
	err := vdialog.AuthDirectory(path, filesList...)
	if err != nil && err.Error() == "无法使用的目录" {
		return false
	} else if err != nil {
		fmt.Println(err.Error())
		return false
	}

	return true
}
