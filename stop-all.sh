#!/bin/bash
# Stop all AuraRecruit services running on development ports (macOS/Linux)

echo "==================================================="
echo "  Stopping all AuraRecruit active service ports...  "
echo "==================================================="
echo

PORTS=(5000 5002 5173 5678 8002)

for port in "${PORTS[@]}"; do
    # Find process ID on this port
    pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid listening on port $port..."
        kill -9 $pid 2>/dev/null
    else
        echo "No service found running on port $port."
    fi
done

echo
echo "All services on ports 5000, 5002, 5173, 5678, and 8002 have been checked/terminated."
echo "==================================================="
echo
