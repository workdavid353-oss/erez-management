$ErrorActionPreference = "Stop"
$date     = Get-Date -Format "yyyy-MM-dd_HH-mm"
$dumpFile = "C:\actions-runner\backups\erez-db-$date.sql"
$logFile  = "C:\actions-runner\backups\backup.log"
$rclone   = "C:\actions-runner\rclone.exe"
$remote   = "gdrive:erez-backups"

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

try {
    Log "Starting backup..."
    docker exec supabase-db pg_dump -U postgres -d postgres --clean --if-exists | Out-File -FilePath $dumpFile -Encoding utf8
    $size = [math]::Round((Get-Item $dumpFile).Length / 1KB, 1)
    Log "Database dumped: $dumpFile ($size KB)"
    & $rclone copy $dumpFile "$remote/" --config "C:\Users\$env:USERNAME\AppData\Roaming\rclone\rclone.conf"
    Log "Uploaded to Google Drive"
    Get-ChildItem "C:\actions-runner\backups\erez-db-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force
    Log "Backup complete."
} catch {
    Log "ERROR: $_"
    exit 1
}
