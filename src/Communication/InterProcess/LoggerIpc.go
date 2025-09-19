package InterProcess

import (
	"fmt"
	vlogger "voxesis/src/Common/Logger"

	"github.com/google/uuid"
)

type LoggerIpc struct {
	uuidMap map[string]*vlogger.Logger
}

func findLogger(l *LoggerIpc, uuid string) (bool, *vlogger.Logger) {
	logger, ok := l.uuidMap[uuid]
	if !ok {
		return false, nil
	}

	return true, logger
}

func (l *LoggerIpc) NewLogger(logDir string, logFileName string, date bool) (*string, *string) {
	logger, err := vlogger.NewLogger(logDir, logFileName, date)
	if err != nil {
		vlogger.AppLogger.Errorf("NewLogger error: %v", err)
		errStr := err.Error()
		return nil, &errStr
	}

	u := uuid.New()
	uuidStr := u.String()

	l.uuidMap[uuidStr] = logger

	return &uuidStr, nil
}

func (l *LoggerIpc) CloseLogger(uuid string) *string {
	ok, logger := findLogger(l, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的Logger实例", uuid)
		return &err
	}

	err := logger.Close()
	if err != nil {
		err := fmt.Sprintf("无法关闭uuid为 %s 日志管理器", uuid)
		return &err
	}

	delete(l.uuidMap, uuid)

	return nil
}

func (l *LoggerIpc) LogInfo(uuid string, logLine string) *string {
	ok, logger := findLogger(l, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的Logger实例", uuid)
		return &err
	}

	logger.Info(logLine)

	return nil
}

func (l *LoggerIpc) LogDebug(uuid string, logLine string) *string {
	ok, logger := findLogger(l, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的Logger实例", uuid)
		return &err
	}

	logger.Debug(logLine)

	return nil
}

func (l *LoggerIpc) LogWarn(uuid string, logLine string) *string {
	ok, logger := findLogger(l, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的Logger实例", uuid)
		return &err
	}

	logger.Warn(logLine)

	return nil
}

func (l *LoggerIpc) LogError(uuid string, logLine string) *string {
	ok, logger := findLogger(l, uuid)

	if !ok {
		err := fmt.Sprintf("未找到uuid为 %s 的Logger实例", uuid)
		return &err
	}

	logger.Error(logLine)

	return nil
}
