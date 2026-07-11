let token = localStorage.getItem("cca_token") || null;
let serverAvailable = false;

export function getToken() { return token; }
export function setToken(t) { token = t; if (t) localStorage.setItem("cca_token", t); else localStorage.removeItem("cca_token"); }
export function getSession() { return token; }
export function setSession(t) { setToken(t); }
export function isServerOnline() { return serverAvailable; }

export async function checkServer() {
  try {
    const res = await fetch("/healthz");
    serverAvailable = res.ok;
  } catch { serverAvailable = false; }
  return serverAvailable;
}

export async function request(method, path, body = null) {
  if (!serverAvailable) return { error: { code: "offline", message: "Servidor no disponible" } };
  const url = path.startsWith("/") ? path : `/api/v1/${path}`;
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (body && Object.keys(body).length > 0) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const json = await res.json();
  if (res.status === 401) { setToken(null); return { error: { code: "auth", message: "Sesion expirada" } }; }
  return json;
}

export async function api(method, path, body = null) {
  const res = await request(method, path, body);
  if (res.error) return res;
  return res.data;
}

export async function uploadFile(file) {
  const base64 = await new Promise((resolvePromise) => {
    const reader = new FileReader();
    reader.onload = () => resolvePromise(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  const res = await request("POST", "/api/v1/upload", {
    fileName: file.name,
    content: base64,
    mimeType: file.type || "application/octet-stream",
  });
  return res.data || res.error;
}
