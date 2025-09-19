package main

import (
	"embed"
	_ "embed"
	"log"
	"voxesis/src"
	vtray "voxesis/src/System/Tray"
	vwindow "voxesis/src/Window"

	"github.com/wailsapp/wails/v3/pkg/application"
)

var (
	//go:embed frontend/dist
	frontendAssets embed.FS

	//go:embed assets/icon.png
	icon []byte

	app *application.App
)

func main() {

	app = src.InitAPP(frontendAssets)

	vwindow.LoadMainWindow(app)

	vtray.MainTray(app, icon)

	err := app.Run()

	if err != nil {
		log.Fatal(err)
	}
}
