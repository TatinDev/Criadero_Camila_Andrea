import { api } from "../api.mjs";
import { esc, badge, show } from "../app.mjs";

export async function renderFarrier(container) {
  const [records, horses] = await Promise.all([api.get("/farrier-records"), api.get("/horses")]);
  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Herrajes</h2><button class="btn btn-primary btn-sm" id="btn-new">+ Registrar herraje</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Caballo</th><th>Fecha</th><th>Servicio</th><th>Herrador</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${records.map(r => `<tr>
        <td>${esc(hName(horses,r.horseId))}</td><td>${esc(r.serviceDate)}</td>
        <td>${esc(r.serviceType||r.description)}</td><td>${esc(r.performedBy)}</td>
        <td>${badge(r.status)}</td>
        <td>${r.status!=="cancelled"?`<button class="btn-icon" data-cancel='${r.id}'><i class="bi bi-x-circle"></i></button>`:""}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, horses));
  container.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Anular este herraje?")) return;
    await api.post(`/farrier-records/${b.dataset.cancel}/cancel`, { reason: "Anulado por administrador" });
    show("Herraje anulado"); renderFarrier(container);
  }));
}
function hName(horses, id) { const h=horses.find(x=>x.id===id); return h?h.name:id; }
async function showForm(container, edit, horses) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>Registrar herraje</h2>
    <form id="frm-farrier">
      <div class="form-grid">
        <label>Caballo <select name="horseId" required>${horses.filter(h=>h.status!=="inactive").map(h => `<option value="${h.id}"${v.horseId===h.id?" selected":""}>${esc(h.name)}</option>`).join("")}</select></label>
        <label>Fecha <input name="serviceDate" type="date" required></label>
        <label>Tipo <select name="serviceType">${["trim","shoeing","correction","other"].map(o => `<option value="${o}">${o}</option>`).join("")}</select></label>
        <label>Herrador <input name="performedBy" required></label>
        <label class="full">Observaciones <textarea name="observations"></textarea></label>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button><button type="submit" class="btn btn-primary">Registrar</button></div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-farrier")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api.post("/farrier-records", Object.fromEntries(new FormData(e.currentTarget))); overlay.remove(); show("Herraje registrado"); renderFarrier(container); }
    catch(err) { show(err.message||"Error"); }
  });
}
