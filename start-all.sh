#!/bin/bash
# AuraRecruit Services Launcher for macOS/Linux

echo "==================================================="
echo "  AuraRecruit AI Recruitment Platform Launcher (sh) "
echo "==================================================="
echo

# Helper array to store background process IDs
PIDS=()

# Handler to terminate all background services on exit
cleanup() {
    echo
    echo "==================================================="
    echo "  Shutting down all AuraRecruit services..."
    echo "==================================================="
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
    done
    exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "[1/5] Launching Node.js Backend API Server (Port 5000)..."
npm run dev:server &
PIDS+=($!)
sleep 2

echo "[2/5] Launching Vite Frontend Client (Port 5173)..."
npm run dev:client &
PIDS+=($!)
sleep 2

echo "[3/5] Launching Python AI Service (Port 8002)..."
cd python-ai
if [ -f "venv/bin/python" ]; then
    ./venv/bin/python -m uvicorn app.main:app --reload --port 8002 &
    PIDS+=($!)
else
    python3 -m uvicorn app.main:app --reload --port 8002 &
    PIDS+=($!)
fi
cd ..
sleep 2

echo "[4/5] Launching Avatar Service (Port 5002)..."
npm run dev:avatar &
PIDS+=($!)
sleep 2

echo "[5/5] Launching n8n Workflow Server (Port 5678)..."
npx n8n start &
PIDS+=($!)

echo
echo "==================================================="
echo "  All services launched! Logs will display below."
echo "  Press CTRL+C to stop all services simultaneously."
echo "==================================================="
echo

# Wait for all background jobs
wait
