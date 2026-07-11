import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, dateLocale } from "../components/ui.mjs";

let vaccinations = [], farrierRecords = [], horses = [], healthFilter = "";

const vaccFields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "vaccineName", label: "Nombre vacuna", type: "text", required: true },
  { name: "applicationDate", label: "Fecha aplicacion", type: "date", required: true },
  { name: "appliedBy", label: "Quien aplico", type: "text", required: true },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

const farrierFields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "serviceDate", label: "Fecha", type: "date", required: true },
  { name: "serviceType", label: "Tipo", type: "select", options: [{ value: "trim", label: "Recorte" }, { value: "shoeing", label: "Herradura" }, { value: "correction", label: "Correccion" }, { value: "other", label: "Otro" }], required: true },
  { name: "performedBy", label: "Realizado por", type: "text", required: true },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

export async function render() {
  const vRes = await api("GET", "/api/v1/vaccinations");
  vaccinations = (Array.isArray(vRes) ? vRes : []).sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
  const fRes = await api("GET", "/api/v1/farrier-records");
  farrierRecords = (Array.isArray(fRes) ? fRes : []).sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];

  const filteredVacc = vaccinations.filter((v) => !healthFilter || v.horseId === healthFilter);
  const filteredFar = farrierRecords.filter((f) => !healthFilter || f.horseId === healthFilter);

  return `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;gap:12px;align-items:center;">
        <span style="font-size:13px;color:var(--text-2);">Filtrar por caballo:</span>
        <select id="health-filter-horse" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Todos los caballos</option>
          ${horses.map((h) => `<option value="${h.id}" ${healthFilter === h.id ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
        </select>
        ${healthFilter ? `<button class="btn ghost small" id="health-clear-filter">Limpiar</button>` : ""}
      </div>
    </div>
    <div class="split-2">
      <div class="card">
        <div class="card-header">
          <h2>Vacunas</h2>
          <button class="btn primary" id="btn-new-vacc">Registrar</button>
        </div>
        <table>
          <thead><tr><th>Caballo</th><th>Vacuna</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${filteredVacc.map((v) => `
            <tr>
              <td>${escapeHtml(horseName(v.horseId))}</td>
              <td>${escapeHtml(v.vaccineName)}</td>
              <td>${dateLocale(v.applicationDate)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-vacc="${v.id}">Editar</button>
                  ${v.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-vacc="${v.id}">Anular</button>` : ""}
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
        ${filteredVacc.length === 0 ? `<div style="text-align:center;padding:16px;color:var(--text-2);">Sin registros.</div>` : ""}
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Herrajes</h2>
          <button class="btn primary" id="btn-new-farrier">Registrar</button>
        </div>
        <table>
          <thead><tr><th>Caballo</th><th>Tipo</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${filteredFar.map((f) => `
            <tr>
              <td>${escapeHtml(horseName(f.horseId))}</td>
              <td>${statusLabel(f.serviceType)}</td>
              <td>${dateLocale(f.serviceDate)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-farrier="${f.id}">Editar</button>
                  ${f.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-farrier="${f.id}">Anular</button>` : ""}
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
        ${filteredFar.length === 0 ? `<div style="text-align:center;padding:16px;color:var(--text-2);">Sin registros.</div>` : ""}
      </div>
    </div>
  `;
}

function horseName(id) { return horses.find((h) => h.id === id)?.name || id; }
function horseOpts() { return horses.map((h) => ({ id: h.id, label: h.name })); }

export function bind() {
  document.getElementById("btn-new-vacc")?.addEventListener("click", () => showCreateVacc());
  document.getElementById("btn-new-farrier")?.addEventListener("click", () => showCreateFarrier());
  document.querySelectorAll("[data-edit-vacc]").forEach((b) => b.addEventListener("click", () => showEditVacc(b.dataset.editVacc)));
  document.querySelectorAll("[data-cancel-vacc]").forEach((b) => b.addEventListener("click", () => cancel("vaccinations", b.dataset.cancelVacc)));
  document.querySelectorAll("[data-edit-farrier]").forEach((b) => b.addEventListener("click", () => showEditFarrier(b.dataset.editFarrier)));
  document.querySelectorAll("[data-cancel-farrier]").forEach((b) => b.addEventListener("click", () => cancel("farrier-records", b.dataset.cancelFarrier)));
  document.getElementById("health-filter-horse")?.addEventListener("change", (e) => { healthFilter = e.target.value; refresh(); });
  document.getElementById("health-clear-filter")?.addEventListener("click", () => { healthFilter = ""; refresh(); });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function showCreateVacc() {
  const html = `<form class="form-grid">
    ${formFieldsHtml(vaccFields, {}, { horseId: horseOpts() })}
    <label class="full">Documentos (opcional) <input name="documents" type="file" multiple></label>
  </form>`;
  const overlay = modal("Registrar vacuna", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    delete payload.documents;
    const fileInput = overlay.querySelector("input[name='documents']");
    const names = [];
    if (fileInput?.files?.length) {
      for (const f of fileInput.files) { const up = await uploadFile(f); if (up && up.fileName) names.push(up.fileName); }
    }
    if (names.length) payload.documents = names.join("\n");
    const res = await api("POST", "/api/v1/vaccinations", payload);
    if (res && !res.error) { toast("Vacuna registrada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-clipboard2-plus", "", vaccFields);
}

function showEditVacc(id) {
  const v = vaccinations.find((item) => item.id === id); if (!v) return;
  const html = `<form class="form-grid">
    ${formFieldsHtml(vaccFields, v, { horseId: horseOpts() })}
    <label class="full">Documentos (opcional) <input name="documents" type="file" multiple></label>
  </form>`;
  const overlay = modal("Editar vacuna", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    delete payload.documents;
    const fileInput = overlay.querySelector("input[name='documents']");
    const names = [];
    if (fileInput?.files?.length) {
      for (const f of fileInput.files) { const up = await uploadFile(f); if (up && up.fileName) names.push(up.fileName); }
    }
    if (names.length) payload.documents = names.join("\n");
    const res = await api("PATCH", `/api/v1/vaccinations/${id}`, payload);
    if (res && !res.error) { toast("Vacuna actualizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "", vaccFields);
}

function showCreateFarrier() {
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

function showEditFarrier(id) {
  const f = farrierRecords.find((item) => item.id === id); if (!f) return;
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

async function cancel(endpoint, id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular registro", html, async (fd) => {
    const res = await api("POST", `/api/v1/${endpoint}/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Registro anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle", "", [{ name: "reason", label: "Motivo de anulacion", type: "text", required: true }]);
}
