package config

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// logsDir is the directory where dated application log files are stored.
const logsDir = "logs"

// SetupLogger configures application logging so that every Gin request log,
// Gin error and standard-library log entry is written both to stdout and to a
// dated file under the logs/ directory.
//
// Each file is named using the pattern app-YYYY-MM-DD.log (e.g.
// app-2026-06-28.log), so logs are naturally rotated per day.
//
// The returned *os.File must be closed by the caller (typically via defer in
// main) once the application shuts down.
func SetupLogger() (*os.File, error) {
	if err := os.MkdirAll(logsDir, 0o755); err != nil {
		return nil, fmt.Errorf("could not create logs directory %q: %w", logsDir, err)
	}

	fileName := fmt.Sprintf("app-%s.log", time.Now().Format("2006-01-02"))
	logPath := filepath.Join(logsDir, fileName)

	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return nil, fmt.Errorf("could not open log file %q: %w", logPath, err)
	}

	// Mirror output to both the console and the dated log file.
	writer := io.MultiWriter(os.Stdout, file)
	gin.DefaultWriter = writer
	gin.DefaultErrorWriter = writer

	log.SetOutput(writer)
	log.SetFlags(log.LstdFlags)

	log.Printf("Logging initialized -> %s", logPath)

	return file, nil
}
