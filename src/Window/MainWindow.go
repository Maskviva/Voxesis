package v_window

import "github.com/wailsapp/wails/v3/pkg/application"

var (
	MainWindow *application.WebviewWindow
)

func LoadMainWindow(app *application.App) {
	MainWindow = app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Windows: application.WindowsWindow{
			BackdropType: application.Acrylic,
		},
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGBA(0, 0, 0, 0),
		URL:              "/",
		BackgroundType:   application.BackgroundTypeTranslucent,
		Frameless:        true,
	})
}
