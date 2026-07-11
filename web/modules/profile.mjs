import { api, request, setToken } from "../api.mjs";
import { escapeHtml, toast } from "../components/ui.mjs";
import { getCurrentUser , setCurrentView } from "../app.mjs";

export async function render() {
  const me = await api("GET", "/api/v1/auth/me");
  const u = me && !me.error ? me : getCurrentUser ();
  if (!u) return `<div class="card"><p style="text-align:center;padding:24px;">No se pudo cargar el perfil.</p></div>`;
  return `
    <div class="card">
      <div class="card-header"><h2>Mi perfil</h2></div>
      <div style="max-width:400px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="width:72px;height:72px;border-radius:50%;background:var(--brand);color:white;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;margin:0 auto 8px;">${escapeHtml(((u.firstName?.[0] || "") + (u.lastName?.[0] || "")).toUpperCase() || "U")}</div>
          <h3>${escapeHtml(u.firstName || "")} ${escapeHtml(u.lastName || "")}</h3>
          <p style="color:var(--text-2);font-size:14px;">${escapeHtml(u.email || "")} · ${escapeHtml(u.role || "")}</p>
        </div>
        <form id="profile-form" class="form-grid">
          <label class="full">Nombre <input name="firstName" value="${escapeHtml(u.firstName || "")}"></label>
          <label class="full">Apellido <input name="lastName" value="${escapeHtml(u.lastName || "")}"></label>
          <div class="full" style="display:flex;gap:8px;">
            <button class="btn primary" type="submit">Guardar cambios</button>
          </div>
        </form>
        <hr style="margin:20px 0;border:none;border-top:1px solid var(--border);">
        <h4 style="margin-bottom:12px;">Cambiar contrasena</h4>
        <form id="password-form" class="form-grid">
          <label class="full">Contrasena actual <input name="currentPassword" type="password" required></label>
          <label class="full">Nueva contrasena <input name="newPassword" type="password" required minlength="6"></label>
          <label class="full">Confirmar <input name="confirmPassword" type="password" required minlength="6"></label>
          <div class="full" style="display:flex;gap:8px;">
            <button class="btn primary" type="submit">Cambiar contrasena</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = { firstName: fd.get("firstName"), lastName: fd.get("lastName") };
    const me = await api("GET", "/api/v1/auth/me");
    const uid = (me && !me.error) ? me.id : getCurrentUser ()?.id;
    if (!uid) { toast("Error: no se pudo identificar al usuario"); return; }
    const res = await request("PATCH", `/api/v1/users/${uid}`, payload);
    if (res && !res.error) { toast("Perfil actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error al actualizar");
  });
  document.getElementById("password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = fd.get("newPassword");
    const confirm = fd.get("confirmPassword");
    if (pw !== confirm) { toast("Las contrasenas no coinciden"); return; }
    const res = await request("POST", "/api/v1/auth/change-password", { currentPassword: fd.get("currentPassword"), newPassword: pw });
    if (res && !res.error) { toast("Contrasena cambiada. Inicie sesion de nuevo.", true); setToken(null); window.location.reload(); }
    else toast(res?.error?.message || "Error al cambiar contrasena");
  });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }
