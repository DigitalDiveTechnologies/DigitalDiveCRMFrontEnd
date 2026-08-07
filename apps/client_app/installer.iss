; Inno Setup Compiler Script for UAE Accounting & POS Desktop App
; Generates standalone Windows Setup Installer (UAE_POS_Setup_v1.0.0.exe)

[Setup]
AppId={{8F92348A-0294-4F2A-A912-389148204921}}
AppName=UAE Accounting Desktop POS
AppVersion=1.0.0
AppPublisher=UAE Accounting Platform LLC
AppPublisherURL=https://uae-accounting.ae
DefaultDirName={autopf}\UAE Accounting POS
DefaultGroupName=UAE Accounting POS
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=UAE_POS_Setup_v1.0.0
SetupIconFile=windows\runner\resources\app_icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\UAE Accounting POS"; Filename: "{app}\client_app.exe"
Name: "{autodesktop}\UAE Accounting POS"; Filename: "{app}\client_app.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\client_app.exe"; Description: "{cm:LaunchProgram,UAE Accounting Desktop POS}"; Flags: postinstall nowait skipifsilent
