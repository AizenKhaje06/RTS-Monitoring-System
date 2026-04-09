@echo off
echo ========================================
echo Quick Git Commit and Push
echo ========================================
echo.

REM Add all changes
echo Adding all changes...
git add .

REM Check if there are changes to commit
git diff-index --quiet HEAD --
if %errorlevel% equ 0 (
    echo No changes to commit.
    pause
    exit /b 0
)

REM Prompt for commit message
set /p message="Enter commit message (or press Enter for default): "

REM Use default message if empty
if "%message%"=="" (
    set message=Quick update - %date% %time%
)

REM Commit changes
echo.
echo Committing changes...
git commit -m "%message%"

REM Push to remote
echo.
echo Pushing to remote...
git push

echo.
echo ========================================
echo Done! Changes pushed successfully.
echo ========================================
pause
