// SPDX-License-Identifier: Apache-2.0
package agent

import "context"

// Runner executes one isolated run. Business approval is deliberately not a runner capability.
type Runner interface {
	Run(context.Context, RunRequest) (RunResult, error)
}
type RunRequest struct {
	RunID        string
	ProjectID    string
	IdentityID   string
	SessionID    string
	InputVersion string
}
type RunResult struct {
	RunID       string
	Status      string
	ArtifactIDs []string
}

// Sandbox is an infrastructure boundary, not a permission to execute on the API host.
type Sandbox interface {
	Create(context.Context, RunRequest) (string, error)
	Destroy(context.Context, string) error
}
