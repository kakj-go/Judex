// SPDX-License-Identifier: Apache-2.0
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/kakj-go/Judex/internal/app"
	"github.com/kakj-go/Judex/internal/config"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	application, err := app.New(cfg, logger)
	if err != nil {
		logger.Error("initialization failed", "error", err)
		os.Exit(1)
	}
	defer application.Close()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	failure := make(chan error, 1)
	go func() {
		logger.Info("server starting", "address", cfg.HTTPAddress, "environment", cfg.Environment)
		failure <- application.Server.ListenAndServe()
	}()
	select {
	case err := <-failure:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server stopped", "error", err)
			os.Exit(1)
		}
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		application.Draining.Store(true)
		if err := application.Server.Shutdown(shutdown); err != nil {
			logger.Error("shutdown failed", "error", err)
			_ = application.Server.Close()
			os.Exit(1)
		}
	}
}
