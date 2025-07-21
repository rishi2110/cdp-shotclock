#!/bin/bash

# Load environment variables from .env if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

BACKEND_PORT=${PORT:-3001}
FRONTEND_PORT=${VITE_FRONTEND_PORT:-5173}
API_BASE=${VITE_API_BASE:-http://localhost:$BACKEND_PORT}
APP_DOMAIN=${VITE_APP_DOMAIN:-http://localhost:$FRONTEND_PORT}

echo "🚀 Starting Poker Shot Clock Development Servers..."

# Start backend server in background
echo "📡 Starting backend server on port $BACKEND_PORT..."
PORT=$BACKEND_PORT npm run dev:server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo "🌐 Starting frontend server on port $FRONTEND_PORT..."
VITE_API_BASE=$API_BASE npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "📡 Backend: $API_BASE"
echo "🌐 Frontend: $APP_DOMAIN"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Wait for both processes
wait 