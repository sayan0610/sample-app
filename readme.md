# Task Manager — gRPC‑Web (React + Node + Envoy)

Modern React (Vite) client talking to a Node gRPC server via Envoy gRPC‑Web. No REST required.

## Architecture
- Client (React + Vite) → gRPC‑Web → Envoy (8080) → gRPC Server (Node, 50051)
- Protobuf schema: `API/grpc/tasks.proto`
- Client stubs: pre‑generated JS in `client/proto-stubs/` (no build step needed unless you change the proto)

## Prerequisites
- Node.js 18+ (20+ recommended)
- Docker (for running Envoy), or install Envoy locally
- Optional (only if you regenerate stubs): `protoc` and `protoc-gen-grpc-web`

## Repository layout
```
sample-app/
  API/
    grpc/
      server.js       # Node gRPC server (in‑memory tasks)
      tasks.proto     # Service + messages
    package.json
  client/
    src/
      services/TaskServiceGrpcWeb.js  # Client API wrapper
      ... UI, hooks, styles ...
    proto-stubs/      # Generated JS stubs consumed by the client
    package.json
    .env              # VITE_GRPC_WEB_ENDPOINT=http://localhost:8080
  envoy/
    envoy-docker.yaml # Use with Docker (routes to host.docker.internal:50051)
    envoy-local.yaml  # Use with a locally installed Envoy (routes to 127.0.0.1:50051)
```

## Quick start (development)

1) Install dependencies
```bash
cd API && npm install
cd ../client && npm install
```

2) Start the gRPC server (50051)
```bash
cd API
npm start
# env (optional): GRPC_HOST=0.0.0.0 GRPC_PORT=50051
```

3) Start Envoy (8080) — pick ONE

- Using Docker (from repo root):
```bash
docker run -d --name sample-envoy -p 8080:8080 -p 9901:9901 \
  -v "$(pwd)/envoy/envoy-docker.yaml":/etc/envoy/envoy.yaml \
  envoyproxy/envoy:v1.30.2
# Admin UI: http://localhost:9901  (ready/clusters)
```

- Using a locally installed Envoy:
```bash
envoy -c envoy/envoy-local.yaml --log-level info
```

4) Start the client (5173)
```bash
cd client
npm run dev
# opens http://localhost:5173
```

That’s it. The client calls Envoy at `VITE_GRPC_WEB_ENDPOINT` (see `client/.env`), which forwards to the gRPC server.

## Regenerate client stubs (optional)
Only if you change `tasks.proto`.
```bash
cd client
npm run proto:gen
```
Requires `protoc` and the `protoc-gen-grpc-web` plugin available in your PATH.

## Troubleshooting
- Envoy returns 503 on POST /tasks.Tasks/*
  - Ensure the gRPC server is running on 50051.
  - If using Docker, `envoy-docker.yaml` targets `host.docker.internal:50051`.
  - Check Envoy admin: http://localhost:9901/clusters (look for connect failures).

- CORS errors in the browser
  - Allowed origin `http://localhost:5173` is configured in both Envoy configs.
  - Make sure the UI runs on 5173 or update the CORS regex in the Envoy config.

- Port conflicts
  - Change the client port via Vite (`--port`), or update Envoy listener port in the YAML.
  - You can also change the gRPC server port via `GRPC_PORT`, but then update the Envoy target.

- Want to use REST instead?
  - This project is wired for gRPC‑Web. If you need REST, consider adding an HTTP gateway or a separate REST API.

## Scripts
- API: `npm start` (prod), `npm run dev` (nodemon)
- Client: `npm run dev`
- Client (optional): `npm run proto:gen` to regenerate stubs

## Notes
- The server uses an in‑memory store for demo/dev. Swap with a DB in `API/grpc/server.js` as needed.
- The client bundles pre‑generated JS stubs (`client/proto-stubs/`) for zero‑friction Vite dev.

## License
Educational sample. Add your license if publishing.