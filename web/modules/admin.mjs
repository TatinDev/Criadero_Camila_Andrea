import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml } from "../components/ui.mjs";

let users = [], invitations = [];

export async function render() {
  const uRes = await api("GET", "/api/v1/users");
  users = Array.isArray(uRes) ? uRes : [];
  const iRes = await api("GET", "/api/v1/admin-invitations");
  invitations = Array.isArray(iRes) ? iRes : [];

  const activeUsers = users.filter((u) => u.status === "active");
  const inactiveUsers = users.filter((u) => u.status !== "active");
  const pendingInv = invitations.filter((i) => i.status === "pending");
  const usedInv = invitations.filter((i) => i.status === "accepted");
  const otherInv = invitations.filter((i) => !["pending", "accepted"].includes(i.status));

  return `
    <div class="card" style="margin-bottom:12px;">
      <div class="card-header"><h2>Administradores activos (${activeUsers.length})</h2></div>
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
        <tbody>${activeUsers.map((u) => `
          <tr>
            <td><strong>${escapeHtml(u.firstName + " " + u.lastName)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${statusLabel(u.role)}</td>
            <td><button class="btn ghost small" data-toggle-user="${u.id}">Desactivar</button></td>
          </tr>`).join("")}</tbody>
      </table>
      ${activeUsers.length === 0 ? '<div class="empty">Sin administradores activos</div>' : ''}
    </div>
    ${inactiveUsers.length ? `
    <div class="card" style="margin-bottom:12px;">
      <div class="card-header"><h2>Administradores inactivos (${inactiveUsers.length})</h2></div>
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
        <tbody>${inactiveUsers.map((u) => `
          <tr>
            <td><strong>${escapeHtml(u.firstName + " " + u.lastName)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${statusLabel(u.role)}</td>
            <td><span class="status-pill ${statusClass(u.status)}">${statusLabel(u.status)}</span></td>
            <td><button class="btn ghost small" data-toggle-user="${u.id}">Activar</button></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>` : ''}
    <div class="card">
      <div class="card-header">
        <h2>Invitaciones</h2>
        <button class="btn primary" id="btn-new-invite">Nueva invitacion</button>
      </div>
      ${pendingInv.length ? `
        <h3 style="font-size:14px;margin:8px 0;color:var(--text-2);">Pendientes (${pendingInv.length})</h3>
        <table style="margin-bottom:12px;">
          <thead><tr><th>Email</th><th>Rol</th><th>Codigo</th><th>Expira</th><th></th></tr></thead>
          <tbody>${pendingInv.map((inv) => `
            <tr>
              <td>${escapeHtml(inv.email)}</td>
              <td>${statusLabel(inv.role)}</td>
              <td><code style="font-size:11px;">${escapeHtml(inv.token?.slice(0,16) || inv.code || inv.id)}</code></td>
              <td>${escapeHtml(inv.expiresAt)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-copy-link="${escapeHtml(inv.token || inv.code)}" data-copy-email="${escapeHtml(inv.email)}">Copiar link</button>
                  <button class="btn ghost small" data-revoke="${inv.id}">Revocar</button>
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>` : ''}
      ${usedInv.length ? `
        <h3 style="font-size:14px;margin:8px 0;color:var(--text-2);">Usadas (${usedInv.length})</h3>
        <table style="margin-bottom:12px;">
          <thead><tr><th>Email</th><th>Rol</th><th>Fecha</th></tr></thead>
          <tbody>${usedInv.map((inv) => `
            <tr><td>${escapeHtml(inv.email)}</td><td>${statusLabel(inv.role)}</td><td>${escapeHtml(inv.updatedAt)}</td></tr>`).join("")}</tbody>
        </table>` : ''}
      ${otherInv.length ? `
        <h3 style="font-size:14px;margin:8px 0;color:var(--text-2);">Vencidas/Revocadas (${otherInv.length})</h3>
        <table>
          <thead><tr><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
          <tbody>${otherInv.map((inv) => `
            <tr><td>${escapeHtml(inv.email)}</td><td>${statusLabel(inv.role)}</td><td><span class="status-pill ${statusClass(inv.status)}">${statusLabel(inv.status)}</span></td></tr>`).join("")}</tbody>
        </table>` : ''}
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-invite")?.addEventListener("click", () => showInviteModal());
  document.querySelectorAll("[data-toggle-user]").forEach((b) => b.addEventListener("click", () => toggleUser(b.dataset.toggleUser)));
  document.querySelectorAll("[data-revoke]").forEach((b) => b.addEventListener("click", () => revokeInvite(b.dataset.revoke)));
  document.querySelectorAll("[data-copy-link]").forEach((b) => b.addEventListener("click", () => copyInviteLink(b.dataset.copyLink, b.dataset.copyEmail)));
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function showInviteModal() {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 1);
  const expiresAt = now.toISOString().slice(0, 10);
  const html = `<form class="form-grid">
    <label class="full">Correo <span class="req">*</span> <input name="email" type="email" required></label>
    <label class="full">Rol <span class="req">*</span>
      <select name="role" style="width:100%;padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
        <option value="admin">Administrador</option>
        <option value="owner">Propietario</option>
      </select>
    </label>
    <label class="full">Expira <span class="req">*</span> <input name="expiresAt" type="date" value="${expiresAt}" required></label>
  </form>`;
  modal("Crear invitacion", html, async (fd) => {
    const payload = { email: fd.get("email"), expiresAt: fd.get("expiresAt"), role: fd.get("role") || "admin" };
    const res = await api("POST", "/api/v1/admin-invitations", payload);
    if (res && !res.error) {
      const code = res.token || res.code || res.id;
      const link = `${window.location.origin}?invite=${code}`;
      toast("Invitacion creada: " + link, true);
      refresh();
    } else toast(res?.error?.message || "Error");
  }, "Enviar", "bi-envelope-plus", "", [
    { name: "email", label: "Correo", type: "email", required: true },
    { name: "role", label: "Rol", type: "select", required: true },
    { name: "expiresAt", label: "Expira", type: "date", required: true },
  ]);
}

function copyInviteLink(code, email) {
  const link = `${window.location.origin}?invite=${code}`;
  navigator.clipboard.writeText(link).then(
    () => toast("Link copiado al portapapeles", true),
    () => toast("Link: " + link, true)
  );
}

async function toggleUser(id) {
  const u = users.find((item) => item.id === id);
  if (!u) return;
  const endpoint = u.status === "active" ? "deactivate" : "activate";
  const res = await api("POST", `/api/v1/users/${id}/${endpoint}`);
  if (res && !res.error) { toast("Usuario actualizado", true); refresh(); }
  else toast(res?.error?.message || "Error");
}

async function revokeInvite(id) {
  const res = await api("POST", `/api/v1/admin-invitations/${id}/revoke`);
  if (res && !res.error) { toast("Invitacion revocada", true); refresh(); }
  else toast(res?.error?.message || "Error");
}
