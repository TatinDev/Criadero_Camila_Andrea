import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money, dateLocale } from "../components/ui.mjs";

let payments = [], stays = [];

const fields = [
  { name: "boardingStayId", label: "Pension", type: "relation", required: true },
  { name: "paymentDate", label: "Fecha pago", type: "date", required: true },
  { name: "paidMonths", label: "Meses pagados", type: "text", required: true },
  { name: "paymentMethod", label: "Medio", type: "select", options: [{ value: "cash", label: "Efectivo" }, { value: "transfer", label: "Transferencia" }], required: true },
  { name: "amount", label: "Monto", type: "money", min: 1, required: true },
  { name: "receiptReference", label: "Comprobante", type: "text" },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

export async function render() {
  const pRes = await api("GET", "/api/v1/boarding-payments");
  payments = Array.isArray(pRes) ? pRes : [];
  const sRes = await api("GET", "/api/v1/boarding-stays");
  stays = Array.isArray(sRes) ? sRes : [];
  return `
    <div class="card">
      <div class="card-header"><h2>Pagos de estadia</h2><button class="btn primary" id="btn-new-payment">Registrar pago</button></div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Pension</th><th>Fecha</th><th>Meses</th><th>Monto</th><th>Medio</th><th>Estado</th><th></th></tr></thead>
          <tbody>${payments.map((p) => {
            const s = stays.find((s) => s.id === p.boardingStayId);
            return `<tr><td><strong>${escapeHtml(s?.code || p.boardingStayId)}</strong></td><td>${dateLocale(p.paymentDate)}</td><td>${escapeHtml(Array.isArray(p.paidMonths) ? p.paidMonths.join(", ") : p.paidMonths)}</td><td>${money(p.amount)}</td><td>${statusLabel(p.paymentMethod)}</td><td><span class="status-pill ${statusClass(p.status)}">${statusLabel(p.status)}</span></td><td><div style="display:flex;gap:6px;"><button class="btn ghost small" data-edit-payment="${p.id}">Editar</button>${p.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-payment="${p.id}">Anular</button>` : ""}</div></td></tr>`;
          }).join("")}</tbody></table></div></div>`;
}

export function bind() {
  document.getElementById("btn-new-payment")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-payment]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editPayment)));
  document.querySelectorAll("[data-cancel-payment]").forEach((b) => b.addEventListener("click", () => cancelPayment(b.dataset.cancelPayment)));
}

async function refresh() { const { render: r, bind: b } = await import("./payments.mjs"); document.getElementById("view-container").innerHTML = await r(); b(); }
function stayOpts() { return stays.map((s) => ({ id: s.id, label: s.code })); }

function showCreate() {
  const html = `<form class="form-grid">${formFieldsHtml(fields, { paymentMethod: "transfer" }, { boardingStayId: stayOpts() })}</form>`;
  modal("Registrar pago", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/boarding-payments", payload);
    if (res && !res.error) { toast("Pago registrado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-cash-coin");
}

function showEdit(id) {
  const p = payments.find((item) => item.id === id); if (!p) return;
  const html = `<form class="form-grid">${formFieldsHtml(fields, p, { boardingStayId: stayOpts() })}</form>`;
  modal("Editar pago", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/boarding-payments/${id}`, payload);
    if (res && !res.error) { toast("Pago actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil");
}

async function cancelPayment(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular pago", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-payments/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Pago anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle");
}
