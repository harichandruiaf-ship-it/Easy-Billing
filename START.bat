@echo off
setlocal
cd /d "%~dp0"
set PORT=8080

set "PYCMD="
where python >nul 2>nul
if not errorlevel 1 set "PYCMD=python"
if not defined PYCMD (
  where py >nul 2>nul
  if not errorlevel 1 set "PYCMD=py"
)

if not defined PYCMD (
  echo Python was not found on PATH or as the Windows launcher ^(py^).
  echo Install Python 3 from https://www.python.org/downloads/ ^(check "Add to PATH"^)
  echo Or open this folder in VS Code and use Live Server, or deploy to Firebase Hosting.
  pause
  exit /b 1
)

echo Easy Billing — starting local server
echo Open http://127.0.0.1:%PORT%/ in your browser if it does not open automatically.
echo Press Ctrl+C in this window to stop the server.
echo.

start "" cmd /c "ping -n 2 127.0.0.1 >nul && start http://127.0.0.1:%PORT%/"

%PYCMD% -m http.server %PORT%
endlocal
