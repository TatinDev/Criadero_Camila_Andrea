import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, dateLocale } from "../components/ui.mjs";

let vaccinations = [], horses = [], filterHorse = "", showCancelled = false;

const vaccFields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "vaccineName", label: "Nombre vacuna", type: "text", required: true },
  { name: "applicationDate", label: "Fecha aplicacion", type: "date", required: true },
  { name: "appliedBy", label: "Quien aplico", type: "text", required: true },
  { name: "observations", label: "Observaciones", type: "textarea", full: true },
];

export async function render() {
  const vRes = await api("GET", "/api/v1/vaccinations");
  vaccinations = (Array.isArray(vRes) ? vRes : []).sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];

  const filtered = vaccinations
    .filter((v) => !filterHorse || v.horseId === filterHorse)
    .filter((v) => showCancelled || v.status !== "cancelled");

  return `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:13px;color:var(--text-2);">Filtrar por caballo:</span>
        <select id="vacc-filter-horse" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Todos los caballos</option>
          ${horses.map((h) => `<option value="${h.id}" ${filterHorse === h.id ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
        </select>
        ${filterHorse ? `<button class="btn ghost small" id="vacc-clear-filter">Limpiar</button>` : ""}
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);">
          <input type="checkbox" id="vacc-show-cancelled" ${showCancelled ? "checked" : ""}> Mostrar anulados
        </label>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h2>Vacunas</h2>
        <button class="btn primary" id="btn-new-vacc">Registrar</button>
      </div>
      <table>
        <thead><tr><th>Caballo</th><th>Vacuna</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
        <tbody>${filtered.map((v) => `
          <tr>
            <td>${escapeHtml(horseName(v.horseId))}</td>
            <td>${escapeHtml(v.vaccineName)}</td>
            <td>${dateLocale(v.applicationDate)}</td>
            <td><span class="status-pill ${statusClass(v.status)}">${statusLabel(v.status)}</span></td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn ghost small" data-edit-vacc="${v.id}">Editar</button>
                ${v.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-vacc="${v.id}">Anular</button>` : ""}
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
  document.getElementById("btn-new-vacc")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-vacc]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editVacc)));
  document.querySelectorAll("[data-cancel-vacc]").forEach((b) => b.addEventListener("click", () => doCancel(b.dataset.cancelVacc)));
  document.getElementById("vacc-filter-horse")?.addEventListener("change", (e) => { filterHorse = e.target.value; refresh(); });
  document.getElementById("vacc-clear-filter")?.addEventListener("click", () => { filterHorse = ""; refresh(); });
  document.getElementById("vacc-show-cancelled")?.addEventListener("change", (e) => { showCancelled = e.target.checked; refresh(); });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function showCreate() {
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

function showEdit(id) {
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

async function doCancel(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular vacuna", html, async (fd) => {
    const res = await api("POST", `/api/v1/vaccinations/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Vacuna anulada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle", "", [{ name: "reason", label: "Motivo de anulacion", type: "text", required: true }]);
}
