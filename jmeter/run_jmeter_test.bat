@echo off
setlocal

echo ====================================================================
echo        SMARTCRM - PHASE 4: JMETER PERFORMANCE TEST RUNNER
echo ====================================================================
echo.

set HOST=localhost
set PORT=8080
set THREADS=10
set RAMPUP=3
set LOOPS=20
set RESULT_DIR=results

if not exist %RESULT_DIR% (
    mkdir %RESULT_DIR%
)

set TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set JTL_FILE=%RESULT_DIR%\run_%TIMESTAMP%.jtl
set HTML_DIR=%RESULT_DIR%\report_%TIMESTAMP%

echo [1/3] Target: http://%HOST%:%PORT%
echo [2/3] Concurrency: %THREADS% Virtual Users, %LOOPS% loops (Total %THREADS% x %LOOPS% iterations)
echo [3/3] Output JTL: %JTL_FILE%
echo.

where jmeter >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Apache JMeter is not found in system PATH.
    echo Please install Apache JMeter 5.6+ and add its 'bin' directory to PATH.
    echo Alternatively, run benchmarks directly from SmartCRM Performance Lab UI at:
    echo   http://localhost:5173/ (Tab: Performance Lab)
    exit /b 1
)

echo Executing JMeter Non-GUI test...
jmeter -n -t smartcrm_performance_test_plan.jmx -l %JTL_FILE% -e -o %HTML_DIR% -Jhost=%HOST% -Jport=%PORT% -Jthreads=%THREADS% -Jrampup=%RAMPUP% -Jloops=%LOOPS%

echo.
echo ====================================================================
echo Benchmark complete! HTML Dashboard generated at: %HTML_DIR%\index.html
echo ====================================================================
endlocal
