#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Variables
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
SERVER_DIR="$PROJECT_DIR/server"
NGINX_CONF="/opt/homebrew/etc/nginx/nginx.conf"
# Use VITE_APP_DOMAIN from .env for domain
# DOMAIN="$VITE_APP_DOMAIN"
CUSTOM_CONF="$PROJECT_DIR/cdpshotclock.conf"
LOG_DIR="$PROJECT_DIR/logs"
SESSION_DATA="$SERVER_DIR/sessions.json"
BACKEND_PID_FILE="$PROJECT_DIR/backend.pid"
BACKEND_LOG_FILE="$PROJECT_DIR/backend.log"

# 1. Kill all backend server processes (robust)
BACKEND_PIDS=$(pgrep -f 'server/dist/index.(js|cjs)' || true)
if [ -n "$BACKEND_PIDS" ]; then
  echo "Killing old backend server processes: $BACKEND_PIDS"
  echo "[DEPLOY] Killing old backend server processes: $BACKEND_PIDS" >> "$BACKEND_LOG_FILE"
  kill $BACKEND_PIDS 2>/dev/null || true
  sleep 2
fi
# Also use pkill for extra safety
pkill -f 'server/dist/index.js' 2>/dev/null || true
pkill -f 'server/dist/index.cjs' 2>/dev/null || true
sleep 2

# Remove backend.pid if exists
if [ -f "$BACKEND_PID_FILE" ]; then
  rm "$BACKEND_PID_FILE"
fi

# Check if any backend processes are still running
STILL_RUNNING=$(pgrep -f 'server/dist/index.(js|cjs)' || true)
if [ -n "$STILL_RUNNING" ]; then
  echo "[WARNING] Some backend server processes are still running: $STILL_RUNNING"
  echo "[WARNING] Some backend server processes are still running: $STILL_RUNNING" >> "$BACKEND_LOG_FILE"
fi

# 2. Kill Nginx (if running) and wait for port 80 to be free
if pgrep nginx > /dev/null; then
  echo "Stopping Nginx..."
  sudo nginx -s stop || true
fi
# Wait for port 80 to be free
for i in {1..10}; do
  if sudo lsof -i :80 | grep nginx > /dev/null; then
    echo "Waiting for Nginx to release port 80..."
    sleep 1
  else
    break
  fi
done

# 3. Delete old session data, logs, and build artifacts
[ -f "$SESSION_DATA" ] && rm "$SESSION_DATA"
[ -d "$LOG_DIR" ] && rm -rf "$LOG_DIR"
[ -d "$DIST_DIR" ] && rm -rf "$DIST_DIR"
[ -d "$SERVER_DIR/dist" ] && rm -rf "$SERVER_DIR/dist"
[ -f "$BACKEND_LOG_FILE" ] && rm "$BACKEND_LOG_FILE"

# 4. Build frontend and backend
npm run build
npm run build:server

# Rename backend output to .cjs for CommonJS compatibility
if [ -f "$SERVER_DIR/dist/index.js" ]; then
  mv "$SERVER_DIR/dist/index.js" "$SERVER_DIR/dist/index.cjs"
fi

# 5. Update server block config (cdpshotclock.conf) and generate nginx.conf with envsubst
if [ -f "$CUSTOM_CONF" ]; then
  export PROJECT_ROOT
  export VITE_APP_DOMAIN
  export API_HOST
  echo "VITE_APP_DOMAIN is: $VITE_APP_DOMAIN"
  echo "PROJECT_ROOT is: $PROJECT_ROOT"
  echo "API_HOST is: $API_HOST"
  if [ -z "$VITE_APP_DOMAIN" ]; then
    echo "[ERROR] VITE_APP_DOMAIN is not set. Please set it in your .env file."
    exit 1
  fi
  if [ -z "$PROJECT_ROOT" ]; then
    echo "[ERROR] PROJECT_ROOT is not set. Please set it in your .env file."
    exit 1
  fi
  if [ -z "$API_HOST" ]; then
    echo "[ERROR] API_HOST is not set. Please set it in your .env file."
    exit 1
  fi
  ENV_SUBST_BIN=$(command -v envsubst || echo "/opt/homebrew/opt/gettext/bin/envsubst")
  if [ ! -x "$ENV_SUBST_BIN" ]; then
    echo "[ERROR] envsubst not found. Please install gettext and ensure envsubst is in your PATH."
    exit 1
  fi
  $ENV_SUBST_BIN '${PROJECT_ROOT} ${VITE_APP_DOMAIN} ${API_HOST} ${PORT}' < "$CUSTOM_CONF" | sudo tee "$NGINX_CONF" > /dev/null
else
  echo "Custom Nginx server block $CUSTOM_CONF not found!"
  exit 1
fi

# 6. Ensure nginx.conf includes cdpshotclock.conf
# (Removed obsolete check for include $CUSTOM_CONF in $NGINX_CONF)

# 7. Start backend server in background (fresh log)
nohup npm run start:server > "$BACKEND_LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"

# Check for multiple backend processes after starting
sleep 2
BACKEND_PIDS_AFTER=$(pgrep -f 'server/dist/index.(js|cjs)' || true)
BACKEND_COUNT=$(echo "$BACKEND_PIDS_AFTER" | wc -w | tr -d ' ')
echo "[DEPLOY] Backend PIDs after start: $BACKEND_PIDS_AFTER" | tee -a "$BACKEND_LOG_FILE"
if [ "$BACKEND_COUNT" -gt 1 ]; then
  echo "[WARNING] Multiple backend server processes detected after startup: $BACKEND_COUNT ($BACKEND_PIDS_AFTER)" | tee -a "$BACKEND_LOG_FILE"
fi

# 8. Start Nginx
sudo nginx

# 9. Print success message
if curl -s --head http://$VITE_APP_DOMAIN | grep "200 OK" > /dev/null; then
  echo "\nDeployment successful! Visit http://$VITE_APP_DOMAIN on your local network."
else
  echo "\nDeployment script completed, but the app did not return 200 OK. Check logs."
fi 