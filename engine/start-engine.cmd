@echo off
set "ENGINE_DIR=%~dp0"

start "CCC Engine" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%ENGINE_DIR%'; npm run admin"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5174/"
