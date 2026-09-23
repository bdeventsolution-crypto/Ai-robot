@echo off
title HERMES AI CYBERNETIC CO-PILOT
color 0b
echo ===================================================================
echo           HERMES AI // 3D CYBERNETIC MARKET CO-PILOT
echo        Commander Omar Sharif Shuvo Institutional Mission Control
echo ===================================================================
echo.
echo [1/2] Initializing Node.js Telemetry and Market Engine...
cd /d "%~dp0"

echo [2/2] Launching Hermes 3D Robot Co-Pilot at http://localhost:7777...
start http://localhost:7777

node server.js
pause
