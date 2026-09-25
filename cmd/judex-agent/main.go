// SPDX-License-Identifier: Apache-2.0
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/kakj-go/Judex/internal/version"
	"os"
)

func main() {
	showVersion := flag.Bool("version", false, "print build version")
	flag.Parse()
	if *showVersion {
		fmt.Println(version.Version)
		return
	}
	_ = json.NewEncoder(os.Stderr).Encode(map[string]string{"code": "NOT_IMPLEMENTED", "message": "Agent harness and OpenSandbox execution are not implemented in this scaffold."})
	os.Exit(1)
}
