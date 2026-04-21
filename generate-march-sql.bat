@echo off
echo ================================================
echo MARCH DATA SQL GENERATOR
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Check if input file exists
if not exist "full-export.sql" (
    echo ERROR: full-export.sql not found!
    echo.
    echo Please:
    echo 1. Go to your RTS system
    echo 2. Parcel -^> Insights -^> Download SQL File
    echo 3. Save it as 'full-export.sql' in this folder
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo Found full-export.sql
echo.
echo Filtering March data...
echo.

REM Run the Python script
python filter-march-data.py

if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate March SQL
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo SUCCESS!
echo ================================================
echo.
echo March SQL file has been generated!
echo File: march-only-export.sql
echo.
echo Next steps:
echo 1. Open march-only-export.sql
echo 2. Copy all contents (Ctrl+A, Ctrl+C)
echo 3. Open Supabase SQL Editor
echo 4. Paste and Run
echo.
pause
