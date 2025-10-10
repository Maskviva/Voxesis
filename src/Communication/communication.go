package communication

import (
	vlogger "voxesis/src/Common/Logger"
	vmanager "voxesis/src/Common/Manager"
	interprocess "voxesis/src/Communication/InterProcess"
)

var (
	LoggerIpc       *interprocess.LoggerIpc
	UtilsIpc        *interprocess.UtilsIpc
	ConfigIpc       *interprocess.ConfigIpc
	PluginIpc       *interprocess.PluginIpc
	ProcessIpc      *interprocess.ProcessIpc
	SystemDialogIpc *interprocess.SystemDialogIpc
)

func Init() {
	LoggerIpc = initLoggerIpc()
	UtilsIpc = &interprocess.UtilsIpc{}
	ConfigIpc = initConfigIpc()
	PluginIpc = initPluginIpc()
	ProcessIpc = initProcessIpc()
	SystemDialogIpc = &interprocess.SystemDialogIpc{}
}

func initLoggerIpc() *interprocess.LoggerIpc {
	return &interprocess.LoggerIpc{
		UuidMap: make(map[string]*vlogger.Logger),
	}
}

func initPluginIpc() *interprocess.PluginIpc {
	return &interprocess.PluginIpc{
		PluginManager: vmanager.NewPluginManager(),
	}
}

func initConfigIpc() *interprocess.ConfigIpc {
	return &interprocess.ConfigIpc{
		UuidMap: make(map[string]*vmanager.ConfigManager),
	}
}

func initProcessIpc() *interprocess.ProcessIpc {
	return &interprocess.ProcessIpc{
		ProcessMap: make(map[int]interprocess.Process),
		NextID:     1,
	}
}
