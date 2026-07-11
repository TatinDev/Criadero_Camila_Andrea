import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, table } from "../components/ui.mjs";

let users = [], invitations = [];

export async function render() {
  const uRes = await api("GET", "/api/v1/users");
  users = Array.isArray(uRes) ? uRes : [];
  const iRes = await api("GET", "/api/v1/admin-invitations");
  invitations = Array.isArray(iRes) ? iRes : [];

  return `
    <div class="split-2">
      <div class="card">
        <div class="card-header"><h2>Administradores</h2></div>
        ${table(["Nombre", "Email", "Rol", "Estado", ""], users.map((u) => [
          `<strong>${escapeHtml(u.name)}</strong>`,
          escapeHtml(u.email),
          statusLabel(u.role),
          `<span class="status-pill ${statusClass(u.status)}">${statusLabel(u.status)}</span>`,
          `<button class="btn ghost small" data-toggle-user="${u.id}">${u.status === "active" ? "Desactivar" : "Activar"}</button>`,
        ]))}
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Invitaciones</h2>
          <button class="btn primary" id="btn-new-invite">Nueva invitacion</button>
        </div>
        ${table(["Email", "Rol", "Estado", ""], invitations.map((inv) => [
          escapeHtml(inv.email),
          statusLabel(inv.role),
          `<span class="status-pill ${statusClass(inv.status)}">${statusLabel(inv.status)}</span>`,
          inv.status === "pending" ? `<button class="btn ghost small" data-revoke="${inv.id}">Revocar</button>` : "",
        ]))}
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-invite")?.addEventListener("click", () => showInviteModal());
  document.querySelectorAll("[data-toggle-user]").forEach((b) => {
    b.addEventListener("click", () => toggleUser(b.dataset.toggleUser));
  });
  document.querySelectorAll("[data-revoke]").forEach((b) => {
    b.addEventListener("click", () => revokeInvite(b.dataset.revoke));
  });
}

async function refresh() {
  const { render: r, bind: b } = await import("./admin.mjs");
  document.getElementById("view-container").innerHTML = await r();
  b();
}

function showInviteModal() {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 1);
  const expiresAt = now.toISOString().slice(0, 10);
  const html = `<form>
    <label class="full">Correo <input name="email" type="email" required></label>
    <label class="full">Expira <input name="expiresAt" type="date" value="${expiresAt}" required></label>
  </form>`;
  modal("Crear invitacion", html, async (fd) => {
    const payload = { email: fd.get("email"), expiresAt: fd.get("expiresAt"), role: "admin" };
    const res = await api("POST", "/api/v1/admin-invitations", payload);
    if (res && !res.error) { toast("Invitacion creada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
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
