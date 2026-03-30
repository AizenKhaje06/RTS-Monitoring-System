@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Auto Git Commit and Push Script
echo ========================================
echo.

:loop
echo [%date% %time%] Checking for changes...

REM Check if there are any changes
git status --porcelain > temp_status.txt
set /p changes=<temp_status.txt
del temp_status.txt

if not "!changes!"=="" (
    echo [%date% %time%] Changes detected! Committing and pushing...
    
    REM Add all changes
    git add .
    
    REM Commit with timestamp
    git commit -m "Auto-commit: %date% %time%"
    
    REM Push to remote
    git push
    
    if !errorlevel! equ 0 (
        echo [%date% %time%] Successfully pushed changes!
    ) else (
        echo [%date% %time%] Error pushing changes. Check your git configuration.
    )
) else (
    echo [%date% %time%] No changes detected.
)

echo.
echo Waiting 30 seconds before next check...
timeout /t 30 /nobreak > nul
goto loop
