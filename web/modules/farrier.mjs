import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, dateLocale } from "../components/ui.mjs";

let records = [], horses = [], filterHorse = "", showCancelled = false;

const farrierFields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "serviceDate", label: "Fecha", type: "date", required: true },
  { name: "serviceType", label: "Tipo", type: "select", options: [{ value: "trim", label: "Recorte" }, { value: "shoeing", label: "Herradura" }, { value: "correction", label: "Correccion" }, { value: "other", label: "Otro" }], required: true },
  { name: "performedBy", label: "Realizado por", type: "text", required: true },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

export async function render() {
  const fRes = await api("GET", "/api/v1/farrier-records");
  records = (Array.isArray(fRes) ? fRes : []).sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];

  const filtered = records
    .filter((f) => !filterHorse || f.horseId === filterHorse)
    .filter((f) => showCancelled || f.status !== "cancelled");

  return `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:13px;color:var(--text-2);">Filtrar por caballo:</span>
        <select id="farrier-filter-horse" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Todos los caballos</option>
          ${horses.map((h) => `<option value="${h.id}" ${filterHorse === h.id ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
        </select>
        ${filterHorse ? `<button class="btn ghost small" id="farrier-clear-filter">Limpiar</button>` : ""}
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);">
          <input type="checkbox" id="farrier-show-cancelled" ${showCancelled ? "checked" : ""}> Mostrar anulados
        </label>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h2>Herrajes</h2>
        <button class="btn primary" id="btn-new-farrier">Registrar</button>
      </div>
      <table>
        <thead><tr><th>Caballo</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
        <tbody>${filtered.map((f) => `
          <tr>
            <td>${escapeHtml(horseName(f.horseId))}</td>
            <td>${statusLabel(f.serviceType)}</td>
            <td>${dateLocale(f.serviceDate)}</td>
            <td><span class="status-pill ${statusClass(f.status)}">${statusLabel(f.status)}</span></td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn ghost small" data-edit-farrier="${f.id}">Editar</button>
                ${f.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-farrier="${f.id}">Anular</button>` : ""}
              </div>
            </td>
          </tr>`).join("")}</tbody>
      </table>
      ${filtered.length === 0 ? `<div style="text-align:center;padding:16px;color:var(--text-2);">Sin registros.</div>` : ""}
    </div>
  `;
}

function horseName(id) { return horses.find((h) => h.id === id)?.name || id; }
function horseOpts() { return horses.map((h) => ({ id: h.id, label: h.name })); }

export function bind() {
  document.getElementById("btn-new-farrier")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-farrier]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editFarrier)));
  document.querySelectorAll("[data-cancel-farrier]").forEach((b) => b.addEventListener("click", () => doCancel(b.dataset.cancelFarrier)));
  document.getElementById("farrier-filter-horse")?.addEventListener("change", (e) => { filterHorse = e.target.value; refresh(); });
  document.getElementById("farrier-clear-filter")?.addEventListener("click", () => { filterHorse = ""; refresh(); });
  document.getElementById("farrier-show-cancelled")?.addEventListener("change", (e) => { showCancelled = e.target.checked; refresh(); });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function showCreate() {
  const html = `<form class="form-grid">
    ${formFieldsHtml(farrierFields, { serviceType: "shoeing" }, { horseId: horseOpts() })}
    <label class="full">Documentos (opcional) <input name="documents" type="file" multiple></label>
  </form>`;
  const overlay = modal("Registrar herraje", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    delete payload.documents;
    const fileInput = overlay.querySelector("input[name='documents']");
    const names = [];
    if (fileInput?.files?.length) {
      for (const f of fileInput.files) { const up = await uploadFile(f); if (up && up.fileName) names.push(up.fileName); }
    }
    if (names.length) payload.documents = names.join("\n");
    const res = await api("POST", "/api/v1/farrier-records", payload);
    if (res && !res.error) { toast("Herraje registrado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-clipboard2-plus", "", farrierFields);
}

function showEdit(id) {
  const f = records.find((item) => item.id === id); if (!f) return;
  const html = `<form class="form-grid">
    ${formFieldsHtml(farrierFields, f, { horseId: horseOpts() })}
    <label class="full">Documentos (opcional) <input name="documents" type="file" multiple></label>
  </form>`;
  const overlay = modal("Editar herraje", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    delete payload.documents;
    const fileInput = overlay.querySelector("input[name='documents']");
    const names = [];
    if (fileInput?.files?.length) {
      for (const f of fileInput.files) { const up = await uploadFile(f); if (up && up.fileName) names.push(up.fileName); }
    }
    if (names.length) payload.documents = names.join("\n");
    const res = await api("PATCH", `/api/v1/farrier-records/${id}`, payload);
    if (res && !res.error) { toast("Herraje actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "", farrierFields);
}

async function doCancel(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular herraje", html, async (fd) => {
    const res = await api("POST", `/api/v1/farrier-records/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Herraje anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle", "", [{ name: "reason", label: "Motivo de anulacion", type: "text", required: true }]);
}
