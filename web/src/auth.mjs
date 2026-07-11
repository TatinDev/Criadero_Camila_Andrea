import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "criadero-dev-secret-change-in-production";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || "7d";
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function generateInviteCode() {
  return crypto.randomBytes(16).toString("hex");
}

const ROLE_PERMISSIONS = {
  owner: [
    "horses.manage", "clients.manage", "boarding_stays.manage",
    "boarding_payments.manage", "vaccinations.manage", "farrier_records.manage",
    "documents.manage", "horse_statuses.manage", "audit_logs.read",
    "audit_logs.security.read", "users.manage", "admin_invitations.manage",
    "dashboard.read", "search.read", "system_config.manage",
    "catalogs.manage", "health_treatments.manage", "feed_inventory.manage",
  ],
  admin: [
    "horses.manage", "clients.manage", "boarding_stays.manage",
    "boarding_payments.manage", "vaccinations.manage", "farrier_records.manage",
    "documents.manage", "horse_statuses.manage", "audit_logs.read",
    "dashboard.read", "search.read", "health_treatments.manage",
  ],
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !hasPermission(user.role, permission)) {
      res.writeHead(403, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: { code: "permission_denied", message: "Permiso denegado." } }));
      return;
    }
    next();
  };
}

export function authMiddleware(req, res) {
  return new Promise((resolve) => {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      resolve(null);
      return;
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      resolve(null);
      return;
    }
    req.user = payload;
    resolve(payload);
  });
}
