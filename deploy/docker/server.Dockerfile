FROM node:24.10.0-alpine AS web
WORKDIR /source
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
RUN npm ci
COPY web/ web/
RUN npm run build --workspace @judex/web

FROM golang:1.25.3-alpine AS backend
WORKDIR /source
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/ cmd/
COPY internal/ internal/
ARG VERSION=0.1.0-dev
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w -X github.com/kakj-go/Judex/internal/version.Version=${VERSION}" -o /out/judex-server ./cmd/judex-server

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && addgroup -g 10001 judex && adduser -D -u 10001 -G judex judex
WORKDIR /app
COPY --from=backend /out/judex-server /app/judex-server
COPY --from=web /source/web/dist /app/web
COPY LICENSE NOTICE /app/
USER 10001:10001
ENV JUDEX_ENV=production JUDEX_HTTP_ADDR=0.0.0.0:8080 JUDEX_WEB_DIR=/app/web
EXPOSE 8080
ENTRYPOINT ["/app/judex-server"]
