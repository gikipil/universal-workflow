@echo off
rem SPDX-License-Identifier: AGPL-3.0-only
rem Copyright (c) 2026 gikipil.
setlocal
set "UW_SETUP=%~dp0resources\installer\Install.ps1"
if not exist "%UW_SETUP%" set "UW_SETUP=%~dp0installer\Install.ps1"
if not exist "%UW_SETUP%" (
  echo Extract the complete ZIP first, then run Install.cmd.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%UW_SETUP%"
if errorlevel 1 pause
