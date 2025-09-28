package v_tray

import (
	vwindow "voxesis/src/Window"

	"github.com/wailsapp/wails/v3/pkg/application"
)

func MainTray(app *application.App, icon []byte) {
	systray := app.NewSystemTray()
	systray.SetLabel("Voxesis")
	systray.SetIcon(icon)

	menu := application.NewMenu()
	menu.Add("隐藏窗口").OnClick(func(ctx *application.Context) {
		vwindow.MainWindow.Hide()
	})
	menu.Add("关闭窗口").OnClick(func(ctx *application.Context) {
		vwindow.MainWindow.Destroy()
		vwindow.MainWindow = nil
	})
	menu.Add("显示窗口").OnClick(func(ctx *application.Context) {
		if vwindow.MainWindow == nil {
			vwindow.LoadMainWindow(app)
			vwindow.MainWindow.Run()
		}
		vwindow.MainWindow.Show()
	})
	menu.Add("刷新页面").OnClick(func(context *application.Context) {
		vwindow.MainWindow.Reload()
	})
	menu.Add("退出").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systray.SetMenu(menu)
}
