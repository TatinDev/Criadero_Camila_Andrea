import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money, dateLocale } from "../components/ui.mjs";

let stays = [], horses = [], clients = [];

const fields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "startDate", label: "Fecha inicio", type: "date", required: true },
  { name: "estimatedExitDate", label: "Salida estimada", type: "date" },
  { name: "boardingType", label: "Tipo pension", type: "select", options: [{ value: "client_supplies", label: "Insumos cliente" }, { value: "included_supplies", label: "Insumos criadero" }, { value: "mixed", label: "Mixta" }, { value: "other", label: "Otro" }], required: true },
  { name: "agreementStatus", label: "Estado acuerdo", type: "select", options: ["active", "payment_pending", "debt", "finished", "cancelled"], required: true },
  { name: "monthlyCost", label: "Costo pension", type: "money", min: 0, required: true },
  { name: "hayBalesPerMonth", label: "Fardos/mes", type: "number", min: 0 },
  { name: "oatsPerMonth", label: "Avena/mes", type: "number", min: 0 },
  { name: "otherSupplies", label: "Otros insumos", type: "textarea", full: true },
  { name: "careNotes", label: "Notas de cuidado", type: "textarea", full: true },
];

export async function render() {
  const sRes = await api("GET", "/api/v1/boarding-stays");
  stays = Array.isArray(sRes) ? sRes : [];
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];
  const cRes = await api("GET", "/api/v1/clients");
  clients = Array.isArray(cRes) ? cRes : [];

  return `
    <div class="card">
      <div class="card-header">
        <h2>Pensiones / Estadias</h2>
        <button class="btn primary" id="btn-new-stay">Nueva pension</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Codigo</th><th>Caballo</th><th>Inicio</th><th>Costo</th><th>Estado</th><th></th></tr></thead>
          <tbody>${stays.map((s) => {
            const h = horses.find((h) => h.id === s.horseId);
            return `
            <tr>
              <td><strong>${escapeHtml(s.code)}</strong></td>
              <td>${escapeHtml(h?.name || s.horseId)}</td>
              <td>${dateLocale(s.startDate)}</td>
              <td>${money(s.monthlyCost)}</td>
              <td><span class="status-pill ${statusClass(s.agreementStatus)}">${statusLabel(s.agreementStatus)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-stay="${s.id}">Editar</button>
                  ${s.agreementStatus === "active" ? `<button class="btn ghost small" data-finish-stay="${s.id}">Finalizar</button>` : ""}
                  ${s.agreementStatus !== "cancelled" ? `<button class="btn ghost small" data-cancel-stay="${s.id}">Anular</button>` : ""}
                </div>
              </td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-stay")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-stay]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editStay)));
  document.querySelectorAll("[data-finish-stay]").forEach((b) => b.addEventListener("click", () => finishStay(b.dataset.finishStay)));
  document.querySelectorAll("[data-cancel-stay]").forEach((b) => b.addEventListener("click", () => cancelStay(b.dataset.cancelStay)));
}

async function refresh() {
  const { render: r, bind: b } = await import("./boarding.mjs");
  document.getElementById("view-container").innerHTML = await r();
  b();
}

function horseOpts() {
  return horses.filter((h) => h.ownershipType === "boarded").map((h) => ({ id: h.id, label: h.name }));
}

function showCreate() {
  const html = `<form>${formFieldsHtml(fields, { boardingType: "mixed", agreementStatus: "active", monthlyCost: 0 }, { horseId: horseOpts() })}</form>`;
  modal("Nueva pension", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/boarding-stays", payload);
    if (res && !res.error) { toast("Pension creada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}

function showEdit(id) {
  const s = stays.find((item) => item.id === id);
  if (!s) return;
  const html = `<form>${formFieldsHtml(fields, s, { horseId: horseOpts() })}</form>`;
  modal("Editar pension", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/boarding-stays/${id}`, payload);
    if (res && !res.error) { toast("Pension actualizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}

async function finishStay(id) {
  const html = `<form><label class="full">Fecha salida real <input name="actualExitDate" type="date" required></label></form>`;
  modal("Finalizar pension", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-stays/${id}/finish`, { actualExitDate: fd.get("actualExitDate") });
    if (res && !res.error) { toast("Pension finalizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}

async function cancelStay(id) {
  const html = `<form><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular pension", html, async (fd) => {
    const res = await api("POST", `/api/v1/boarding-stays/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Pension anulada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}
