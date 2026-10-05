@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================================
echo               CreatorOS Local Runner
echo ========================================================
echo.

if "%1"=="api" goto run_api
if "%1"=="web" goto run_web
if "%1"=="renderer" goto run_renderer
if "%1"=="all" goto run_all

echo Usage:
echo   start.bat api       - Start Hono API server on port 3001
echo   start.bat web       - Start Next.js Studio on port 3000
echo   start.bat renderer  - Start Remotion Preview Studio on port 3002
echo   start.bat all       - Launch all services in separate windows
goto end

:run_api
echo Starting API service on http://localhost:3001...
cd apps\api
call node dist\index.js
goto end

:run_web
echo Starting Next.js Web Studio on http://localhost:3000...
cd apps\web
call pnpm dev
goto end

:run_renderer
echo Starting Remotion Canvas Studio...
cd apps\renderer
call pnpm dev
goto end

:run_all
echo Starting all CreatorOS modules...
start "CreatorOS API (:3001)" cmd /k "cd /d %~dp0\..\apps\api && node dist\index.js"
start "CreatorOS Web (:3000)" cmd /k "cd /d %~dp0\..\apps\web && pnpm dev"
start "CreatorOS Renderer (:3002)" cmd /k "cd /d %~dp0\..\apps\renderer && pnpm dev"
echo All modules started in separate terminal windows.
goto end

:end
endlocal
