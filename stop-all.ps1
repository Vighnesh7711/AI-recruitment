Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Stopping all AuraRecruit active service ports...  " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(5000, 5002, 5173, 5678, 8002)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $pids = $connection.OwningProcess | Select-Object -Unique
        foreach ($pid in $pids) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "Successfully terminated process (PID: $pid) on port $port." -ForegroundColor Green
            } catch {
                Write-Host "Failed to terminate process (PID: $pid) on port $port." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No active listener detected on port $port." -ForegroundColor Gray
    }
}
