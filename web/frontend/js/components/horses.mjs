import { api } from "../api.mjs";
import { esc, badge, show, money } from "../app.mjs";

export async function renderHorses(container) {
  const [horses, clients, statuses] = await Promise.all([
    api.get("/horses?ownership_type=own"),
    api.get("/clients"),
    api.get("/horse-statuses?horse_type=own"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Caballos propios</h2>
      <button class="btn btn-primary btn-sm" id="btn-new">+ Nuevo caballo</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Sexo</th><th>Color</th><th>Estado</th><th>Ubicacion</th><th>Acciones</th></tr></thead>
      <tbody>${horses.map(h => `<tr>
        <td><strong>${esc(h.name)}</strong></td>
        <td>${esc(h.sex)}</td>
        <td>${esc(h.color)}</td>
        <td>${badge(h.status)}</td>
        <td>${esc(h.temporaryLocation||"-")}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(h)}'><i class="bi bi-pencil"></i></button>
          <button class="btn-icon" data-status='${JSON.stringify({id:h.id})}'><i class="bi bi-arrow-repeat"></i></button>
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, clients, statuses));
  container.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(container, JSON.parse(b.dataset.edit), clients, statuses)));
  container.querySelectorAll("[data-status]").forEach(b => b.addEventListener("click", () => showStatus(container, JSON.parse(b.dataset.status).id, statuses)));
}

async function showForm(container, edit, clients, statuses) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>${edit ? "Editar" : "Nuevo"} caballo propio</h2>
    <form id="frm-horse">
      <div class="form-grid">
        <label>Nombre <input name="name" value="${esc(v.name||"")}" required></label>
        <label>Sexo <select name="sex" required>${["hembra","macho","castrado"].map(o => `<option value="${o}"${v.sex===o?" selected":""}>${o}</option>`).join("")}</select></label>
        <label>Color <input name="color" value="${esc(v.color||"")}" required></label>
        <label>Distintivos <input name="distinctiveMarks" value="${esc(v.distinctiveMarks||"")}" required></label>
        <label>Fecha nac. <input name="birthDate" type="date" value="${esc(v.birthDate||"")}"></label>
        <label>Criador <input name="breederName" value="${esc(v.breederName||"")}"></label>
        <label class="full">Ubicacion temporal <input name="temporaryLocation" value="${esc(v.temporaryLocation||"")}" placeholder="Solo para caballos propios"></label>
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
    payload.ownershipType = "own";
    try {
      if (edit) await api.patch(`/horses/${edit.id}`, payload);
      else await api.post("/horses", payload);
      overlay.remove(); show(edit ? "Caballo actualizado" : "Caballo creado");
      renderHorses(container);
    } catch(err) { show(err.message || "Error"); }
  });
}

async function showStatus(container, id, statuses) {
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>Cambiar estado</h2>
    <select id="sel-status" style="margin:8px 0">${statuses.map(s => `<option value="${s.name.toLowerCase()}">${s.name}</option>`).join("")}</select>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-close-modal>Cancelar</button>
      <button class="btn btn-primary" id="btn-change-status">Cambiar</button>
    </div>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#btn-change-status")?.addEventListener("click", async () => {
    const status = overlay.querySelector("#sel-status").value;
    await api.post(`/horses/${id}/change-status`, { status });
    overlay.remove(); show("Estado actualizado"); renderHorses(container);
  });
}
