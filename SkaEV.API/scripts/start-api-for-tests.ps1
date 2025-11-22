# Stops any process listening on port 5000, then starts the SkaEV.API in background
try {
    $listeners = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
} catch {
    $listeners = $null
}

if ($listeners) {
    foreach ($l in $listeners) {
        if ($l.OwningProcess) {
            Write-Host "Stopping process listening on port 5000: $($l.OwningProcess)"
            try { Stop-Process -Id $l.OwningProcess -Force -ErrorAction SilentlyContinue } catch { }
        }
    }
}

$repoApi = Split-Path -Parent $MyInvocation.MyCommand.Definition
$apiRoot = Resolve-Path "$repoApi\.." | Select-Object -ExpandProperty Path

if (-not (Test-Path 'C:\temp')) { New-Item -Path 'C:\temp' -ItemType Directory -Force | Out-Null }
$logFile = 'C:\temp\skaev_api_log.txt'

Push-Location $apiRoot
Write-Host "Starting SkaEV.API via dotnet run (logging to $logFile)"
Start-Process -FilePath 'dotnet' -ArgumentList 'run','--project','SkaEV.API.csproj','--urls','http://127.0.0.1:5000' -WorkingDirectory $apiRoot -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError "${logFile}.err"
Pop-Location

Write-Host "API start initiated. Check $logFile and ${logFile}.err for output." 
