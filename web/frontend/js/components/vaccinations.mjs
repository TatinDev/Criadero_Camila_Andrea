import { api } from "../api.mjs";
import { esc, badge, show } from "../app.mjs";

export async function renderVaccinations(container) {
  const [vaccinations, horses] = await Promise.all([
    api.get("/vaccinations"),
    api.get("/horses"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Vacunas</h2>
      <button class="btn btn-primary btn-sm" id="btn-new">+ Registrar vacuna</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Caballo</th><th>Vacuna</th><th>Fecha</th><th>Aplico</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${vaccinations.map(v => `<tr>
        <td>${esc(hName(horses, v.horseId))}</td>
        <td>${esc(v.vaccineName)}</td>
        <td>${esc(v.appliedAt||v.applicationDate)}</td>
        <td>${esc(v.appliedBy)}</td>
        <td>${badge(v.status)}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(v)}'><i class="bi bi-pencil"></i></button>
          ${v.status!=="cancelled"?`<button class="btn-icon" data-cancel='${v.id}'><i class="bi bi-x-circle"></i></button>`:""}
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, horses));
  container.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(container, JSON.parse(b.dataset.edit), horses)));
  container.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Anular esta vacuna?")) return;
    await api.post(`/vaccinations/${b.dataset.cancel}/cancel`, { reason: "Anulado por administrador" });
    show("Vacuna anulada"); renderVaccinations(container);
  }));
}

function hName(horses, id) { const h=horses.find(x=>x.id===id); return h?h.name:id; }

async function showForm(container, edit, horses) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>${edit?"Editar":"Registrar"} vacuna</h2>
    <form id="frm-vaccination">
      <div class="form-grid">
        <label>Caballo <select name="horseId" required>
          ${horses.filter(h=>h.status!=="inactive").map(h => `<option value="${h.id}"${v.horseId===h.id?" selected":""}>${esc(h.name)}</option>`).join("")}
        </select></label>
        <label>Vacuna <input name="vaccineName" value="${esc(v.vaccineName||"")}" required></label>
        <label>Fecha <input name="appliedAt" type="date" value="${esc(v.appliedAt||"")}" required></label>
        <label>Quien aplico <input name="appliedBy" value="${esc(v.appliedBy||"")}" required></label>
        <label class="full">Observaciones <textarea name="observations">${esc(v.observations||"")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${edit?"Guardar":"Registrar"}</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-vaccination")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (edit) await api.patch(`/vaccinations/${edit.id}`, payload);
      else await api.post("/vaccinations", payload);
      overlay.remove(); show(edit?"Actualizada":"Registrada"); renderVaccinations(container);
    } catch(err) { show(err.message||"Error"); }
  });
}
