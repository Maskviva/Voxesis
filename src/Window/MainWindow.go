package v_window

import "github.com/wailsapp/wails/v3/pkg/application"

var (
	MainWindow *application.WebviewWindow
)

func LoadMainWindow(app *application.App) {
	MainWindow = app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Frameless:        true,
	})
}
