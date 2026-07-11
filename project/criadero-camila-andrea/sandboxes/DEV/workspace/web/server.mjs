import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";
import { CriaderoApi, createSeedState, recalcAll } from "./src/criadero-core.mjs";
import { JsonFileStorage } from "./src/file-storage.mjs";
import { MODULES } from "./src/domain.mjs";

const root = resolve(".");
const port = Number(process.env.PORT || 4177);
const dataFile = process.env.DATA_FILE || resolve(root, "data", "criadero-db.json");
const storage = new JsonFileStorage(dataFile);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function loadState() {
  let state = storage.read();
  if (!state) {
    state = createSeedState();
    storage.write(state);
  }
  return recalcAll(JSON.parse(JSON.stringify(state)));
}

function saveState(state) {
  storage.write(state);
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, x-user-id",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolvePromise) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) return resolvePromise({});
      try {
        resolvePromise(JSON.parse(raw));
      } catch {
        resolvePromise({});
      }
    });
  });
}

function getActor(state, req) {
  const userId = req.headers["x-user-id"] || "USR-001";
  return state.users.find((u) => u.id === userId) || state.users[0];
}

async function handleApi(req, res, url) {
  const method = req.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  const body = await readBody(req);
  const state = loadState();
  const actor = getActor(state, req);

  const store = {
    getState: () => JSON.parse(JSON.stringify(state)),
    transact: (actorUser, reason, fn) => {
      const before = JSON.parse(JSON.stringify(state));
      const result = fn(state);
      recalcAll(state);
      saveState(state);
      return result;
    },
  };

  const api = new CriaderoApi(store, actor);
  const response = api.request(method, pathname, body);
  if (response.error) {
    const code = response.error.code === "not_found" ? 404
      : response.error.code === "validation_error" || response.error.code === "duplicate_record" || response.error.code === "duplicate_paid_month" || response.error.code === "active_stay_exists" ? 400
      : response.error.code === "auth_failed" || response.error.code === "invalid_invitation" ? 401
      : response.error.code === "permission_denied" ? 403
      : response.error.code === "state_conflict" ? 409
      : 500;
    return jsonResponse(res, code, response);
  }
  jsonResponse(res, 200, response);
}

function handleStatic(req, res, url) {
  const candidate = resolve(join(root, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)));
  if (!candidate.startsWith(root) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": mimeTypes[extname(candidate)] || "application/octet-stream" });
  createReadStream(candidate).pipe(res);
}

createServer(async (req, res) => {
  const rawUrl = req.url || "/";
  const url = new URL(rawUrl, `http://localhost:${port}`);

  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }

  if (url.pathname === "/healthz") {
    jsonResponse(res, 200, { status: "ok", timestamp: new Date().toISOString() });
    return;
  }

  if (url.pathname.startsWith("/api/v1")) {
    await handleApi(req, res, url);
    return;
  }

  handleStatic(req, res, url);
}).listen(port, () => {
  console.log(`criadero_camila_andrea_url=http://127.0.0.1:${port}`);
  console.log(`data_file=${dataFile}`);
});
