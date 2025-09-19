package v_logger

var (
	AppLogger *Logger
)

func InitLogger(logDir string, logFileName string) error {
	var err error

	AppLogger, err = NewLogger(logDir, logFileName, false)

	return err
}
