package src

import (
	"embed"
	"fmt"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"voxesis/src/Common"
	vlogger "voxesis/src/Common/Logger"
	"voxesis/src/Communication/InterProcess"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func InitAPP(assets embed.FS) *application.App {
	appDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取工作目录失败: %v\n", err)
		return nil
	}

	pluginsDir := filepath.Join(appDir, "plugins")

	// 初始化日志管理器
	initLoggerManager(appDir)

	app := application.New(application.Options{
		Name:        "voxesis",
		Description: "Voxesis A Minecraft Server Manager",
		Services: []application.Service{
			application.NewService(&InterProcess.LoggerIpc{}),
			application.NewService(&InterProcess.OrdinaryProcessIpc{}),
			application.NewService(&InterProcess.ConPtyProcessIpc{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
			Middleware: func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if strings.HasPrefix(r.URL.Path, "/plugins/") {
						filePath := strings.TrimPrefix(r.URL.Path, "/plugins/")

						// 构建完整文件路径
						fullPath := filepath.Join(pluginsDir, filePath)

						// 直接从文件系统读取文件，支持热更新
						fileContent, err := os.ReadFile(fullPath)
						if err != nil {
							vlogger.AppLogger.Warn(fmt.Sprintf("无法找到插件文件: %s, 错误: %v", filePath, err))
							http.NotFound(w, r)
							return
						}

						ext := filepath.Ext(filePath)
						mimeType := mime.TypeByExtension(ext)
						if mimeType != "" {
							w.Header().Set("Content-Type", mimeType+"; charset=utf-8")
						}
						w.Header().Set("Content-Length", fmt.Sprintf("%d", len(fileContent)))

						w.WriteHeader(http.StatusOK)
						if _, err = w.Write(fileContent); err != nil {
							vlogger.AppLogger.Error(err.Error())
							return
						}

						return
					}

					next.ServeHTTP(w, r)
				})
			},
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	v_common.App = app
	v_common.AppDir = appDir
	v_common.PluginDir = pluginsDir

	return app
}

func initLoggerManager(appDir string) {
	// 初始化日志管理器
	if err := vlogger.InitLogger(filepath.Join(appDir, "log"), "app.log"); err != nil {
		log.Fatalf("日志系统初始化失败: %v\n", err)
		return
	}
}
