import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money, dateLocale } from "../components/ui.mjs";

let stays = [], horses = [], clients = [], boardingFilter = "", boardingTypes = [], agreementStatuses = [];

const fields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "clientId", label: "Cliente dueño", type: "relation", required: true },
  { name: "startDate", label: "Fecha inicio", type: "date", required: true },
  { name: "estimatedExitDate", label: "Salida estimada", type: "date" },
  { name: "boardingType", label: "Tipo pension", type: "select", options: [], required: true },
  { name: "agreementStatus", label: "Estado acuerdo", type: "select", options: [], required: true },
  { name: "boardingCost", label: "Costo pension", type: "money", min: 0, required: true },
  { name: "hayBalesPerMonth", label: "Fardos/mes", type: "number", min: 0 },
  { name: "oatsPerMonth", label: "Avena/mes", type: "number", min: 0 },
  { name: "otherSupplies", label: "Otros insumos", type: "textarea", full: true },
  { name: "careNotes", label: "Notas de cuidado", type: "textarea", full: true },
];

function boardingTypeLabel(v) {
  const map = { client_supplies: "Insumos cliente", included_supplies: "Insumos criadero", mixed: "Mixta", other: "Otro" };
  return map[v] || v || "-";
}

export async function render() {
  const sRes = await api("GET", "/api/v1/boarding-stays");
  stays = Array.isArray(sRes) ? sRes : [];
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];
  const cRes = await api("GET", "/api/v1/clients");
  clients = Array.isArray(cRes) ? cRes : [];

  const btRes = await api("GET", "/api/v1/catalogs/boarding-types");
  boardingTypes = Array.isArray(btRes) ? btRes : [];
  fields.find((f) => f.name === "boardingType").options = boardingTypes.map((bt) => ({ value: bt.code || bt.name, label: bt.name || bt.code }));

  const asRes = await api("GET", "/api/v1/catalogs/agreement-statuses");
  agreementStatuses = Array.isArray(asRes) ? asRes : [];
  fields.find((f) => f.name === "agreementStatus").options = agreementStatuses.map((as) => ({ value: as.code || as.name, label: as.name || as.code }));

  const filtered = stays
    .filter((s) => !boardingFilter || s.horseId === boardingFilter)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return `
    <div class="card">
      <div class="card-header">
        <h2>Pensiones / Estadias</h2>
        <button class="btn primary" id="btn-new-stay">Nueva pension</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <select id="boarding-filter-horse" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Todos los caballos</option>
          ${horses.filter((h) => h.ownershipType === "boarded").map((h) => `<option value="${h.id}" ${boardingFilter === h.id ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
        </select>
        ${boardingFilter ? `<button class="btn ghost small" id="boarding-clear-filter">Limpiar</button>` : ""}
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Codigo</th><th>Caballo</th><th>Cliente</th><th>Inicio</th><th>Salida est.</th><th>Tipo</th><th>Costo</th><th>Fardos</th><th>Avena</th><th>Estado</th><th></th></tr></thead>
          <tbody>${filtered.map((s) => {
            const h = horses.find((h) => h.id === s.horseId);
            const cl = clients.find((c) => c.id === s.clientId);
            return `
            <tr>
              <td><strong>${escapeHtml(s.code)}</strong></td>
              <td>${escapeHtml(h?.name || s.horseId)}</td>
              <td>${escapeHtml(cl ? `${cl.firstName} ${cl.lastName}` : (s.clientId || "-"))}</td>
              <td>${dateLocale(s.startDate)}</td>
              <td>${s.estimatedExitDate ? dateLocale(s.estimatedExitDate) : "-"}</td>
              <td>${boardingTypeLabel(s.boardingType)}</td>
              <td>${money(s.boardingCost)}</td>
              <td>${s.hayBalesPerMonth ?? "-"}</td>
              <td>${s.oatsPerMonth ?? "-"}</td>
              <td><span class="status-pill ${statusClass(s.agreementStatus)}">${statusLabel(s.agreementStatus)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-stay="${s.id}">Editar</button>
                  ${s.agreementStatus === "active" || s.agreementStatus === "payment_pending" ? `<button class="btn ghost small" data-finish-stay="${s.id}">Finalizar</button>` : ""}
                  ${s.agreementStatus !== "cancelled" ? `<button class="btn ghost small" data-cancel-stay="${s.id}">Anular</button>` : ""}
                </div>
              </td>
            </tr>`;
          }).join("")}</tbody>
        </table>
        ${filtered.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--text-2);">Sin pensiones registradas.</div>` : ""}
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-stay")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-stay]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editStay)));
  document.querySelectorAll("[data-finish-stay]").forEach((b) => b.addEventListener("click", () => finishStay(b.dataset.finishStay)));
  document.querySelectorAll("[data-cancel-stay]").forEach((b) => b.addEventListener("click", () => cancelStay(b.dataset.cancelStay)));
  document.getElementById("boarding-filter-horse")?.addEventListener("change", (e) => { boardingFilter = e.target.value; refresh(); });
  document.getElementById("boarding-clear-filter")?.addEventListener("click", () => { boardingFilter = ""; refresh(); });
  setupBoardingTypeToggle();
}

function setupBoardingTypeToggle() {
  const sel = document.querySelector('select[name="boardingType"]');
  const desc = document.getElementById("boarding-other-desc");
  if (sel && desc) {
    sel.addEventListener("change", (e) => { desc.style.display = e.target.value === "other" ? "block" : "none"; });
    desc.style.display = sel.value === "other" ? "block" : "none";
  }
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function horseOpts() {
  return horses.filter((h) => h.ownershipType === "boarded").map((h) => ({ id: h.id, label: h.name }));
}

function clientOpts() {
  return clients.filter((c) => c.status === "active").map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
}

function showCreate() {
  const html = `<form class="form-grid">
    ${formFieldsHtml(fields, { boardingType: "mixed", agreementStatus: "active", monthlyCost: 0 }, { horseId: horseOpts(), clientId: clientOpts() })}
    <div id="boarding-other-desc" style="display:none;grid-column:1/-1;">
      <label>Descripcion del tipo "Otro" <input name="otherDescription" type="text" placeholder="Describa el tipo de pension"></label>
    </div>
  </form>`;
  modal("Nueva pension", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/boarding-stays", payload);
    if (res && !res.error) { toast("Pension creada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Crear", "bi-house-add", "wide", fields);

  setupBoardingTypeToggle();
}

function showEdit(id) {
  const s = stays.find((item) => item.id === id);
  if (!s) return;
  const html = `<form class="form-grid">
    ${formFieldsHtml(fields, s, { horseId: horseOpts(), clientId: clientOpts() })}
    <div id="boarding-other-desc" style="display:${s.boardingType === "other" ? "block" : "none"};grid-column:1/-1;">
      <label>Descripcion del tipo "Otro" <input name="otherDescription" type="text" value="${escapeHtml(s.otherDescription || "")}"></label>
    </div>
  </form>`;
  modal("Editar pension", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/boarding-stays/${id}`, payload);
    if (res && !res.error) { toast("Pension actualizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "wide", fields);

  setupBoardingTypeToggle();
}

async function finishStay(id) {
  const s = stays.find((item) => item.id === id);
  const payRes = await api("GET", `/api/v1/boarding-payments?boarding_stay_id=${id}`);
  const payments = Array.isArray(payRes) ? payRes : [];
  const stayPayments = payments.filter((p) => p.boardingStayId === id && p.status === "valid");
  const totalPaid = stayPayments.reduce((sum, p) => sum + (p.amount || p.amountPaid || 0), 0);
  const warned = totalPaid < (s?.boardingCost || 0);
  const html = `<form class="form-grid">
    <label class="full">Fecha salida real <input name="actualExitDate" type="date" required></label>
    ${warned ? `<p style="color:var(--warning);grid-column:1/-1;">ATENCION: El costo de la pension es ${money(s.boardingCost)} y solo se ha pagado ${money(totalPaid)}. Puede existir deuda pendiente.</p>` : ""}
  </form>`;
  modal("Finalizar pension", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-stays/${id}/finish`, { actualExitDate: fd.get("actualExitDate") });
    if (res && !res.error) { toast("Pension finalizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Finalizar", "bi-check-circle", "", [{ name: "actualExitDate", label: "Fecha salida real", type: "date", required: true }]);
}

async function cancelStay(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular pension", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-stays/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Pension anulada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle", "", [{ name: "reason", label: "Motivo de anulacion", type: "text", required: true }]);
}
