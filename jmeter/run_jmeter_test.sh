#!/bin/bash
set -e

echo "===================================================================="
echo "       SMARTCRM - PHASE 4: JMETER PERFORMANCE TEST RUNNER"
echo "===================================================================="

HOST="${1:-localhost}"
PORT="${2:-8080}"
THREADS="${3:-10}"
LOOPS="${4:-20}"
RAMPUP=3
RESULT_DIR="results"

mkdir -p "$RESULT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
JTL_FILE="$RESULT_DIR/run_${TIMESTAMP}.jtl"
HTML_DIR="$RESULT_DIR/report_${TIMESTAMP}"

echo "[1/3] Target: http://${HOST}:${PORT}"
echo "[2/3] Concurrency: ${THREADS} Virtual Users, ${LOOPS} loops"
echo "[3/3] Output JTL: ${JTL_FILE}"
echo ""

if ! command -v jmeter &> /dev/null; then
    echo "[ERROR] Apache JMeter is not found in PATH."
    echo "Please install JMeter or use the SmartCRM Performance Lab Web UI."
    exit 1
fi

echo "Executing JMeter Non-GUI benchmark..."
jmeter -n -t smartcrm_performance_test_plan.jmx \
    -l "$JTL_FILE" \
    -e -o "$HTML_DIR" \
    -Jhost="$HOST" \
    -Jport="$PORT" \
    -Jthreads="$THREADS" \
    -Jrampup="$RAMPUP" \
    -Jloops="$LOOPS"

echo ""
echo "===================================================================="
echo "Benchmark complete! HTML Dashboard available at: ${HTML_DIR}/index.html"
echo "===================================================================="
