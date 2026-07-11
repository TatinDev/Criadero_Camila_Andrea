const BASE = "/api/v1";
let token = localStorage.getItem("cca_token") || null;

export function setToken(t) { token = t; if (t) localStorage.setItem("cca_token", t); else localStorage.removeItem("cca_token"); }
export function getToken() { return token; }

async function request(method, path, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json();
  if (json.error) throw json.error;
  return json.data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path) => request("DELETE", path),
  login: (email) => request("POST", "/auth/login", { email }),
  logout: () => request("POST", "/auth/logout"),
  upload: (fileName, content, mimeType) => request("POST", "/upload", { fileName, content, mimeType }),
};
