@echo off
title FitTrack AI Launcher
echo ========================================
echo   Launching FitTrack AI...
echo ========================================
cd /d "c:\Users\mihir\OneDrive\Desktop\fittrack"

powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if (-not $conn) { Start-Process python -ArgumentList '-m http.server 8080 --directory \"c:\Users\mihir\OneDrive\Desktop\fittrack\"' -WindowStyle Hidden; Write-Host 'Started FitTrack local server.' }"

timeout /t 1 >nul
start http://localhost:8080
exit
