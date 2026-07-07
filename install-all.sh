#!/bin/bash
# AuraRecruit Dependency Setup Script for macOS/Linux

echo "==================================================="
echo "  AuraRecruit Monorepo Dependency Setup Script (bash)"
echo "==================================================="
echo

echo "[1/4] Installing Root and Workspace Node Modules..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed. Please ensure Node.js is installed."
    exit 1
fi

echo "[2/4] Setting up Python Virtual Environment..."
cd python-ai
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

if [ $? -ne 0 ]; then
    echo "[ERROR] Python virtual environment creation failed. Make sure python3 is installed."
    cd ..
    exit 1
fi

echo "[3/4] Installing Python requirements..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python packages. Check python-ai/requirements.txt."
    cd ..
    exit 1
fi
deactivate
cd ..

echo "[4/4] Generating default .env files if they do not exist..."
if [ ! -f "client/.env" ]; then
    cp client/.env.example client/.env
    echo "Created client/.env from example."
else
    echo "client/.env already exists."
fi

if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "Created server/.env from example."
else
    echo "server/.env already exists."
fi

if [ ! -f "python-ai/.env" ]; then
    cat <<EOT > python-ai/.env
APP_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
SERVER_URL=http://localhost:5000
PORT=8002
EOT
    echo "Created python-ai/.env with defaults."
else
    echo "python-ai/.env already exists."
fi

if [ ! -f "avatar-service/.env" ]; then
    cat <<EOT > avatar-service/.env
NODE_ENV=development
PORT=5002
SERVER_URL=http://localhost:5000
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
EOT
    echo "Created avatar-service/.env with defaults."
else
    echo "avatar-service/.env already exists."
fi

echo
echo "==================================================="
echo "  Setup Completed Successfully!"
echo "  1. Please update keys (MongoDB, Gemini, Cloudinary) in .env files."
echo "  2. Run './start-all.sh' to launch the platform (or run services manually)."
echo "==================================================="
echo
chmod +x start-all.sh 2>/dev/null
chmod +x stop-all.sh 2>/dev/null
