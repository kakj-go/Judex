// SPDX-License-Identifier: Apache-2.0
package httptransport

import (
	"crypto/rand"
	"encoding/hex"
	"io/fs"
	"log/slog"
	"net/http"
	"path"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kakj-go/Judex/internal/version"
)

type Options struct {
	Logger   *slog.Logger
	Assets   fs.FS
	Draining *atomic.Bool
}

func replyError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{"error": gin.H{"code": code, "message": message}, "requestId": c.GetString("request_id")})
}
func NewRouter(opts Options) *gin.Engine {
	if opts.Logger == nil {
		opts.Logger = slog.Default()
	}
	if opts.Draining == nil {
		opts.Draining = &atomic.Bool{}
	}
	router := gin.New()
	_ = router.SetTrustedProxies(nil)
	router.HandleMethodNotAllowed = true
	router.Use(func(c *gin.Context) {
		b := make([]byte, 16)
		_, _ = rand.Read(b)
		id := hex.EncodeToString(b)
		c.Set("request_id", id)
		c.Header("X-Request-ID", id)
		c.Header("X-Content-Type-Options", "nosniff")
		start := time.Now()
		c.Next()
		opts.Logger.Info("http request", "request_id", id, "method", c.Request.Method, "route", c.FullPath(), "status", c.Writer.Status(), "duration_ms", time.Since(start).Milliseconds())
	})
	router.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
		opts.Logger.Error("request panic", "request_id", c.GetString("request_id"))
		replyError(c, 500, "INTERNAL_ERROR", "request failed")
	}))
	router.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	router.GET("/readyz", func(c *gin.Context) {
		if opts.Draining.Load() {
			replyError(c, 503, "DRAINING", "server is shutting down")
			return
		}
		c.JSON(200, gin.H{"status": "ready", "scope": "http-scaffold"})
	})
	router.GET("/api/v1/system", func(c *gin.Context) {
		c.JSON(200, gin.H{"name": "Judex", "version": version.Version, "commit": version.Commit, "stage": "scaffold", "capabilities": gin.H{"identity": false, "workspace": false, "persistence": false, "agentExecution": false}})
	})
	pending := func(c *gin.Context) {
		replyError(c, 501, "NOT_IMPLEMENTED", "This business module is not implemented in the scaffold.")
	}
	router.POST("/api/v1/auth/register", pending)
	router.POST("/api/v1/auth/login", pending)
	router.POST("/api/v1/auth/logout", pending)
	router.GET("/api/v1/workspace", pending)
	router.GET("/api/v1/projects", pending)
	router.POST("/api/v1/projects", pending)
	router.NoMethod(func(c *gin.Context) { replyError(c, 405, "METHOD_NOT_ALLOWED", "method not allowed") })
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") || c.Request.URL.Path == "/api" {
			replyError(c, 404, "NOT_FOUND", "API endpoint not found")
			return
		}
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			replyError(c, 404, "NOT_FOUND", "endpoint not found")
			return
		}
		if opts.Assets == nil {
			replyError(c, 404, "WEB_BUILD_MISSING", "Build web/ or use its Vite development server.")
			return
		}
		name := strings.TrimPrefix(path.Clean(c.Request.URL.Path), "/")
		if name == "" {
			name = "index.html"
		}
		info, err := fs.Stat(opts.Assets, name)
		if err == nil && !info.IsDir() {
			c.Header("Cache-Control", "no-cache")
			http.ServeFileFS(c.Writer, c.Request, opts.Assets, name)
			return
		}
		// Asset misses must remain errors rather than returning an HTML document.
		if path.Ext(name) != "" || strings.HasPrefix(name, "assets/") {
			replyError(c, 404, "NOT_FOUND", "asset not found")
			return
		}
		if _, err := fs.Stat(opts.Assets, "index.html"); err != nil {
			replyError(c, 404, "WEB_BUILD_MISSING", "web build is unavailable")
			return
		}
		c.Header("Cache-Control", "no-cache")
		http.ServeFileFS(c.Writer, c.Request, opts.Assets, "index.html")
	})
	return router
}
