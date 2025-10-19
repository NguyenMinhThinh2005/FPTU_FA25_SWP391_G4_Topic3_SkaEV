@echo off
echo ================================================
echo SkaEV Backend API - Quick Start
echo ================================================
cd /d "d:\FPT_University\FPTU_StudySource\term5\SWP391\Project\SkaEV_SWP_Project\SkaEV.API"

echo.
echo Building project...
dotnet build --configuration Release
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================
    echo BUILD FAILED! Check errors above.
    echo ================================================
    pause
    exit /b 1
)

echo.
echo ================================================
echo Starting API on http://localhost:5000
echo CORS enabled for http://localhost:5173
echo ================================================
echo.
echo Keep this window OPEN!
echo Press Ctrl+C to stop
echo.

dotnet run --no-build --configuration Release --no-launch-profile

pause
