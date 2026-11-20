@echo off
setlocal
title ModelPick key setup
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is required. Install it from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)
echo.
echo Opening ModelPick key setup...
echo This downloads/runs the current package with npx; no admin rights needed.
echo.
call npx --yes --package=modelpick@latest modelpick keys --ui
if errorlevel 1 (
  echo.
  echo The one-command path failed. Try:
  echo   npm install -g modelpick
  echo   modelpick keys --ui
  echo.
  pause
  exit /b 1
)
endlocal
