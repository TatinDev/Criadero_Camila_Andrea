import { api } from "../api.mjs";
import { esc, badge, show, money } from "../app.mjs";

export async function renderStays(container) {
  const [stays, horses, clients] = await Promise.all([
    api.get("/boarding-stays"),
    api.get("/horses"),
    api.get("/clients"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Pensiones / Estadias</h2>
      <button class="btn btn-primary btn-sm" id="btn-new">+ Nueva pension</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Caballo</th><th>Cliente</th><th>Inicio</th><th>Salida est.</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${stays.map(s => `<tr>
        <td class="mono">${esc(s.code||s.id)}</td>
        <td>${esc(hName(horses, s.horseId))}</td>
        <td>${esc(cName(clients, s.clientId))}</td>
        <td>${esc(s.startDate||"-")}</td>
        <td>${esc(s.estimatedExitDate||"-")}</td>
        <td>${money(s.monthlyCost)}</td>
        <td>${badge(s.agreementStatus||s.status)}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(s)}'><i class="bi bi-pencil"></i></button>
          ${s.agreementStatus==="active"?`<button class="btn-icon" data-finish='${s.id}'><i class="bi bi-check-lg"></i></button>`:""}
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, horses, clients));
  container.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(container, JSON.parse(b.dataset.edit), horses, clients)));
  container.querySelectorAll("[data-finish]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Finalizar esta pension?")) return;
    await api.post(`/boarding-stays/${b.dataset.finish}/finish`, { actualExitDate: new Date().toISOString().slice(0,10) });
    show("Pension finalizada"); renderStays(container);
  }));
}

function hName(horses, id) { const h = horses.find(x=>x.id===id); return h ? h.name : id; }
function cName(clients, id) { const c = clients.find(x=>x.id===id); return c ? (c.fullName||c.firstName+" "+c.lastName) : id; }

async function showForm(container, edit, horses, clients) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  const boarded = horses.filter(h => h.ownershipType === "boarded");
  overlay.innerHTML = `<div class="modal">
    <h2>${edit ? "Editar" : "Nueva"} pension</h2>
    <form id="frm-stay">
      <div class="form-grid">
        <label>Caballo <select name="horseId" required>
          ${boarded.map(h => `<option value="${h.id}"${v.horseId===h.id?" selected":""}>${esc(h.name)}</option>`).join("")}
        </select></label>
        <label>Cliente <span style="padding:8px 0;color:var(--muted)">(se asigna automaticamente)</span></label>
        <label>Inicio <input name="startDate" type="date" value="${esc(v.startDate||"")}" required></label>
        <label>Salida est. <input name="estimatedExitDate" type="date" value="${esc(v.estimatedExitDate||"")}"></label>
        <label>Tipo <select name="boardingType">${["client_supplies","included_supplies","mixed","other"].map(o => `<option value="${o}"${v.boardingType===o?" selected":""}>${o}</option>`).join("")}</select></label>
        <label>Estado <select name="agreementStatus">${["active","payment_pending","debt","finished","cancelled"].map(o => `<option value="${o}"${v.agreementStatus===o?" selected":""}>${o}</option>`).join("")}</select></label>
        <label>Costo mensual <input name="monthlyCost" type="number" value="${v.monthlyCost||""}" required></label>
        <label>Fardos/mes <input name="hayBalesPerMonth" type="number" value="${v.hayBalesPerMonth||0}"></label>
        <label>Avena/mes <input name="oatsPerMonth" type="number" value="${v.oatsPerMonth||0}"></label>
        <label class="full">Notas <textarea name="careNotes">${esc(v.careNotes||"")}</textarea></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">${edit?"Guardar":"Crear"}</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-stay")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd);
    payload.monthlyCost = Number(payload.monthlyCost) || 0;
    payload.hayBalesPerMonth = Number(payload.hayBalesPerMonth) || 0;
    payload.oatsPerMonth = Number(payload.oatsPerMonth) || 0;
    try {
      if (edit) await api.patch(`/boarding-stays/${edit.id}`, payload);
      else await api.post("/boarding-stays", payload);
      overlay.remove(); show(edit?"Actualizada":"Creada"); renderStays(container);
    } catch(err) { show(err.message||"Error"); }
  });
}
