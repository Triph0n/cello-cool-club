$ErrorActionPreference = 'Stop'
try {
    $cccAddress = 'http://127.0.0.1:8793'
    $cccRunning = $false
    try { $cccRunning = (Invoke-WebRequest "$cccAddress/health" -TimeoutSec 2).Content.Trim() -eq 'ccc-three-selections' } catch {}
    if (-not $cccRunning) {
    $cccNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $cccNode -ArgumentList 'serve.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'server-error.log')
    # Node can take several seconds to become reachable on this Windows profile.
    # Keep the launcher open until the actual health endpoint answers.
    for ($cccAttempt = 0; $cccAttempt -lt 40; $cccAttempt++) {
        Start-Sleep -Milliseconds 500
        try { $cccRunning = (Invoke-WebRequest "$cccAddress/health" -TimeoutSec 1).Content.Trim() -eq 'ccc-three-selections'; if ($cccRunning) { break } } catch {}
    }
    }
    if (-not $cccRunning) { throw 'Server se nepodarilo spustit ani po 20 sekundach.' }
    Start-Process -FilePath 'explorer.exe' -ArgumentList "$cccAddress/dashboardy.html"
} catch {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("Cello Cool Club se nepodarilo spustit.`n`n$($_.Exception.Message)`n`nPodrobnosti: $PSScriptRoot\\server-error.log", 'Cello Cool Club') | Out-Null
    exit 1
}
