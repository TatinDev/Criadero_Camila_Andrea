import { appendFileSync, createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { PrismaApi } from "./src/prisma-api.mjs";
import { getPrisma, disconnectPrisma } from "./src/db.mjs";
import { authMiddleware, comparePassword, generateToken, generateRefreshToken } from "./src/auth.mjs";

const root = resolve(".");
const port = Number(process.env.PORT || 4177);
const uploadsDir = process.env.UPLOADS_DIR || resolve(root, "uploads");
const logDir = process.env.LOG_DIR || resolve(root, "logs");
const corsOrigin = process.env.CORS_ORIGIN || "*";
const errorLog = [];
const MAX_ERROR_LOGS = 100;
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now - entry.resetAt > LOGIN_WINDOW_MS) loginAttempts.delete(ip);
  }
}, LOGIN_WINDOW_MS);

if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });

function logError(method, pathname, userId, message, stack) {
  const entry = {
    timestamp: new Date().toISOString(),
    method: method || "?",
    path: pathname || "?",
    userId: userId || "anon",
    message: message.slice(0, 500),
    stack: (stack || "").slice(0, 1000),
  };
  errorLog.unshift(entry);
  if (errorLog.length > MAX_ERROR_LOGS) errorLog.length = MAX_ERROR_LOGS;
  try {
    appendFileSync(join(logDir, "errors.jsonl"), JSON.stringify(entry) + "\n");
  } catch {}
  console.error(`[ERROR] ${entry.timestamp} ${entry.method} ${entry.path} | ${entry.message.split("\n")[0]}`);
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".pdf": "application/pdf",
};

const MAX_BODY = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".svg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"]);

const pathRx = {
  login: /^\/api\/v1\/auth\/login$/,
  logout: /^\/api\/v1\/auth\/logout$/,
  refresh: /^\/api\/v1\/auth\/refresh$/,
  passwordRecovery: /^\/api\/v1\/auth\/password-recovery$/,
  passwordReset: /^\/api\/v1\/auth\/password-reset$/,
  changePassword: /^\/api\/v1\/auth\/change-password$/,
  me: /^\/api\/v1\/auth\/me$/,

  catalogs: /^\/api\/v1\/catalogs\/(.+)$/,
  clients: /^\/api\/v1\/clients$/,
  clientById: /^\/api\/v1\/clients\/([^/]+)$/,
  clientAction: /^\/api\/v1\/clients\/([^/]+)\/([\w-]+)$/,
  horses: /^\/api\/v1\/horses$/,
  horseById: /^\/api\/v1\/horses\/([^/]+)$/,
  horseAction: /^\/api\/v1\/horses\/([^/]+)\/([\w-]+)$/,
  horseGallery: /^\/api\/v1\/horses\/([^/]+)\/gallery$/,
  horseGalleryItem: /^\/api\/v1\/horses\/([^/]+)\/gallery\/([^/]+)$/,
  horseGenealogy: /^\/api\/v1\/horses\/([^/]+)\/genealogy$/,
  horseGenealogyTree: /^\/api\/v1\/horses\/([^/]+)\/genealogy-tree$/,

  boardingStays: /^\/api\/v1\/boarding-stays$/,
  boardingStayById: /^\/api\/v1\/boarding-stays\/([^/]+)$/,
  boardingStayAction: /^\/api\/v1\/boarding-stays\/([^/]+)\/([\w-]+)$/,
  boardingStaySupplies: /^\/api\/v1\/boarding-stays\/([^/]+)\/supplies$/,
  boardingStaySupplyById: /^\/api\/v1\/boarding-stays\/([^/]+)\/supplies\/([^/]+)$/,

  payments: /^\/api\/v1\/boarding-payments$/,
  paymentById: /^\/api\/v1\/boarding-payments\/([^/]+)$/,
  paymentAction: /^\/api\/v1\/boarding-payments\/([^/]+)\/([\w-]+)$/,

  vaccinations: /^\/api\/v1\/vaccinations$/,
  vaccinationById: /^\/api\/v1\/vaccinations\/([^/]+)$/,
  vaccinationAction: /^\/api\/v1\/vaccinations\/([^/]+)\/([\w-]+)$/,

  farrierRecords: /^\/api\/v1\/farrier-records$/,
  farrierRecordById: /^\/api\/v1\/farrier-records\/([^/]+)$/,
  farrierRecordAction: /^\/api\/v1\/farrier-records\/([^/]+)\/([\w-]+)$/,

  healthTreatments: /^\/api\/v1\/health-treatments$/,
  healthTreatmentById: /^\/api\/v1\/health-treatments\/([^/]+)$/,
  healthTreatmentAction: /^\/api\/v1\/health-treatments\/([^/]+)\/([\w-]+)$/,

  documentBatches: /^\/api\/v1\/document-batches$/,
  documentBatchById: /^\/api\/v1\/document-batches\/([^/]+)$/,
  documentBatchAction: /^\/api\/v1\/document-batches\/([^/]+)\/([\w-]+)$/,
  documentDownload: /^\/api\/v1\/documents\/([^/]+)\/download$/,
  batchDownload: /^\/api\/v1\/document-batches\/([^/]+)\/download$/,

  users: /^\/api\/v1\/users$/,
  userById: /^\/api\/v1\/users\/([^/]+)$/,
  userAction: /^\/api\/v1\/users\/([^/]+)\/([\w-]+)$/,
  invitations: /^\/api\/v1\/admin-invitations$/,
  invitationAction: /^\/api\/v1\/admin-invitations\/([^/]+)\/([\w-]+)$/,
  invitationAccept: /^\/api\/v1\/admin-invitations\/([^/]+)\/accept$/,

  horseStatuses: /^\/api\/v1\/horse-statuses$/,
  search: /^\/api\/v1\/search$/,
  dashboard: /^\/api\/v1\/dashboard\/summary$/,
  auditLogs: /^\/api\/v1\/audit-logs$/,
  feedInventory: /^\/api\/v1\/feed-inventory$/,
  notifications: /^\/api\/v1\/notifications$/,
  systemConfig: /^\/api\/v1\/system-config$/,
  upload: /^\/api\/v1\/upload$/,
  uploads: /^\/api\/v1\/uploads\/(.+)$/,
  errorLogs: /^\/api\/v1\/logs\/errors$/,
  healthz: /^\/healthz$/,
};

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
  });
  res.end(JSON.stringify(body));
}

function ok(res, data) {
  json(res, 200, { data, meta: { timestamp: new Date().toISOString() } });
}

function err(res, status, code, message) {
  json(res, status, { error: { code, message } });
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => { size += chunk.length; if (size > MAX_BODY) { req.destroy(); return resolve({ _error: "too_large" }); } chunks.push(chunk); });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function getQuery(url) {
  const q = {};
  url.searchParams.forEach((v, k) => { q[k] = v; });
  return q;
}

function safePath(...segments) {
  const resolved = resolve(...segments);
  if (!resolved.startsWith(resolve(uploadsDir))) return null;
  return resolved;
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

const PERM_MAP = {
  "POST /api/v1/admin-invitations": "admin_invitations.manage",
  "GET /api/v1/admin-invitations": "admin_invitations.manage",
  "POST /api/v1/admin-invitations/*/revoke": "admin_invitations.manage",
  "GET /api/v1/users": "users.manage",
  "PATCH /api/v1/users/*": "users.manage",
  "POST /api/v1/users/*/activate": "users.manage",
  "POST /api/v1/users/*/deactivate": "users.manage",
  "GET /api/v1/system-config": "system_config.manage",
  "PATCH /api/v1/system-config": "system_config.manage",
  "GET /api/v1/catalogs/*": "catalogs.manage",
  "POST /api/v1/catalogs/*": "catalogs.manage",
  "PATCH /api/v1/catalogs/*": "catalogs.manage",
  "GET /api/v1/feed-inventory": "feed_inventory.manage",
  "POST /api/v1/feed-inventory": "feed_inventory.manage",
  "GET /api/v1/notifications": "dashboard.read",
};

function checkPerm(user, method, pathname) {
  const key = `${method} ${pathname}`;
  for (const [pattern, perm] of Object.entries(PERM_MAP)) {
    const parts = pattern.split("*");
    const escaped = parts.map((p) => p.replace(/[.+?^${}()|[\]\\\/]/g, "\\$&")).join("[^/]+");
    const regex = new RegExp("^" + escaped + "$");
    if (regex.test(key)) {
      if (perm === "admin_invitations.manage" || perm === "users.manage" || perm === "system_config.manage" || perm === "catalogs.manage") {
        return user.role === "owner";
      }
      return true;
    }
  }
  return true;
}

function okResponse(res, data) {
  json(res, 200, { data, meta: { timestamp: new Date().toISOString() } });
}

function errResponse(res, status, code, message) {
  json(res, status, { error: { code, message } });
}

async function start() {
  const db = getPrisma();
  const api = new PrismaApi(db);
  let nextStayCode = 1;

  createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const method = req.method;
      const pathname = url.pathname;
      const query = getQuery(url);

      if (method === "OPTIONS") return json(res, 204, {});

      if (pathRx.healthz.test(pathname)) return json(res, 200, { status: "ok", timestamp: new Date().toISOString() });

      if (pathRx.uploads.test(pathname)) {
        const fp = decodeURIComponent(pathname.split("/api/v1/uploads/")[1]);
        const filePath = safePath(uploadsDir, fp);
        if (!filePath || !existsSync(filePath)) return errResponse(res, 404, "not_found", "Archivo no encontrado");
        const ext = extname(fp).toLowerCase();
        const mime = MIME[ext] || "application/octet-stream";
        const inline = url.searchParams.get("inline") === "1";
        const disp = inline ? `inline; filename="${fp}"` : `attachment; filename="${fp}"`;
        res.writeHead(200, { "content-type": mime, "content-disposition": disp, "access-control-allow-origin": corsOrigin });
        createReadStream(filePath).on("error", () => { if (!res.headersSent) errResponse(res, 500, "io_error", "Error al leer archivo"); }).pipe(res);
        return;
        return;
      }

      if (pathname.startsWith("/api/v1")) {
        const body = method === "GET" ? query : await readBody(req);
        await authMiddleware(req, res);

        if (pathRx.login.test(pathname) && method === "POST") {
          const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
          const now = Date.now();
          const entry = loginAttempts.get(ip);
          if (entry && now < entry.resetAt && entry.count >= MAX_LOGIN_ATTEMPTS) {
            return errResponse(res, 429, "rate_limited", "Demasiados intentos. Espere 15 minutos.");
          }
          const r = await api.auth().login(body);
          if (r.error) {
            if (!entry || now >= entry.resetAt) { loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS }); }
            else { entry.count++; }
            return errResponse(res, 401, r.error.code, r.error.message);
          }
          if (entry) loginAttempts.delete(ip);
          return okResponse(res, r);
        }
        if (pathRx.refresh.test(pathname) && method === "POST") {
          const r = await api.auth().refreshToken(body.refreshToken);
          return r.error ? errResponse(res, 401, r.error.code, r.error.message) : okResponse(res, r);
        }
        if (pathRx.passwordRecovery.test(pathname) && method === "POST") {
          const r = await api.auth().passwordRecovery(body);
          return okResponse(res, r);
        }
        if (pathRx.passwordReset.test(pathname) && method === "POST") {
          const r = await api.auth().passwordReset(body);
          return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r);
        }

        const user = req.user;
        if (!user) {
          if (pathRx.invitationAccept.test(pathname) && method === "POST") {
            const token = pathname.split("/").at(-2);
            const r = await api.acceptInvitation(token, body);
            return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r);
          }
          if (pathname.startsWith("/api/v1/auth/")) return errResponse(res, 401, "auth_failed", "Autenticacion requerida");
          return errResponse(res, 401, "auth_failed", "Autenticacion requerida");
        }

        if (!checkPerm(user, method, pathname)) return errResponse(res, 403, "permission_denied", "Permiso denegado");

        if (pathRx.logout.test(pathname) && method === "POST") { const r = await api.auth().logout(user.userId); return okResponse(res, r); }
        if (pathRx.me.test(pathname) && method === "GET") { const r = await api.auth().me(user.userId); return r.error ? errResponse(res, 404, r.error.code, r.error.message) : okResponse(res, r); }
        if (pathRx.changePassword.test(pathname) && method === "POST") { const r = await api.auth().changePassword(user.userId, body); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }

        if (pathRx.catalogs.test(pathname)) {
          const rest = pathname.split("/catalogs/")[1];
          if (method === "GET") { const r = await api.getCatalog(rest); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createCatalogEntry(rest, body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
          if (method === "PATCH") {
            const parts = rest.split("/");
            const catName = parts[0];
            const entryId = parts.slice(1).join("/");
            const r = await api.updateCatalogEntry(catName, entryId, body, user);
            return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r);
          }
        }

        if (pathRx.dashboard.test(pathname) && method === "GET") { const r = await api.dashboard(); return okResponse(res, r); }
        if (pathRx.search.test(pathname) && method === "GET") { const r = await api.search(query.q, query.type); return okResponse(res, r); }
        if (pathRx.auditLogs.test(pathname) && method === "GET") { const r = await api.listAuditLogs(query); return okResponse(res, r); }

        if (pathRx.upload.test(pathname) && method === "POST") {
          if (!body.fileName || !body.content) return errResponse(res, 400, "validation_error", "fileName y content (base64) requeridos");
          try {
            const fileMeta = saveUpload(body.fileName, body.content, body.mimeType || "application/octet-stream");
            fileMeta.originalName = body.fileName;
            return okResponse(res, fileMeta);
          } catch (e) {
            return errResponse(res, 400, "validation_error", e.message);
          }
        }

        if (pathRx.clients.test(pathname)) {
          if (method === "GET") { const r = await api.listClients(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createClient(body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.clientAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/clients\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "deactivate") { const r = await api.deactivateClient(m[1], user); return okResponse(res, r); }
          if (method === "POST" && m[2] === "reactivate") { const r = await api.updateClient(m[1], { status: "active" }, user); return okResponse(res, r); }
        }

        if (pathRx.clientById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/clients\/([^/]+)$/);
          if (method === "GET") { const r = await api.getClient(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Cliente no encontrado"); }
          if (method === "PATCH") { const r = await api.updateClient(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
          if (method === "DELETE") { const r = await api.deactivateClient(m[1], user); return okResponse(res, r); }
        }

        if (pathRx.horses.test(pathname)) {
          if (method === "GET") { const r = await api.listHorses(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createHorse(body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.horseAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "change-status") { const r = await api.changeHorseStatus(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.horseById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)$/);
          if (method === "GET") { const r = await api.getHorse(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Caballo no encontrado"); }
          if (method === "PATCH") { const r = await api.updateHorse(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
          if (method === "DELETE") { const r = await api.deleteHorse(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.horseGallery.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)\/gallery$/);
          if (method === "GET") { const h = await api.getHorse(m[1]); return okResponse(res, h?.gallery || []); }
          if (method === "POST") { const r = await api.addHorseGallery(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.horseGalleryItem.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)\/gallery\/([^/]+)$/);
          if (method === "DELETE") { const r = await api.removeHorseGallery(m[1], m[2], user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.horseGenealogy.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)\/genealogy$/);
          if (method === "GET") { const h = await api.getHorse(m[1]); return okResponse(res, h?.genealogy || null); }
          if (method === "PATCH") { const r = await api.updateGenealogy(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.horseGenealogyTree.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/horses\/([^/]+)\/genealogy-tree$/);
          if (method === "GET") { const r = await api.getGenealogyTree(m[1]); return okResponse(res, r); }
        }

        if (pathRx.boardingStays.test(pathname)) {
          if (method === "GET") { const r = await api.listBoardingStays(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createBoardingStay(body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.boardingStayAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-stays\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "finish") { const r = await api.finishBoardingStay(m[1], body, user); return okResponse(res, r); }
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelBoardingStay(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.boardingStayById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-stays\/([^/]+)$/);
          if (method === "GET") { const r = await api.getBoardingStay(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Pension no encontrada"); }
          if (method === "PATCH") { const r = await api.updateBoardingStay(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.boardingStaySupplies.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-stays\/([^/]+)\/supplies$/);
          if (method === "GET") { const s = await api.getBoardingStay(m[1]); return okResponse(res, s?.supplies || []); }
          if (method === "POST") { const r = await api.addBoardingSupply(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.boardingStaySupplyById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-stays\/([^/]+)\/supplies\/([^/]+)$/);
          if (method === "PATCH") { const r = await api.updateBoardingSupply(m[2], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
          if (method === "DELETE") { const r = await api.removeBoardingSupply(m[2], user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.payments.test(pathname)) {
          if (method === "GET") { const r = await api.listPayments(query); return okResponse(res, r); }
          if (method === "POST") {
            try {
              const r = await api.createPayment(body, user);
              return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r);
            } catch (e) { return errResponse(res, 400, "payment_error", e.message); }
          }
        }

        if (pathRx.paymentAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-payments\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelPayment(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.paymentById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/boarding-payments\/([^/]+)$/);
          if (method === "GET") { const r = await api.getPayment(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Pago no encontrado"); }
          if (method === "PATCH") { const r = await api.updatePayment(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.vaccinations.test(pathname)) {
          if (method === "GET") { const r = await api.listVaccinations(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createVaccination(body, user); return okResponse(res, r); }
        }

        if (pathRx.vaccinationAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/vaccinations\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelVaccination(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.vaccinationById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/vaccinations\/([^/]+)$/);
          if (method === "GET") { const r = await api.getVaccination(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Vacuna no encontrada"); }
          if (method === "PATCH") { const r = await api.updateVaccination(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.farrierRecords.test(pathname)) {
          if (method === "GET") { const r = await api.listFarrierRecords(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createFarrierRecord(body, user); return okResponse(res, r); }
        }

        if (pathRx.farrierRecordAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/farrier-records\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelFarrierRecord(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.farrierRecordById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/farrier-records\/([^/]+)$/);
          if (method === "GET") { const r = await api.getFarrierRecord(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Herraje no encontrado"); }
          if (method === "PATCH") { const r = await api.updateFarrierRecord(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.healthTreatments.test(pathname)) {
          if (method === "GET") { const r = await api.listHealthTreatments(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createHealthTreatment(body, user); return okResponse(res, r); }
        }

        if (pathRx.healthTreatmentById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/health-treatments\/([^/]+)$/);
          if (method === "GET") { const r = await api.getHealthTreatment(m[1]); return r ? okResponse(res, r) : errResponse(res, 404, "not_found", "Tratamiento no encontrado"); }
          if (method === "PATCH") { const r = await api.updateHealthTreatment(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.healthTreatmentAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/health-treatments\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelHealthTreatment(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.documentBatches.test(pathname)) {
          if (method === "GET") { const r = await api.listDocumentBatches(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createDocumentBatch(body, user); return okResponse(res, r); }
        }

        if (pathRx.documentBatchAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/document-batches\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "cancel") { const r = await api.cancelDocumentBatch(m[1], body, user); return okResponse(res, r); }
        }

        if (pathRx.documentBatchById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/document-batches\/([^/]+)$/);
          if (method === "GET") { const r = await api.getDocumentBatch(m[1]); return r ? okResponse(res, { ...r, files: r.documents }) : errResponse(res, 404, "not_found", "Lote no encontrado"); }
          if (method === "PATCH") { const r = await api.updateDocumentBatch(m[1], body, user); return r.error ? errResponse(res, 400, r.error.code, r.error.message) : okResponse(res, r); }
        }

        if (pathRx.documentDownload.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/documents\/([^/]+)\/download$/);
          const doc = await api.db.document.findUnique({ where: { id: m[1] } });
          if (!doc || !doc.storagePath) return errResponse(res, 404, "not_found", "Documento no encontrado");
          const fp = safePath(uploadsDir, doc.storagePath);
          if (!fp || !existsSync(fp)) return errResponse(res, 404, "not_found", "Archivo no encontrado");
          const ext = extname(doc.storagePath).toLowerCase();
          const mimeType = MIME[ext] || "application/octet-stream";
          res.writeHead(200, { "content-type": mimeType, "content-disposition": `attachment; filename="${doc.fileName || doc.displayName || doc.storagePath}"`, "access-control-allow-origin": corsOrigin });
          createReadStream(fp).on("error", () => { if (!res.headersSent) errResponse(res, 500, "io_error", "Error al leer archivo"); }).pipe(res);
          return;
        }

        if (pathRx.batchDownload.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/document-batches\/([^/]+)\/download$/);
          const batch = await api.getDocumentBatch(m[1]);
          if (!batch) return errResponse(res, 404, "not_found", "Lote no encontrado");
          const files = (batch.documents || []).map((d) => ({
            id: d.id, name: d.displayName || d.fileName, mime: d.mimeType,
            downloadUrl: `/api/v1/uploads/${encodeURIComponent(d.storagePath)}`,
          }));
          return okResponse(res, { batchId: m[1], name: batch.name, files });
        }

        if (pathRx.users.test(pathname)) {
          if (method === "GET") { const r = await api.listUsers(); return okResponse(res, r); }
        }

        if (pathRx.userAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/users\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "activate") { const r = await api.toggleUser(m[1], "active", user); return okResponse(res, r); }
          if (method === "POST" && m[2] === "deactivate") { const r = await api.toggleUser(m[1], "inactive", user); return okResponse(res, r); }
        }

        if (pathRx.userById.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/users\/([^/]+)$/);
          if (method === "PATCH") {
            if (m[1] !== user.userId) return errResponse(res, 403, "permission_denied", "Solo puedes editar tu propio perfil.");
            const r = await api.updateUser(m[1], { firstName: body.firstName, lastName: body.lastName });
            return okResponse(res, r);
          }
        }

        if (pathRx.invitations.test(pathname)) {
          if (method === "GET") { const r = await api.listInvitations(); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createInvitation(body, user); return okResponse(res, r); }
        }

        if (pathRx.invitationAction.test(pathname)) {
          const m = pathname.match(/\/api\/v1\/admin-invitations\/([^/]+)\/([\w-]+)$/);
          if (method === "POST" && m[2] === "revoke") { const r = await api.revokeInvitation(m[1], user); return okResponse(res, r); }
        }

        if (pathRx.horseStatuses.test(pathname)) {
          if (method === "GET") { const r = await api.listHorseStatuses(query); return okResponse(res, r); }
          if (method === "POST") { const r = await api.createHorseStatus(body, user); return okResponse(res, r); }
        }

        if (pathRx.feedInventory.test(pathname)) {
          if (method === "GET") { const r = await api.listFeedInventory(); return okResponse(res, r); }
          if (method === "POST") { const r = await api.addFeedEntry(body, user); return okResponse(res, r); }
        }

        if (pathRx.notifications.test(pathname)) {
          if (method === "GET") { const r = await api.listNotifications(query); return okResponse(res, r); }
        }

        if (pathRx.systemConfig.test(pathname)) {
          if (method === "GET") { const r = await api.getSystemConfig(); return okResponse(res, r); }
          if (method === "PATCH") {
            const results = [];
            for (const [k, v] of Object.entries(body)) { const r = await api.updateSystemConfig(k, String(v), user); results.push(r); }
            return okResponse(res, results);
          }
        }

        if (pathRx.errorLogs.test(pathname) && method === "GET") {
          if (user.role !== "owner") return errResponse(res, 403, "permission_denied", "Solo owner puede ver logs");
          return okResponse(res, errorLog);
        }

        return errResponse(res, 404, "not_found", "Endpoint no encontrado");
      }

      const filePath = pathname === "/" ? "/index.html" : pathname;
      let decoded;
      try { decoded = decodeURIComponent(filePath); } catch { return errResponse(res, 400, "invalid_url", "URL invalida"); }
      const candidate = resolve(root, decoded.startsWith("/") ? decoded.slice(1) : decoded);
      if (!candidate.startsWith(resolve(root))) return errResponse(res, 403, "forbidden", "Acceso denegado");
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        res.writeHead(200, { "content-type": MIME[extname(candidate)] || "application/octet-stream", "cache-control": "no-cache", "access-control-allow-origin": corsOrigin });
        createReadStream(candidate).on("error", () => { if (!res.headersSent) res.writeHead(500).end(); }).pipe(res);
        return;
      }
      const fallback = resolve(root, "index.html");
      if (existsSync(fallback)) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": corsOrigin });
        createReadStream(fallback).on("error", () => { if (!res.headersSent) res.writeHead(500).end(); }).pipe(res);
        return;
      }
      errResponse(res, 404, "not_found", "No encontrado");
    } catch (e) {
      const m = (typeof method !== "undefined" ? method : req?.method) || "?";
      const p = (typeof pathname !== "undefined" ? pathname : req?.url) || "?";
      const userId = req.user?.userId || "anon";
      logError(m, p, userId, e.message, e.stack);
      if (!res.headersSent) errResponse(res, 500, "internal_error", "Error interno del servidor");
    }
  }).listen(port, () => {
    console.log(`criadero_camila_andrea_url=http://127.0.0.1:${port}`);
    console.log(`mode=prisma+jwt`);
  });
}

process.on("SIGTERM", async () => { await disconnectPrisma(); process.exit(0); });
process.on("SIGINT", async () => { await disconnectPrisma(); process.exit(0); });

start().catch((e) => { console.error("Failed to start:", e); process.exit(1); });
