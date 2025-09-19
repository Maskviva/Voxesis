package v_logger

var (
	mcLogger *Logger
)

func InitMCLogger(logDir string, logFileName string) error {
	var err error

	mcLogger, err = NewLogger(logDir, logFileName, true)

	return err
}

func McLog(logLine string) {
	mcLogger.log("INFO", logLine)
}
