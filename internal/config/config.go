// SPDX-License-Identifier: Apache-2.0
package config

import (
	"fmt"
	"net"
	"os"
	"time"
)

type Config struct {
	Environment     string
	HTTPAddress     string
	WebDirectory    string
	ShutdownTimeout time.Duration
}

func Load() (Config, error) { return FromEnv(os.Getenv) }
func FromEnv(get func(string) string) (Config, error) {
	value := func(key, fallback string) string {
		if v := get(key); v != "" {
			return v
		}
		return fallback
	}
	c := Config{Environment: value("JUDEX_ENV", "development"), HTTPAddress: value("JUDEX_HTTP_ADDR", "127.0.0.1:8080"), WebDirectory: value("JUDEX_WEB_DIR", "web/dist")}
	if c.Environment != "development" && c.Environment != "production" && c.Environment != "test" {
		return c, fmt.Errorf("JUDEX_ENV must be development, production, or test")
	}
	if _, _, err := net.SplitHostPort(c.HTTPAddress); err != nil {
		return c, fmt.Errorf("invalid JUDEX_HTTP_ADDR: %w", err)
	}
	var err error
	c.ShutdownTimeout, err = time.ParseDuration(value("JUDEX_SHUTDOWN_TIMEOUT", "15s"))
	if err != nil || c.ShutdownTimeout <= 0 {
		return c, fmt.Errorf("JUDEX_SHUTDOWN_TIMEOUT must be a positive duration")
	}
	return c, nil
}
