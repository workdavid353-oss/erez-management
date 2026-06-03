#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

function Title($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function OK($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Info($msg)  { Write-Host "  [..] $msg" -ForegroundColor Yellow }
function Fail($msg)  { Write-Host "  [!!] $msg" -ForegroundColor Red; exit 1 }

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunnerDir  = "C:\actions-runner"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "    Erez Legal -- Server Setup Script" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Get LAN IP ---------------------------------------------------------------
Title "Network Configuration"
$ips = Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' -and $_.IPAddress -notlike '172.*' } |
       Select-Object IPAddress, InterfaceAlias

Write-Host "`n  Available IP addresses:"
$ips | ForEach-Object { Write-Host "    $($_.IPAddress)  ($($_.InterfaceAlias))" -ForegroundColor White }
Write-Host ""
$LAN_IP = Read-Host "  Enter the LAN IP employees will use to access the server"
if (-not $LAN_IP) { Fail "IP cannot be empty" }
OK "LAN IP: $LAN_IP"

# -- 2. Create directories -------------------------------------------------------
Title "Creating Directories"
New-Item -ItemType Directory -Force $RunnerDir | Out-Null
New-Item -ItemType Directory -Force "$RunnerDir\backups" | Out-Null
New-Item -ItemType Directory -Force "$RunnerDir\rclone" | Out-Null
OK "Directories created"

# -- 3. Write .env.production ----------------------------------------------------
Title "Writing Environment Files"

$anonKey    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NzkxOTczMjYsImV4cCI6MjA5NDU1NzMyNn0.khCwUj_aXgl6l-ryIgDSt6ykmZpqDmFdRmMco4qRTn8"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc3OTE5NzMyNiwiZXhwIjoyMDk0NTU3MzI2fQ.9yVKeUkP6HAzujsbqdwtgm4-c0yU06vN7TxDesLjMt8"
$envContent = "VITE_SUPABASE_URL=http://${LAN_IP}:8000`nVITE_SUPABASE_ANON_KEY=${anonKey}`nVITE_SUPABASE_SERVICE_ROLE_KEY=${serviceKey}"

[System.IO.File]::WriteAllText("$ProjectDir\.env.production", $envContent)
[System.IO.File]::WriteAllText("$RunnerDir\.env.production",  $envContent)
OK ".env.production written (project + runner)"

# -- 4. Fix PowerShell Execution Policy ------------------------------------------
Title "Execution Policy"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine -Force
OK "LocalMachine execution policy set to RemoteSigned"

# -- 5. Build frontend -----------------------------------------------------------
Title "Building Frontend"
Info "Running npm ci..."
Set-Location $ProjectDir
npm ci
Info "Running npm run build..."
npm run build
OK "Frontend built"

# -- 6. Deploy Docker container --------------------------------------------------
Title "Deploying Docker Container"
docker build --pull=false --no-cache -t erez-frontend $ProjectDir
docker stop erez-frontend 2>$null; docker rm erez-frontend 2>$null
docker run -d -p 80:80 --name erez-frontend --restart unless-stopped erez-frontend
OK "Container deployed -- http://${LAN_IP}"

# -- 7. GitHub Actions Runner ----------------------------------------------------
Title "GitHub Actions Runner"
$installRunner = Read-Host "  Set up auto-deploy runner? (y/n)"
if ($installRunner -eq 'y') {
    Info "Downloading runner..."
    $runnerVer = (Invoke-RestMethod "https://api.github.com/repos/actions/runner/releases/latest").tag_name -replace 'v',''
    $runnerUrl = "https://github.com/actions/runner/releases/download/v${runnerVer}/actions-runner-win-x64-${runnerVer}.zip"
    Invoke-WebRequest -Uri $runnerUrl -OutFile "$RunnerDir\runner.zip" -UseBasicParsing
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory("$RunnerDir\runner.zip", $RunnerDir)
    OK "Runner downloaded and extracted"

    Write-Host ""
    Write-Host "  Open this URL in your browser and copy the --token value:" -ForegroundColor Yellow
    Write-Host "  https://github.com/workdavid353-oss/erez-management/settings/actions/runners/new?runnerOs=windows" -ForegroundColor White
    Write-Host ""
    $runnerToken = Read-Host "  Paste the runner token here"

    Set-Location $RunnerDir
    .\config.cmd --url https://github.com/workdavid353-oss/erez-management --token $runnerToken --name erez-runner --labels self-hosted,Windows --work _work --unattended

    $svcName = "actions.runner.workdavid353-oss.erez-management.erez-runner"
    sc.exe create $svcName binpath= "$RunnerDir\bin\RunnerService.exe" start= auto displayname= "GitHub Actions Runner (erez-runner)"
    sc.exe failure $svcName reset= 86400 actions= restart/5000/restart/5000/restart/5000
    Start-Service $svcName
    OK "Runner installed and running as Windows service"
} else {
    Info "Skipped runner setup"
}

# -- 8. Backup Script ------------------------------------------------------------
Title "Backup Setup"

$backupLines = @(
    '$ErrorActionPreference = "Stop"',
    '$date     = Get-Date -Format "yyyy-MM-dd_HH-mm"',
    '$dumpFile = "C:\actions-runner\backups\erez-db-$date.sql"',
    '$logFile  = "C:\actions-runner\backups\backup.log"',
    '$rclone   = "C:\actions-runner\rclone.exe"',
    '$remote   = "gdrive:erez-backups"',
    'function Log($msg) { $line = "$(Get-Date -Format ''yyyy-MM-dd HH:mm:ss'') $msg"; Add-Content -Path $logFile -Value $line; Write-Host $line }',
    'try {',
    '    Log "Starting backup..."',
    '    docker exec supabase-db pg_dump -U postgres -d postgres --clean --if-exists | Out-File -FilePath $dumpFile -Encoding utf8',
    '    $size = [math]::Round((Get-Item $dumpFile).Length / 1KB, 1)',
    '    Log "Database dumped: $dumpFile ($size KB)"',
    '    & $rclone copy $dumpFile "$remote/" --config "C:\Users\$env:USERNAME\AppData\Roaming\rclone\rclone.conf"',
    '    Log "Uploaded to Google Drive"',
    '    Get-ChildItem "C:\actions-runner\backups\erez-db-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force',
    '    Log "Backup complete."',
    '} catch { Log "ERROR: $_"; exit 1 }'
)
[System.IO.File]::WriteAllLines("$RunnerDir\backup.ps1", $backupLines)
OK "backup.ps1 written"

Info "Downloading rclone..."
$rcloneVer = (Invoke-RestMethod "https://api.github.com/repos/rclone/rclone/releases/latest").tag_name
$rcloneUrl = "https://github.com/rclone/rclone/releases/download/$rcloneVer/rclone-$rcloneVer-windows-amd64.zip"
Invoke-WebRequest -Uri $rcloneUrl -OutFile "$RunnerDir\rclone.zip" -UseBasicParsing
$zip = [System.IO.Compression.ZipFile]::OpenRead("$RunnerDir\rclone.zip")
$exe = $zip.Entries | Where-Object { $_.Name -eq "rclone.exe" }
[System.IO.Compression.ZipFileExtensions]::ExtractToFile($exe, "$RunnerDir\rclone.exe", $true)
$zip.Dispose()
OK "rclone.exe ready"

$setupBackup = Read-Host "  Set up Google Drive backup schedule? (y/n)"
if ($setupBackup -eq 'y') {
    Write-Host ""
    Write-Host "  Copy rclone.conf from the old machine to:" -ForegroundColor Yellow
    Write-Host "  C:\Users\$env:USERNAME\AppData\Roaming\rclone\rclone.conf" -ForegroundColor White
    Write-Host "  Or run: C:\actions-runner\rclone.exe config (if first time)" -ForegroundColor White
    Read-Host "`n  Press Enter when rclone is configured"

    $action   = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NonInteractive -File C:\actions-runner\backup.ps1"
    $trigger  = New-ScheduledTaskTrigger -Daily -At "02:00"
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
    Register-ScheduledTask -TaskName "Erez DB Backup" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "SYSTEM" -Force | Out-Null
    OK "Backup scheduled daily at 02:00"
} else {
    Info "Skipped backup -- run C:\actions-runner\rclone.exe config manually when ready"
}

# -- Done ------------------------------------------------------------------------
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "    Setup Complete!" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Site:      http://$LAN_IP" -ForegroundColor White
Write-Host "  Supabase:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backups:   C:\actions-runner\backups\" -ForegroundColor White
Write-Host ""
Write-Host "  Open INSTALL.html for the full checklist." -ForegroundColor Cyan
Write-Host ""
