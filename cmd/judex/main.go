// SPDX-License-Identifier: Apache-2.0
package main

import (
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	endpoint := flag.String("server", "http://127.0.0.1:8080", "Judex server URL")
	flag.Parse()
	if flag.NArg() != 1 || flag.Arg(0) != "status" {
		fmt.Fprintln(os.Stderr, "Usage: judex [-server URL] status (business commands pending)")
		os.Exit(2)
	}
	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Get(strings.TrimRight(*endpoint, "/") + "/api/v1/system")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		fmt.Fprintln(os.Stderr, "status request failed:", response.StatusCode)
		os.Exit(1)
	}
	_, err = io.Copy(os.Stdout, io.LimitReader(response.Body, 1<<20))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
