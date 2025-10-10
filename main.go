package main

import (
	"embed"
	"fmt"
	"log"
	"voxesis/src"
	vweb "voxesis/src/Communication/InterHttp"
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

	vweb.Init(frontendAssets)

	go func() {
		err := vweb.Run()
		if err != nil {
			fmt.Println(err)
		}
	}()

	err := app.Run()

	if err != nil {
		log.Fatal(err)
	}
}
