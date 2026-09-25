// SPDX-License-Identifier: Apache-2.0
package deploy_test

import (
	"bytes"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestHelmStorageMatrix(t *testing.T) {
	if _, err := exec.LookPath("helm"); err != nil {
		t.Skip("Helm is not installed")
	}
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatal(err)
	}
	for _, embeddedPG := range []bool{true, false} {
		for _, embeddedS3 := range []bool{true, false} {
			t.Run(fmt.Sprintf("pg=%t/s3=%t", embeddedPG, embeddedS3), func(t *testing.T) {
				args := []string{"--repository-config", filepath.Join(root, "deploy/helm/repositories.yaml"), "--repository-cache", filepath.Join(root, ".cache/helm"), "template", "judex", filepath.Join(root, "deploy/helm/judex"), "--namespace", "judex-test", "--set", fmt.Sprintf("postgresql.embedded.enabled=%t,objectStorage.embedded.enabled=%t", embeddedPG, embeddedS3)}
				if !embeddedPG {
					args = append(args, "--set", "postgresql.external.host=postgres.example,postgresql.existingSecret=external-pg")
				}
				if !embeddedS3 {
					args = append(args, "--set", "objectStorage.external.endpoint=https://s3.example,objectStorage.external.bucket=judex,objectStorage.external.existingSecret=external-s3")
				}
				cmd := exec.Command("helm", args...)
				var stderr bytes.Buffer
				cmd.Stderr = &stderr
				out, err := cmd.Output()
				if err != nil {
					t.Fatalf("helm render failed: %v\n%s", err, stderr.String())
				}
				decoder := yaml.NewDecoder(bytes.NewReader(out))
				seen := map[string]bool{}
				pg := false
				s3 := false
				server := false
				sandbox := false
				for {
					var object struct {
						Kind     string `yaml:"kind"`
						Metadata struct {
							Name      string `yaml:"name"`
							Namespace string `yaml:"namespace"`
						} `yaml:"metadata"`
						Spec map[string]any `yaml:"spec"`
					}
					err = decoder.Decode(&object)
					if err == io.EOF {
						break
					}
					if err != nil {
						t.Fatal(err)
					}
					if object.Kind == "" {
						continue
					}
					key := object.Kind + "/" + object.Metadata.Namespace + "/" + object.Metadata.Name
					if seen[key] {
						t.Fatal("duplicate resource", key)
					}
					seen[key] = true
					if object.Kind == "StatefulSet" && object.Metadata.Name == "judex-postgresql" {
						pg = true
					}
					if object.Kind == "StatefulSet" && object.Metadata.Name == "judex-seaweedfs" {
						s3 = true
					}
					if object.Kind == "Deployment" && object.Metadata.Name == "judex" {
						server = true
					}
					if object.Kind == "Deployment" && strings.HasSuffix(object.Metadata.Name, "opensandbox-server") {
						sandbox = true
						if object.Metadata.Namespace != "judex-test" {
							t.Fatal("sandbox escaped release namespace")
						}
						strategy, _ := object.Spec["strategy"].(map[string]any)
						if strategy["type"] != "Recreate" {
							t.Fatal("sandbox is not single-active")
						}
					}
				}
				if pg != embeddedPG || s3 != embeddedS3 || !server || !sandbox {
					t.Fatalf("bad inventory pg=%t s3=%t server=%t sandbox=%t", pg, s3, server, sandbox)
				}
			})
		}
	}
}
func TestHelmRejectsIncompleteExternalStorage(t *testing.T) {
	if _, err := exec.LookPath("helm"); err != nil {
		t.Skip("Helm is not installed")
	}
	root, _ := filepath.Abs("../..")
	args := []string{"--repository-config", filepath.Join(root, "deploy/helm/repositories.yaml"), "--repository-cache", filepath.Join(root, ".cache/helm"), "template", "judex", filepath.Join(root, "deploy/helm/judex"), "--set", "postgresql.embedded.enabled=false"}
	if err := exec.Command("helm", args...).Run(); err == nil {
		t.Fatal("incomplete external database settings accepted")
	}
}

func TestHelmCustomSandboxSecretAndSharedOperator(t *testing.T) {
	if _, err := exec.LookPath("helm"); err != nil {
		t.Skip("Helm is not installed")
	}
	root, _ := filepath.Abs("../..")
	cmd := exec.Command("helm", "template", "judex", filepath.Join(root, "deploy/helm/judex"), "-n", "judex-test", "--set", "global.sandboxAPIKeySecret=custom-api-key,global.sandboxAPIKeyManaged=false,opensandbox.opensandbox-controller.enabled=false")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("render: %v %s", err, stderr.String())
	}
	rendered := string(out)
	if strings.Contains(rendered, "{{") || strings.Contains(rendered, "judex-opensandbox-auth") {
		t.Fatal("unresolved template or default sandbox secret remains")
	}
	if strings.Count(rendered, "custom-api-key") != 2 {
		t.Fatal("API and sandbox must both reference the external secret without creating it")
	}
	if strings.Contains(rendered, "kind: CustomResourceDefinition") || strings.Contains(rendered, "name: judex-test-judex-opensandbox-controller") {
		t.Fatal("shared-operator install must not create another controller or CRDs")
	}
}
