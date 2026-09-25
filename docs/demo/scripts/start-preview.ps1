$ErrorActionPreference = 'Stop'

$previewRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDir = Join-Path $previewRoot '.runtime'
$viteEntry = Join-Path $previewRoot 'node_modules\vite\bin\vite.js'
$previewUrl = 'http://127.0.0.1:4173/'
$metadataPath = Join-Path $runtimeDir 'preview-process.json'

if (-not (Test-Path -LiteralPath $viteEntry)) {
    throw 'Preview dependencies are missing. Run npm install in docs/demo first.'
}

$listener = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $ownedPreview = $null
    if (Test-Path -LiteralPath $metadataPath) {
        $ownedPreview = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
    }
    $listenerIds = @($listener | Select-Object -ExpandProperty OwningProcess -Unique)
    $existingProcess = if ($ownedPreview) {
        Get-CimInstance Win32_Process -Filter ("ProcessId = " + [int]$ownedPreview.processId) -ErrorAction SilentlyContinue
    }
    if ($ownedPreview -and
        $listenerIds -contains [int]$ownedPreview.processId -and
        $existingProcess.CommandLine -like ('*' + $viteEntry + '*')) {
        $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200 -and $response.Content -match '<title>Judex') {
            Write-Output ("Preview already running: " + $previewUrl + " (PID " + $ownedPreview.processId + ")")
            exit 0
        }
    }
    throw ("Port 4173 is already in use by PID(s) " + ($listenerIds -join ', ') + '. No existing process was stopped.')
}

[System.IO.Directory]::CreateDirectory($runtimeDir) | Out-Null
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$stdoutPath = Join-Path $runtimeDir 'preview.stdout.log'
$stderrPath = Join-Path $runtimeDir 'preview.stderr.log'
$startParams = @{
    FilePath = $nodePath
    ArgumentList = @('"' + $viteEntry + '"', '--host', '127.0.0.1', '--port', '4173', '--strictPort')
    WorkingDirectory = $previewRoot
    WindowStyle = 'Hidden'
    RedirectStandardOutput = $stdoutPath
    RedirectStandardError = $stderrPath
    PassThru = $true
}
$previewProcess = Start-Process @startParams

@{
    processId = $previewProcess.Id
    root = $previewRoot
    entry = $viteEntry
    url = $previewUrl
    startedAt = [DateTime]::UtcNow.ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath $metadataPath -Encoding UTF8

$previewReady = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if ($previewProcess.HasExited) { break }
    try {
        $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200 -and $response.Content -match '<title>Judex') {
            $previewReady = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 250
    }
}
if (-not $previewReady) {
    if (Test-Path -LiteralPath $stderrPath) { Get-Content -LiteralPath $stderrPath -Tail 20 | Write-Output }
    throw ("Preview did not become ready. See logs under " + $runtimeDir)
}

Write-Output ("Preview running in the background: " + $previewUrl)
Write-Output ("PID: " + $previewProcess.Id)
Write-Output ("Logs: " + $runtimeDir)
