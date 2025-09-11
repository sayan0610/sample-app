#!/usr/bin/env bash
set -Eeuo pipefail

# Dev orchestrator for: API (gRPC 50051) + Envoy (8080) + Client (Vite 5173)
# Usage:
#   ./dev.sh up         # start API + Envoy (Docker) then run Client in foreground
#   ./dev.sh down       # stop Envoy container and API started by this script
#   ./dev.sh status     # show port listeners and Envoy readiness

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
LOG_DIR="$ROOT_DIR/.logs"
PID_DIR="$ROOT_DIR/.pids"
mkdir -p "$LOG_DIR" "$PID_DIR"

API_PORT="50051"
ENVOY_PORT="8080"
ENVOY_ADMIN_PORT="9901"
CLIENT_PORT="5173"
ENVOY_CONTAINER="sample-envoy"
ENVOY_IMAGE="envoyproxy/envoy:v1.30.2"

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
note() { printf "[dev] %s\n" "$*"; }
err() { printf "[dev][error] %s\n" "$*" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

wait_for_port() {
  local port="$1"; local seconds="${2:-20}"; local i=0
  while ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    (( i++ >= seconds )) && return 1
    sleep 1
  done
}

wait_for_http() {
  local url="$1"; local seconds="${2:-20}"; local i=0
  while ! curl -fsS "$url" >/dev/null 2>&1; do
    (( i++ >= seconds )) && return 1
    sleep 1
  done
}

start_api() {
  require_cmd node; require_cmd npm
  bold "Starting gRPC API (:$API_PORT)"
  local apidir="$ROOT_DIR/API"
  [[ -d "$apidir/node_modules" ]] || (cd "$apidir" && npm install)
  # Background the API and store PID
  (cd "$apidir" && nohup npm start >/"$LOG_DIR"/api.out 2>/"$LOG_DIR"/api.err & echo $! >"$PID_DIR"/api.pid)
  if ! wait_for_port "$API_PORT" 25; then
    err "API didn't bind to :$API_PORT in time. See $LOG_DIR/api.err"
    exit 1
  fi
  note "gRPC API listening on :$API_PORT"
}

start_envoy_docker() {
  require_cmd docker; require_cmd curl
  bold "Starting Envoy via Docker (:$ENVOY_PORT -> gRPC :$API_PORT)"
  docker rm -f "$ENVOY_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$ENVOY_CONTAINER" \
    -p "$ENVOY_PORT":8080 -p "$ENVOY_ADMIN_PORT":9901 \
    -v "$ROOT_DIR/envoy/envoy-docker.yaml":/etc/envoy/envoy.yaml \
    "$ENVOY_IMAGE" >/dev/null
  # Wait for admin to be ready
  if ! wait_for_http "http://localhost:$ENVOY_ADMIN_PORT/ready" 25; then
    err "Envoy admin not responding on :$ENVOY_ADMIN_PORT. Check 'docker logs $ENVOY_CONTAINER'"
    exit 1
  fi
  note "Envoy is up. Admin: http://localhost:$ENVOY_ADMIN_PORT"
}

start_client() {
  require_cmd npm
  bold "Starting Client (Vite :$CLIENT_PORT)"
  local clientdir="$ROOT_DIR/client"
  [[ -d "$clientdir/node_modules" ]] || (cd "$clientdir" && npm install)
  # Ensure endpoint env exists (defaults are already in repo, but don't hurt to assert)
  if ! grep -q "VITE_GRPC_WEB_ENDPOINT" "$clientdir/.env" 2>/dev/null; then
    echo "VITE_GRPC_WEB_ENDPOINT=http://localhost:$ENVOY_PORT" >> "$clientdir/.env"
  fi
  # Run in foreground so user sees output; on exit, cleanup happens
  (cd "$clientdir" && npm run dev)
}

stop_api() {
  if [[ -f "$PID_DIR/api.pid" ]]; then
    local pid; pid=$(cat "$PID_DIR/api.pid" || true)
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      note "Stopping API (pid $pid)"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/api.pid"
  fi
}

stop_envoy() {
  note "Stopping Envoy container ($ENVOY_CONTAINER)"
  docker rm -f "$ENVOY_CONTAINER" >/dev/null 2>&1 || true
}

status() {
  bold "Status"
  printf "- API :%s -> " "$API_PORT"; lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN || true
  printf "- Envoy :%s admin :%s\n" "$ENVOY_PORT" "$ENVOY_ADMIN_PORT"
  curl -fsS "http://localhost:$ENVOY_ADMIN_PORT/ready" 2>/dev/null && echo || echo "(admin not responding)"
  printf "- Client :%s\n" "$CLIENT_PORT"; lsof -nP -iTCP:"$CLIENT_PORT" -sTCP:LISTEN || true
}

cleanup() {
  note "Cleaning up background processes..."
  stop_api
  stop_envoy
}

cmd="${1:-up}"
case "$cmd" in
  up)
    trap cleanup EXIT INT TERM
    start_api
    start_envoy_docker
    note "Opening client... (Ctrl+C to stop)"
    start_client
    ;;
  down)
    cleanup
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 {up|down|status}" >&2
    exit 1
    ;;
esac
