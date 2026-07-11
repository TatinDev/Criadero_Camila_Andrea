import { api } from "../api.mjs";
import { esc, badge, show, navigate } from "../app.mjs";

export async function renderAdmins(container) {
  try {
    const me = await api.get("/auth/me");
    if (me.role !== "owner") return container.innerHTML = `<div class="empty">Solo el owner puede acceder a esta seccion</div>`;
  } catch { return; }
  const [users, invitations] = await Promise.all([
    api.get("/users"),
    api.get("/admin-invitations"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Administradores</h2><button class="btn btn-primary btn-sm" id="btn-invite">+ Invitar admin</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${users.map(u => `<tr>
        <td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${badge(u.role)}</td><td>${badge(u.status)}</td>
        <td>${u.role==="admin"?`<button class="btn-icon" data-toggle-user='${JSON.stringify({id:u.id,status:u.status})}'><i class="bi bi-${u.status==="active"?"pause":"play"}"></i></button>`:""}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>
  <div class="card">
    <div class="card-header"><h2>Invitaciones</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Correo</th><th>Token</th><th>Estado</th><th>Expira</th><th>Acciones</th></tr></thead>
      <tbody>${invitations.map(i => `<tr>
        <td>${esc(i.email)}</td><td class="mono">${esc(i.token||"").slice(0,20)}...</td><td>${badge(i.status)}</td>
        <td>${esc(i.expiresAt||"-")}</td>
        <td>${i.status==="pending"?`<button class="btn-icon" data-revoke='${i.id}'><i class="bi bi-x-circle"></i></button>`:""}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-invite")?.addEventListener("click", () => showInviteForm(container));
  container.querySelectorAll("[data-toggle-user]").forEach(b => b.addEventListener("click", async () => {
    const {id,status} = JSON.parse(b.dataset.toggleUser);
    await api.post(`/users/${id}/${status==="active"?"deactivate":"activate"}`);
    show("Estado cambiado"); renderAdmins(container);
  }));
  container.querySelectorAll("[data-revoke]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Revocar esta invitacion?")) return;
    await api.post(`/admin-invitations/${b.dataset.revoke}/revoke`);
    show("Invitacion revocada"); renderAdmins(container);
  }));
}

async function showInviteForm(container) {
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>Invitar administrador</h2>
    <form id="frm-invite">
      <label>Correo del invitado <input name="email" type="email" required></label>
      <label>Rol <select name="role"><option value="admin">Admin</option></select></label>
      <label>Expira <input name="expiresAt" type="date" value="${new Date(Date.now()+30*86400000).toISOString().slice(0,10)}" required></label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">Crear invitacion</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-invite")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const inv = await api.post("/admin-invitations", payload);
      overlay.remove();
      show(`Invitacion creada: ${location.origin}/?invite=${inv.token||inv.id}`);
      renderAdmins(container);
    } catch(err) { show(err.message||"Error"); }
  });
}
