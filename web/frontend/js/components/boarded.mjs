import { api } from "../api.mjs";
import { esc, badge, show } from "../app.mjs";

export async function renderBoarded(container) {
  const [horses, clients] = await Promise.all([
    api.get("/horses?ownership_type=boarded"),
    api.get("/clients"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Caballos pensionados</h2>
      <button class="btn btn-primary btn-sm" id="btn-new">+ Nuevo pensionado</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Sexo</th><th>Color</th><th>Dueño</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${horses.map(h => `<tr>
        <td><strong>${esc(h.name)}</strong></td>
        <td>${esc(h.sex)}</td>
        <td>${esc(h.color)}</td>
        <td>${esc(clientName(clients, h.clientId))}</td>
        <td>${badge(h.status)}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(h)}'><i class="bi bi-pencil"></i></button>
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, clients, horses));
  container.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(container, JSON.parse(b.dataset.edit), clients, horses)));
}

function clientName(clients, id) {
  const c = clients.find(x => x.id === id);
  return c ? c.fullName || c.firstName + " " + c.lastName : id;
}

async function showForm(container, edit, clients, horses) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>${edit ? "Editar" : "Nuevo"} caballo pensionado</h2>
    <form id="frm-horse">
      <div class="form-grid">
        <label>Nombre <input name="name" value="${esc(v.name||"")}" required></label>
        <label>Sexo <select name="sex">${["hembra","macho","castrado"].map(o => `<option${v.sex===o?" selected":""}>${o}</option>`).join("")}</select></label>
        <label>Color <input name="color" value="${esc(v.color||"")}" required></label>
        <label>Distintivos <input name="distinctiveMarks" value="${esc(v.distinctiveMarks||"")}" required></label>
        <label class="full">Dueño <select name="clientId" required>
          <option value="">Seleccionar cliente</option>
          ${clients.filter(c=>c.status==="active").map(c => `<option value="${c.id}"${v.clientId===c.id?" selected":""}>${esc(c.fullName||c.firstName+" "+c.lastName)}</option>`).join("")}
        </select></label>
        <label class="full">Notas <textarea name="notes">${esc(v.notes||"")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${edit ? "Guardar" : "Crear"}</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-horse")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd);
    payload.ownershipType = "boarded";
    try {
      if (edit) await api.patch(`/horses/${edit.id}`, payload);
      else await api.post("/horses", payload);
      overlay.remove(); show(edit ? "Actualizado" : "Creado");
      renderBoarded(container);
    } catch(err) { show(err.message || "Error"); }
  });
}
