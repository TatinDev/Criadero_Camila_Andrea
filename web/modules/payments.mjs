import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money, dateLocale } from "../components/ui.mjs";

let payments = [], stays = [], paymentMethods = [], filters = { stayId: "", status: "all" };

const formFields = [
  { name: "boardingStayId", label: "Pension", type: "relation", required: true },
  { name: "paymentDate", label: "Fecha pago", type: "date", required: true },
  { name: "paymentMethod", label: "Medio", type: "select", options: [], required: true },
  { name: "amount", label: "Monto pagado", type: "money", min: 0, required: true },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ANIOS = ["2025", "2026", "2027", "2028"];

function monthGridHtml(selectedMonths = []) {
  const sel = new Set(Array.isArray(selectedMonths) ? selectedMonths : (selectedMonths || []));
  const currentYear = new Date().getFullYear().toString();
  let html = '<div class="full">';
  html += `<label style="font-weight:600;font-size:13px;color:var(--text-2);display:flex;align-items:center;gap:10px;margin-bottom:12px;">Meses pagados <select id="year-select" style="width:auto;min-width:90px;padding:6px 10px;border:1.5px solid var(--border-2);border-radius:8px;background:var(--surface-2);font-size:13px;font-weight:600;">`;
  for (const a of ANIOS) html += `<option value="${a}" ${a === currentYear ? "selected" : ""}>${a}</option>`;
  html += '</select></label>';
  for (const anio of ANIOS) {
    html += `<div id="months-${anio}" class="month-grid" style="display:${anio === currentYear ? "grid" : "none"};grid-template-columns:repeat(4,1fr);gap:6px;">`;
    for (let m = 0; m < 12; m++) {
      const monthKey = `${anio}-${String(m + 1).padStart(2, "0")}`;
      const checked = sel.has(monthKey) ? "checked" : "";
      html += `<label class="month-label${checked ? " checked" : ""}">
        <input type="checkbox" name="month-${monthKey}" value="${monthKey}" ${checked}>
        ${MESES[m]}
      </label>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function collectMonths(formEl) {
  const months = [];
  formEl.querySelectorAll("input[type=checkbox]:checked").forEach((cb) => months.push(cb.value));
  return months;
}

export async function render() {
  const pRes = await api("GET", "/api/v1/boarding-payments");
  payments = Array.isArray(pRes) ? pRes : [];
  const sRes = await api("GET", "/api/v1/boarding-stays");
  stays = Array.isArray(sRes) ? sRes : [];

  const pmRes = await api("GET", "/api/v1/catalogs/payment-methods");
  paymentMethods = Array.isArray(pmRes) ? pmRes : [];
  formFields.find((f) => f.name === "paymentMethod").options = paymentMethods.map((pm) => ({ value: pm.code || pm.name, label: pm.name || pm.code }));

  const filtered = payments
    .filter((p) => !filters.stayId || p.boardingStayId === filters.stayId)
    .filter((p) => filters.status === "all" || p.status === filters.status)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  return `
    <div class="card">
      <div class="card-header"><h2>Pagos de estadia</h2><button class="btn primary" id="btn-new-payment">Registrar pago</button></div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <select id="payment-filter-stay" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Todas las pensiones</option>
          ${stays.map((s) => `<option value="${s.id}" ${filters.stayId === s.id ? "selected" : ""}>${escapeHtml(s.code)}</option>`).join("")}
        </select>
        <select id="payment-filter-status" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="all" ${filters.status === "all" ? "selected" : ""}>Todos estados</option>
          <option value="valid" ${filters.status === "valid" ? "selected" : ""}>Valido</option>
          <option value="cancelled" ${filters.status === "cancelled" ? "selected" : ""}>Anulado</option>
        </select>
        ${(filters.stayId || filters.status !== "all") ? `<button class="btn ghost small" id="payment-clear-filters">Limpiar</button>` : ""}
      </div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Pension</th><th>Fecha</th><th>Meses</th><th>Monto</th><th>Medio</th><th>Estado</th><th></th></tr></thead>
          <tbody>${filtered.map((p) => {
            const s = stays.find((s) => s.id === p.boardingStayId);
            return `<tr><td><strong>${escapeHtml(s?.code || p.boardingStayId)}</strong></td><td>${dateLocale(p.paymentDate)}</td><td>${escapeHtml(Array.isArray(p.paidMonths) ? p.paidMonths.join(", ") : p.paidMonths)}</td><td>${money(p.amount ?? p.amountPaid)}</td><td>${statusLabel(p.paymentMethod)}</td><td><span class="status-pill ${statusClass(p.status)}">${statusLabel(p.status)}</span></td><td><div style="display:flex;gap:6px;"><button class="btn ghost small" data-edit-payment="${p.id}">Editar</button>${p.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-payment="${p.id}">Anular</button>` : ""}</div></td></tr>`;
          }).join("")}</tbody></table>
        ${filtered.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--text-2);">Sin pagos registrados.</div>` : ""}
      </div></div>`;
}

export function bind() {
  document.getElementById("btn-new-payment")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-payment]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editPayment)));
  document.querySelectorAll("[data-cancel-payment]").forEach((b) => b.addEventListener("click", () => cancelPayment(b.dataset.cancelPayment)));
  document.getElementById("payment-filter-stay")?.addEventListener("change", (e) => { filters.stayId = e.target.value; refresh(); });
  document.getElementById("payment-filter-status")?.addEventListener("change", (e) => { filters.status = e.target.value; refresh(); });
  document.getElementById("payment-clear-filters")?.addEventListener("click", () => { filters = { stayId: "", status: "all" }; refresh(); });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }
function stayOpts() { return stays.map((s) => ({ id: s.id, label: s.code })); }

function showCreate() {
  const html = `
    <form class="form-grid">${formFieldsHtml(formFields, { paymentMethod: "transfer" }, { boardingStayId: stayOpts() })}
      <div id="suggested-cost" style="grid-column:1/-1;font-size:13px;color:var(--text-2);padding:8px 12px;background:var(--surface-2);border-radius:8px;display:none;"></div>
      <label class="full">Comprobante (foto o documento) <input name="receiptFile" type="file" accept="image/*,application/pdf"></label>
      ${monthGridHtml()}
    </form>`;
  const overlay = modal("Registrar pago", html, async (fd) => {
    const form = overlay.querySelector("form");
    const payload = Object.fromEntries(fd.entries());
    delete payload.receiptFile;
    const months = collectMonths(form);
    if (!months.length) { toast("Debe seleccionar al menos un mes pagado"); return; }
    payload.paidMonths = months;
    const existPayments = payments.filter((p) => p.boardingStayId === payload.boardingStayId && p.status === "valid");
    const dup = existPayments.flatMap((p) => p.paidMonths || []).filter((m) => months.includes(m));
    if (dup.length) { toast(`Meses ya pagados en esta pension: ${dup.join(", ")}. No se puede duplicar.`); return; }
    const fileInput = form.querySelector('input[name="receiptFile"]');
    if (fileInput?.files?.length) {
      const up = await uploadFile(fileInput.files[0]);
      if (up && up.storagePath) payload.receiptReference = `${up.storagePath}::${up.originalName || fileInput.files[0].name}::${up.mimeType || "application/octet-stream"}`;
    }
    const res = await api("POST", "/api/v1/boarding-payments", payload);
    if (res && !res.error) { toast("Pago registrado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-cash-coin", "wide", formFields);
  setupYearToggle();
  setupCostSuggestion();
}

function parseReceipt(ref) {
  if (!ref) return null;
  const parts = ref.split("::");
  if (parts.length >= 3) return { path: parts[0], name: parts[1], mime: parts[2] };
  return ref.startsWith("TRX-") ? null : { path: ref, name: ref, mime: "application/octet-stream" };
}

function receiptHtml(ref) {
  const r = parseReceipt(ref);
  if (!r) return "";
  const dlUrl = `/api/v1/uploads/${encodeURIComponent(r.path)}`;
  const isImg = r.mime?.startsWith("image/");
  return `<div class="full" style="font-size:13px;padding:8px 12px;background:var(--surface-2);border-radius:8px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:${isImg ? "8px" : "0"};">
      <i class="bi bi-file-earmark"></i> <strong>Comprobante:</strong> ${escapeHtml(r.name)}
      <a href="${dlUrl}" target="_blank" class="btn ghost small" style="margin-left:auto;">Descargar</a>
    </div>
    ${isImg ? `<img src="${dlUrl}?inline=1" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid var(--border);" alt="Comprobante" onerror="this.style.display='none'">` : ""}
  </div>`;
}

function showEdit(id) {
  const p = payments.find((item) => item.id === id); if (!p) return;
  const hasReceipt = !!parseReceipt(p.receiptReference);
  const html = `
    <form class="form-grid">${formFieldsHtml(formFields, p, { boardingStayId: stayOpts() })}
      <div id="suggested-cost" style="grid-column:1/-1;font-size:13px;color:var(--text-2);padding:8px 12px;background:var(--surface-2);border-radius:8px;display:none;"></div>
      ${receiptHtml(p.receiptReference)}
      <label class="full">${hasReceipt ? "Reemplazar comprobante (opcional)" : "Comprobante (foto o documento)"} <input name="receiptFile" type="file" accept="image/*,application/pdf"></label>
      ${monthGridHtml(p.paidMonths)}
    </form>`;
  const overlay = modal("Editar pago", html, async (fd) => {
    const form = overlay.querySelector("form");
    const payload = Object.fromEntries(fd.entries());
    delete payload.receiptFile;
    const months = collectMonths(form);
    if (!months.length) { toast("Debe seleccionar al menos un mes pagado"); return; }
    payload.paidMonths = months;
    const existPayments = payments.filter((pm) => pm.boardingStayId === payload.boardingStayId && pm.status === "valid" && pm.id !== id);
    const dup = existPayments.flatMap((pm) => pm.paidMonths || []).filter((m) => months.includes(m));
    if (dup.length) { toast(`Meses ya pagados en esta pension: ${dup.join(", ")}. No se puede duplicar.`); return; }
    const fileInput = form.querySelector('input[name="receiptFile"]');
    if (fileInput?.files?.length) {
      const up = await uploadFile(fileInput.files[0]);
      if (up && up.storagePath) payload.receiptReference = `${up.storagePath}::${up.originalName || fileInput.files[0].name}::${up.mimeType || "application/octet-stream"}`;
    }
    const res = await api("PATCH", `/api/v1/boarding-payments/${id}`, payload);
    if (res && !res.error) { toast("Pago actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "wide", formFields);
  setupYearToggle();
  setupCostSuggestion();
}

async function cancelPayment(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular pago", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-payments/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Pago anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle", "", [{ name: "reason", label: "Motivo de anulacion", type: "text", required: true }]);
}

function setupYearToggle() {
  const sel = document.getElementById("year-select");
  if (!sel) return;
  sel.addEventListener("change", () => {
    document.querySelectorAll(".month-grid").forEach((g) => g.style.display = "none");
    const target = document.getElementById(`months-${sel.value}`);
    if (target) target.style.display = "grid";
  });
}

function setupCostSuggestion() {
  const sel = document.querySelector('select[name="boardingStayId"]');
  const div = document.getElementById("suggested-cost");
  const amountInput = document.querySelector('input[name="amount"]');
  if (!sel || !div) return;
  const update = () => {
    const s = stays.find((s) => s.id === sel.value);
    if (s && s.boardingCost) {
      div.style.display = "block";
      div.innerHTML = `<strong>Costo sugerido de la pension:</strong> ${money(s.boardingCost)} / mes — Estado: ${statusLabel(s.agreementStatus)}`;
      if (amountInput && !amountInput.value) amountInput.value = s.boardingCost;
    } else {
      div.style.display = "none";
    }
  };
  sel.addEventListener("change", update);
  update();
}
