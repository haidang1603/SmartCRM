@echo off
REM ==============================================================================
REM SmartCRM - MySQL Database Backup Script (Windows)
REM ==============================================================================

setlocal enabledelayedexpansion

set BACKUP_DIR=.\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ("%TIME%") do (set mytime=%%a%%b)
set mytime=%mytime: =0%
set TIMESTAMP=%mydate%_%mytime%

set BACKUP_FILE=%BACKUP_DIR%\smartcrm_backup_%TIMESTAMP%.sql

set CONTAINER_NAME=smartcrm-mysql
set DB_NAME=smartcrm
set DB_USER=root
set DB_PASSWORD=secret

echo [INFO] Creating backup of database '%DB_NAME%' from '%CONTAINER_NAME%'...

docker exec %CONTAINER_NAME% mysqldump -u%DB_USER% -p%DB_PASSWORD% --single-transaction --quick --routines --triggers %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Backup completed: %BACKUP_FILE%
) else (
    echo [ERROR] Backup failed with exit code %ERRORLEVEL%
)

endlocal
