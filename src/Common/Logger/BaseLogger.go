package v_logger

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
)

type Logger struct {
	logger  *log.Logger
	file    *os.File
	mutex   sync.Mutex
	logPath string
	custom  bool
}

func NewLogger(logDir string, logFileName string, custom bool) (*Logger, error) {
	var flag int

	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, fmt.Errorf("创建日志目录失败: %w", err)
	}

	logPath := filepath.Join(logDir, logFileName)

	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, fmt.Errorf("打开日志文件失败: %w", err)
	}

	if custom {
		flag = 0
	} else {
		flag = log.Ldate | log.Ltime | log.Lshortfile
	}

	logger := log.New(file, "", flag)

	return &Logger{
		logger:  logger,
		file:    file,
		logPath: logPath,
		custom:  custom,
	}, nil
}

func (l *Logger) Debug(v ...interface{}) {
	l.log("DEBUG", v...)
}

func (l *Logger) Debugf(format string, v ...interface{}) {
	l.logf("DEBUG", format, v...)
}

func (l *Logger) Info(v ...interface{}) {
	l.log("INFO", v...)
}

func (l *Logger) Infof(format string, v ...interface{}) {
	l.logf("INFO", format, v...)
}

func (l *Logger) Warn(v ...interface{}) {
	l.log("WARN", v...)
}

func (l *Logger) Warnf(format string, v ...interface{}) {
	l.logf("WARN", format, v...)
}

func (l *Logger) Error(v ...interface{}) {
	l.log("ERROR", v...)
}

func (l *Logger) Errorf(format string, v ...interface{}) {
	l.logf("ERROR", format, v...)
}

func (l *Logger) log(level string, v ...interface{}) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	message := fmt.Sprint(v...)
	_ = l.logger.Output(3, fmt.Sprintf("[%s] %s", level, message))

	if !l.custom {
		fmt.Printf("[%s] %s\n", level, message)
	}
}

func (l *Logger) logf(level string, format string, v ...interface{}) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	message := fmt.Sprintf(format, v...)
	_ = l.logger.Output(3, message)

	fmt.Printf("[%s] %s\n", level, message)
}

func (l *Logger) Close() error {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	if l.file != nil {
		return l.file.Close()
	}
	return nil
}

func (l *Logger) GetLogPath() string {
	return l.logPath
}
