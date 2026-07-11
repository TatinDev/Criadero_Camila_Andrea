import { api } from "../api.mjs";
import { esc, badge, show, money } from "../app.mjs";

export async function renderClients(container) {
  const clients = await api.get("/clients");
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Clientes</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-client">+ Nuevo cliente</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Contacto</th><th>Direccion</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${clients.map(c => `<tr>
        <td>${esc(c.fullName||c.firstName+" "+c.lastName)}</td>
        <td>${esc(c.phone)}</td>
        <td>${esc(c.address)}</td>
        <td>${badge(c.status)}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(c)}'><i class="bi bi-pencil"></i></button>
          <button class="btn-icon" data-toggle='${JSON.stringify({id:c.id,status:c.status})}'><i class="bi bi-${c.status==="active"?"pause":"play"}"></i></button>
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  bind(container, clients);
}

function bind(c, clients) {
  c.querySelector("#btn-new-client")?.addEventListener("click", () => showForm(c, null, clients));
  c.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(c, JSON.parse(b.dataset.edit), clients)));
  c.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", async () => {
    const {id, status} = JSON.parse(b.dataset.toggle);
    const action = status === "active" ? "deactivate" : "activate";
    await api.post(`/clients/${id}/${action}`);
    show(`Cliente ${status==="active"?"inactivado":"reactivado"}`);
    renderClients(c);
  }));
}

async function showForm(container, edit, clients) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>${edit ? "Editar" : "Nuevo"} cliente</h2>
    <form id="frm-client">
      <div class="form-grid">
        <label>Nombres <input name="firstName" value="${esc(v.firstName||"")}" required></label>
        <label>Apellidos <input name="lastName" value="${esc(v.lastName||"")}" required></label>
        <label class="full">Direccion <input name="address" value="${esc(v.address||"")}" required></label>
        <label>Contacto <input name="phone" value="${esc(v.phone||"")}" required></label>
        <label>Correo <input name="email" type="email" value="${esc(v.email||"")}"></label>
        <label class="full">Notas <textarea name="internalNotes">${esc(v.internalNotes||"")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${edit ? "Guardar" : "Crear"}</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-client")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd);
    try {
      if (edit) await api.patch(`/clients/${edit.id}`, payload);
      else await api.post("/clients", payload);
      overlay.remove();
      show(edit ? "Cliente actualizado" : "Cliente creado");
      renderClients(container);
    } catch(err) { show(err.message || "Error"); }
  });
}
