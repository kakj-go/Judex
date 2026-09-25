{{- define "judex.name" -}}{{ .Release.Name | trunc 63 | trimSuffix "-" }}{{- end -}}
{{- define "judex.labels" -}}
app.kubernetes.io/name: judex
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
{{- define "judex.pgSecret" -}}{{ default (printf "%s-postgresql" .Release.Name) .Values.postgresql.existingSecret }}{{- end -}}
{{- define "judex.pgHost" -}}{{ if .Values.postgresql.embedded.enabled }}{{ .Release.Name }}-postgresql{{ else }}{{ required "External PostgreSQL host is required" .Values.postgresql.external.host }}{{ end }}{{- end -}}
{{- define "judex.storageSecret" -}}{{ if .Values.objectStorage.embedded.enabled }}judex-storage-auth{{ else }}{{ required "External S3 existingSecret is required" .Values.objectStorage.external.existingSecret }}{{ end }}{{- end -}}
