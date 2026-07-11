import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { CriaderoApi, createSeedState, recalcAll } from "./src/criadero-core.mjs";
import { JsonFileStorage } from "./src/file-storage.mjs";

const root = resolve(".");
const port = Number(process.env.PORT || 4177);
const dataFile = process.env.DATA_FILE || resolve(root, "data", "criadero-db.json");
const uploadsDir = process.env.UPLOADS_DIR || resolve(root, "uploads");
const storage = new JsonFileStorage(dataFile);
const MAX_BODY_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".svg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"]);

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

const sessions = new Map();

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
    "access-control-allow-headers": "content-type, authorization, x-user-id",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolvePromise) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => { size += chunk.length; if (size > MAX_BODY_SIZE) { req.destroy(); return resolvePromise({ _error: "body_too_large" }); } chunks.push(chunk); });
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

function newSession() {
  return randomBytes(32).toString("hex");
}

function readAuthHeader(req) {
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return req.headers["x-user-id"] || null;
}

function resolveActor(state, req) {
  const sessionId = readAuthHeader(req);
  if (!sessionId) return state.users.find((u) => u.id === "USR-001") || state.users[0];
  if (sessions.has(sessionId)) {
    const userId = sessions.get(sessionId);
    return state.users.find((u) => u.id === userId) || state.users[0];
  }
  return state.users.find((u) => u.id === sessionId) || state.users[0];
}

async function handleAuth(req, res, url, body) {
  if (url.pathname === "/api/v1/auth/login" && req.method === "POST") {
    const state = loadState();
    const user = state.users.find((u) => u.email === body.email && u.status === "active");
    if (!user) return jsonResponse(res, 401, { error: { code: "auth_failed", message: "Credenciales invalidas" } });
    const sessionId = newSession();
    sessions.set(sessionId, user.id);
    return jsonResponse(res, 200, { data: { user, sessionId }, meta: { request_id: "REQ-" + String(Date.now()).slice(-8), timestamp: new Date().toISOString() } });
  }
  if (url.pathname === "/api/v1/auth/logout" && req.method === "POST") {
    const sessionId = readAuthHeader(req);
    if (sessionId && sessions.has(sessionId)) sessions.delete(sessionId);
    return jsonResponse(res, 200, { data: { message: "Sesion cerrada" }, meta: { request_id: "REQ-" + String(Date.now()).slice(-8), timestamp: new Date().toISOString() } });
  }
  if (url.pathname === "/api/v1/auth/me" && req.method === "GET") {
    const state = loadState();
    const actor = resolveActor(state, req);
    return jsonResponse(res, 200, { data: actor, meta: { request_id: "REQ-" + String(Date.now()).slice(-8), timestamp: new Date().toISOString() } });
  }
  return null;
}

function saveUpload(fileName, contentBase64, mimeType) {
  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`Formato de archivo no permitido: ${ext}`);
  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length > MAX_FILE_SIZE) throw new Error(`Archivo excede el tamano maximo de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB`);
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const id = randomBytes(8).toString("hex");
  const storedName = `${id}${ext}`;
  const filePath = join(uploadsDir, storedName);
  writeFileSync(filePath, buffer);
  return { id: storedName, fileName, mimeType: mimeType || "application/octet-stream", storagePath: storedName, sizeKb: Math.ceil(buffer.length / 1024) };
}

function safePath(base, ...segments) {
  const resolved = resolve(base, ...segments);
  if (!resolved.startsWith(resolve(base))) return null;
  return resolved;
}

async function handleApi(req, res, url, body) {
  const method = req.method;
  const pathname = url.pathname;
  const state = loadState();
  const actor = resolveActor(state, req);

  if (pathname === "/api/v1/upload" && method === "POST") {
    if (body._error === "body_too_large") return jsonResponse(res, 413, { error: { code: "file_too_large", message: "El archivo excede el tamano maximo permitido." } });
    if (!body.fileName || !body.content) return jsonResponse(res, 400, { error: { code: "validation_error", message: "fileName y content (base64) requeridos" } });
    try {
      const fileMeta = saveUpload(body.fileName, body.content, body.mimeType || "application/octet-stream");
      fileMeta.originalName = body.fileName;
      return jsonResponse(res, 200, { data: fileMeta, meta: { request_id: "REQ-" + String(Date.now()).slice(-8), timestamp: new Date().toISOString() } });
    } catch (e) {
      return jsonResponse(res, 400, { error: { code: "validation_error", message: e.message } });
    }
  }

  if (pathname.startsWith("/api/v1/uploads/") && method === "GET") {
    const filename = decodeURIComponent(pathname.replace("/api/v1/uploads/", ""));
    const filePath = safePath(uploadsDir, filename);
    if (!filePath || !existsSync(filePath)) return jsonResponse(res, 404, { error: { code: "not_found", message: "Archivo no encontrado" } });
    const ext = extname(filename).toLowerCase();
    const mime = mimeTypes[ext] || "application/octet-stream";
    const inline = url.searchParams.get("inline") === "1";
    const disp = inline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;
    res.writeHead(200, { "content-type": mime, "content-disposition": disp, "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" });
    createReadStream(filePath).on("error", () => { if (!res.headersSent) jsonResponse(res, 500, { error: { code: "io_error", message: "Error al leer archivo" } }); }).pipe(res);
    return;
  }

  if (pathname.startsWith("/api/v1/documents/") && pathname.endsWith("/download") && method === "GET") {
    const docId = pathname.split("/").filter(Boolean).at(-2);
    const filePath = safePath(uploadsDir, docId);
    if (!filePath || !existsSync(filePath)) return jsonResponse(res, 404, { error: { code: "not_found", message: "Documento no encontrado" } });
    const mime = mimeTypes[extname(docId)] || "application/octet-stream";
    res.writeHead(200, { "content-type": mime, "content-disposition": `attachment; filename="${docId}"`, "access-control-allow-origin": "*" });
    createReadStream(filePath).on("error", () => { if (!res.headersSent) jsonResponse(res, 500, { error: { code: "io_error", message: "Error al leer documento" } }); }).pipe(res);
    return;
  }

  if (pathname.startsWith("/api/v1/document-batches/") && pathname.endsWith("/download") && method === "GET") {
    const batchId = pathname.split("/").filter(Boolean).at(-2);
    const batch = state.documentBatches.find((b) => b.id === batchId);
    if (!batch) return jsonResponse(res, 404, { error: { code: "not_found", message: "Lote no encontrado" } });
    if (!batch.files || !batch.files.length) return jsonResponse(res, 200, { data: { files: [] } });
    const first = batch.files[0];
    const fp = safePath(uploadsDir, first.storagePath || first.name);
    if (!fp || !existsSync(fp)) return jsonResponse(res, 404, { error: { code: "not_found", message: "Archivo no encontrado" } });
    const ext = extname(first.name || "");
    const mime = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "content-type": mime, "content-disposition": `attachment; filename="${first.name || "documento"}"`, "access-control-allow-origin": "*" });
    createReadStream(fp).on("error", () => { if (!res.headersSent) jsonResponse(res, 500, { error: { code: "io_error", message: "Error al leer archivo" } }); }).pipe(res);
    return;
  }

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
  const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  let decoded;
  try { decoded = decodeURIComponent(filePath); } catch { return jsonResponse(res, 400, { error: { code: "invalid_url", message: "URL invalida" } }); }
  const candidate = safePath(root, decoded);
  if (!candidate || !existsSync(candidate) || !statSync(candidate).isFile()) {
    const fallback = resolve(root, "index.html");
    if (existsSync(fallback)) { res.writeHead(200, { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" }); createReadStream(fallback).on("error", () => { if (!res.headersSent) res.writeHead(500).end(); }).pipe(res); return; }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": mimeTypes[extname(candidate)] || "application/octet-stream", "cache-control": "no-cache", "access-control-allow-origin": "*" });
  createReadStream(candidate).on("error", () => { if (!res.headersSent) res.writeHead(500).end(); }).pipe(res);
}

createServer(async (req, res) => {
  try {
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
    const body = await readBody(req);
    const authResult = await handleAuth(req, res, url, body);
    if (authResult !== null) return;
    await handleApi(req, res, url, body);
    return;
  }

  handleStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) jsonResponse(res, 500, { error: { code: "internal_error", message: "Error interno del servidor" } });
    console.error("Unhandled error:", e.message);
  }
}).listen(port, () => {
  console.log(`criadero_camila_andrea_url=http://127.0.0.1:${port}`);
  console.log(`data_file=${dataFile}`);
});
