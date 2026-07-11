import { api } from "../api.mjs";
import { esc, badge, show, money } from "../app.mjs";

export async function renderPayments(container) {
  const [payments, stays, horses] = await Promise.all([
    api.get("/boarding-payments"),
    api.get("/boarding-stays"),
    api.get("/horses"),
  ]);
  container.innerHTML = `<div class="card">
    <div class="card-header">
      <h2>Pagos de estadia</h2>
      <button class="btn btn-primary btn-sm" id="btn-new">+ Registrar pago</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Pension</th><th>Caballo</th><th>Fecha</th><th>Meses</th><th>Monto</th><th>Medio</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${payments.map(p => `<tr>
        <td class="mono">${esc(p.boardingStayId)}</td>
        <td>${esc(hName(horses, p.horseId))}</td>
        <td>${esc(p.paymentDate)}</td>
        <td>${Array.isArray(p.paidMonths)?p.paidMonths.join(", "):p.paidMonths||"-"}</td>
        <td>${money(p.amount)}</td>
        <td>${esc(p.paymentMethod)}</td>
        <td>${badge(p.status)}</td>
        <td>
          <button class="btn-icon" data-edit='${JSON.stringify(p)}'><i class="bi bi-pencil"></i></button>
          ${p.status!=="cancelled"?`<button class="btn-icon" data-cancel='${p.id}'><i class="bi bi-x-circle"></i></button>`:""}
        </td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container, null, stays, horses));
  container.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => showForm(container, JSON.parse(b.dataset.edit), stays, horses)));
  container.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Anular este pago?")) return;
    await api.post(`/boarding-payments/${b.dataset.cancel}/cancel`, { reason: "Anulado por administrador" });
    show("Pago anulado"); renderPayments(container);
  }));
}

function hName(horses, id) { const h=horses.find(x=>x.id===id); return h?h.name:id; }

async function showForm(container, edit, stays, horses) {
  const v = edit || {};
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>${edit?"Editar":"Registrar"} pago</h2>
    <form id="frm-payment">
      <div class="form-grid">
        <label>Pension <select name="boardingStayId" required>
          ${stays.map(s => `<option value="${s.id}"${v.boardingStayId===s.id?" selected":""}>${esc(s.code||s.id)} - ${esc(hName(horses,s.horseId))}</option>`).join("")}
        </select></label>
        <label>Fecha <input name="paymentDate" type="date" value="${esc(v.paymentDate||"")}" required></label>
        <label>Meses pagados <input name="paidMonths" value="${Array.isArray(v.paidMonths)?v.paidMonths.join(", "):v.paidMonths||""}" placeholder="2026-06, 2026-07" required></label>
        <label>Medio <select name="paymentMethod">${["cash","transfer"].map(o => `<option value="${o}"${v.paymentMethod===o?" selected":""}>${o==="cash"?"Efectivo":"Transferencia"}</option>`).join("")}</select></label>
        <label>Monto <input name="amount" type="number" value="${v.amount||""}" required></label>
        <label>Comprobante <input name="receiptReference" value="${esc(v.receiptReference||"")}"></label>
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
  overlay.querySelector("#frm-payment")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    payload.amount = Number(payload.amount) || 0;
    try {
      if (edit) await api.patch(`/boarding-payments/${edit.id}`, payload);
      else await api.post("/boarding-payments", payload);
      overlay.remove(); show(edit?"Actualizado":"Pagado"); renderPayments(container);
    } catch(err) { show(err.message||"Error"); }
  });
}
