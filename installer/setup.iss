#define AppName    "Erez Legal Management"
#define AppVersion "1.0"

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Erez Legal
DefaultDirName=C:\erez-legal
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\dist-installer
OutputBaseFilename=ErezLegalSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
WizardStyle=modern
WizardSizePercent=120
SetupIconFile=
UninstallDisplayName={#AppName}
DisableWelcomePage=no
ShowLanguageDialog=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\INSTALL.html";       DestDir: "C:\erez-legal";                  Flags: ignoreversion
Source: "backup.ps1";            DestDir: "C:\actions-runner";              Flags: ignoreversion
Source: "..\dist\*";             DestDir: "C:\erez-legal\dist";             Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\Dockerfile";         DestDir: "C:\erez-legal";                  Flags: ignoreversion
Source: "..\nginx.conf";         DestDir: "C:\erez-legal";                  Flags: ignoreversion

[Code]
var
  IPPage:      TInputQueryWizardPage;
  RunnerPage:  TInputQueryWizardPage;
  OptionsPage: TInputOptionWizardPage;
  LAN_IP:      String;
  RunnerToken: String;
  SetupRunner: Boolean;
  SetupBackup: Boolean;

{ ── Helper: run a command, show error if it fails ── }
function RunCmd(Cmd, Params, WorkDir: String): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec(Cmd, Params, WorkDir, SW_SHOW, ewWaitUntilTerminated, ResultCode);
  if (not Result) or (ResultCode <> 0) then
  begin
    MsgBox('Command failed:' + #13#10 + Cmd + ' ' + Params + #13#10 + 'Exit code: ' + IntToStr(ResultCode), mbError, MB_OK);
    Result := False;
  end;
end;

{ ── Wizard pages ── }
procedure InitializeWizard;
begin
  { Page 1 — LAN IP }
  IPPage := CreateInputQueryPage(wpWelcome,
    'Network Configuration',
    'Enter the server''s LAN IP address',
    'This is the IP employees will type in their browser to access the system.' + #13#10 +
    'Open PowerShell and run:  ipconfig' + #13#10 +
    'Look for "Ethernet adapter" and copy the IPv4 Address.');
  IPPage.Add('LAN IP Address (e.g. 192.168.1.10):', False);

  { Page 2 — GitHub Runner }
  RunnerPage := CreateInputQueryPage(IPPage.ID,
    'Auto-Deploy Setup (Optional)',
    'GitHub Actions Runner Token',
    'This enables automatic deployment when you push code.' + #13#10 +
    'Get a token from:' + #13#10 +
    'https://github.com/workdavid353-oss/erez-management/settings/actions/runners/new' + #13#10 + #13#10 +
    'Leave blank to skip and set up manually later.');
  RunnerPage.Add('GitHub Runner Token:', False);

  { Page 3 — Options }
  OptionsPage := CreateInputOptionPage(RunnerPage.ID,
    'Additional Setup',
    'Select which components to install',
    '',
    False, False);
  OptionsPage.Add('Set up nightly Google Drive database backup');
end;

{ ── Validate IP page ── }
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = IPPage.ID then
  begin
    if Trim(IPPage.Values[0]) = '' then
    begin
      MsgBox('Please enter the LAN IP address.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

{ ── After wizard finishes — run setup ── }
procedure CurStepChanged(CurStep: TSetupStep);
var
  PS:          String;
  AnonKey:     String;
  ServiceKey:  String;
  EnvContent:  String;
  RunnerDir:   String;
  ProjectDir:  String;
  SvcName:     String;
  RunnerVer:   String;
  ResultCode:  Integer;
begin
  if CurStep <> ssPostInstall then Exit;

  PS         := ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe');
  RunnerDir  := 'C:\actions-runner';
  ProjectDir := 'C:\erez-legal\repo';
  LAN_IP     := Trim(IPPage.Values[0]);
  RunnerToken:= Trim(RunnerPage.Values[0]);
  SetupBackup:= OptionsPage.Values[0];

  { 1. Create directories }
  ForceDirectories(RunnerDir);
  ForceDirectories(RunnerDir + '\backups');
  ForceDirectories(RunnerDir + '\rclone');

  { 2. Write .env.production }
  AnonKey    := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NzkxOTczMjYsImV4cCI6MjA5NDU1NzMyNn0.khCwUj_aXgl6l-ryIgDSt6ykmZpqDmFdRmMco4qRTn8';
  ServiceKey := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc3OTE5NzMyNiwiZXhwIjoyMDk0NTU3MzI2fQ.9yVKeUkP6HAzujsbqdwtgm4-c0yU06vN7TxDesLjMt8';
  EnvContent := 'VITE_SUPABASE_URL=http://' + LAN_IP + ':8000' + #10 +
                'VITE_SUPABASE_ANON_KEY=' + AnonKey + #10 +
                'VITE_SUPABASE_SERVICE_ROLE_KEY=' + ServiceKey;
  SaveStringToFile(RunnerDir + '\.env.production',  EnvContent, False);

  { 3. Docker build from bundled dist (no git/npm needed) }
  RunCmd(PS, '-ExecutionPolicy Bypass -Command "docker build --pull=false --no-cache -t erez-frontend C:\erez-legal"', '');
  Exec(PS, '-ExecutionPolicy Bypass -Command "docker stop erez-frontend 2>$null; docker rm erez-frontend 2>$null"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  RunCmd(PS, '-ExecutionPolicy Bypass -Command "docker run -d -p 80:80 --name erez-frontend --restart unless-stopped erez-frontend"', '');

  { 6. GitHub Actions Runner (optional) }
  if RunnerToken <> '' then
  begin
    RunCmd(PS,
      '-ExecutionPolicy Bypass -Command "' +
      '$v = (Invoke-RestMethod https://api.github.com/repos/actions/runner/releases/latest).tag_name -replace ''v'','''' ;' +
      'Invoke-WebRequest -Uri (''https://github.com/actions/runner/releases/download/v'' + $v + ''/actions-runner-win-x64-'' + $v + ''.zip'') -OutFile C:\actions-runner\runner.zip -UseBasicParsing ;' +
      '[System.IO.Compression.ZipFile]::ExtractToDirectory(''C:\actions-runner\runner.zip'', ''C:\actions-runner'') ;' +
      'Set-Location C:\actions-runner ;' +
      '.\config.cmd --url https://github.com/workdavid353-oss/erez-management --token ' + RunnerToken + ' --name erez-runner --labels self-hosted,Windows --work _work --unattended "',
      '');

    SvcName := 'actions.runner.workdavid353-oss.erez-management.erez-runner';
    Exec('sc.exe', 'create ' + SvcName + ' binpath= "C:\actions-runner\bin\RunnerService.exe" start= auto displayname= "GitHub Actions Runner (erez-runner)"',
         '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('sc.exe', 'failure ' + SvcName + ' reset= 86400 actions= restart/5000/restart/5000/restart/5000',
         '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(PS, '-ExecutionPolicy Bypass -Command "Start-Service ''' + SvcName + '''"',
         '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;

  { 7. Backup setup (optional) }
  if SetupBackup then
  begin
    RunCmd(PS,
      '-ExecutionPolicy Bypass -Command "' +
      '$v = (Invoke-RestMethod https://api.github.com/repos/rclone/rclone/releases/latest).tag_name ;' +
      'Invoke-WebRequest -Uri (''https://github.com/rclone/rclone/releases/download/'' + $v + ''/rclone-'' + $v + ''-windows-amd64.zip'') -OutFile C:\actions-runner\rclone.zip -UseBasicParsing ;' +
      '$z = [System.IO.Compression.ZipFile]::OpenRead(''C:\actions-runner\rclone.zip'') ;' +
      '$e = $z.Entries | Where-Object { $_.Name -eq ''rclone.exe'' } ;' +
      '[System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, ''C:\actions-runner\rclone.exe'', $true) ;' +
      '$z.Dispose() "',
      '');

    Exec(PS,
      '-ExecutionPolicy Bypass -Command "' +
      '$a = New-ScheduledTaskAction -Execute powershell.exe -Argument ''-ExecutionPolicy Bypass -NonInteractive -File C:\actions-runner\backup.ps1'' ;' +
      '$t = New-ScheduledTaskTrigger -Daily -At 02:00 ;' +
      '$s = New-ScheduledTaskSettingsSet -StartWhenAvailable ;' +
      'Register-ScheduledTask -TaskName ''Erez DB Backup'' -Action $a -Trigger $t -Settings $s -RunLevel Highest -User SYSTEM -Force "',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

    MsgBox(
      'rclone downloaded.' + #13#10 + #13#10 +
      'NEXT STEP: Authenticate Google Drive by running:' + #13#10 +
      'C:\actions-runner\rclone.exe config' + #13#10 + #13#10 +
      'Then test the backup:' + #13#10 +
      'powershell -File C:\actions-runner\backup.ps1',
      mbInformation, MB_OK);
  end;
end;

function GetIP(Param: String): String;
begin
  Result := LAN_IP;
end;

[Run]
Filename: "http://{code:GetIP}"; Description: "Open site in browser"; Flags: postinstall skipifsilent shellexec unchecked
Filename: "C:\erez-legal\INSTALL.html"; Description: "Open installation checklist"; Flags: postinstall skipifsilent shellexec unchecked
