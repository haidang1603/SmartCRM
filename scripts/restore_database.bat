@echo off
REM ==============================================================================
REM SmartCRM - MySQL Database Restore Script (Windows)
REM ==============================================================================

setlocal

if "%~1"=="" (
    echo Usage: restore_database.bat ^<path_to_backup_file.sql^>
    exit /b 1
)

set BACKUP_FILE=%~1
set CONTAINER_NAME=smartcrm-mysql
set DB_NAME=smartcrm
set DB_USER=root
set DB_PASSWORD=secret

if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file not found: %BACKUP_FILE%
    exit /b 1
)

echo [WARNING] This will overwrite database '%DB_NAME%' in container '%CONTAINER_NAME%'!
set /p CONFIRM="Type YES to confirm: "
if /i not "%CONFIRM%"=="YES" (
    echo Restore cancelled.
    exit /b 0
)

echo [INFO] Restoring database from '%BACKUP_FILE%'...
docker exec -i %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Database restored successfully!
) else (
    echo [ERROR] Restore failed with code %ERRORLEVEL%
)

endlocal
