@echo off
REM Download Node.js LTS installer
powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'node-installer.msi'}"

REM Install Node.js
msiexec /i node-installer.msi /quiet /norestart

REM Clean up
del node-installer.msi

REM Add to PATH and verify
setx PATH "%PATH%;C:\Program Files\nodejs"
node --version
npm --version

echo Node.js installation complete!
pause
