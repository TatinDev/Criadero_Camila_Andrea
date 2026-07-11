import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, dateLocale } from "../components/ui.mjs";

let vaccinations = [], farrierRecords = [], horses = [];

const vaccFields = [
  { name: "horseId", label: "Caballo", type: "relation", required: true },
  { name: "vaccineName", label: "Nombre vacuna", type: "text", required: true },
  { name: "appliedAt", label: "Fecha aplicacion", type: "date", required: true },
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
  vaccinations = Array.isArray(vRes) ? vRes : [];
  const fRes = await api("GET", "/api/v1/farrier-records");
  farrierRecords = Array.isArray(fRes) ? fRes : [];
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];

  return `
    <div class="split-2">
      <div class="card">
        <div class="card-header">
          <h2>Vacunas</h2>
          <button class="btn primary" id="btn-new-vacc">Registrar</button>
        </div>
        <table>
          <thead><tr><th>Caballo</th><th>Vacuna</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${vaccinations.map((v) => `
            <tr>
              <td>${escapeHtml(horseName(v.horseId))}</td>
              <td>${escapeHtml(v.vaccineName)}</td>
              <td>${dateLocale(v.appliedAt)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-vacc="${v.id}">Editar</button>
                  ${v.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-vacc="${v.id}">Anular</button>` : ""}
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Herrajes</h2>
          <button class="btn primary" id="btn-new-farrier">Registrar</button>
        </div>
        <table>
          <thead><tr><th>Caballo</th><th>Tipo</th><th>Fecha</th><th></th></tr></thead>
          <tbody>${farrierRecords.map((f) => `
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
      </div>
    </div>
  `;
}

function horseName(id) {
  return horses.find((h) => h.id === id)?.name || id;
}

function horseOpts() {
  return horses.map((h) => ({ id: h.id, label: h.name }));
}

export function bind() {
  document.getElementById("btn-new-vacc")?.addEventListener("click", () => showCreateVacc());
  document.getElementById("btn-new-farrier")?.addEventListener("click", () => showCreateFarrier());
  document.querySelectorAll("[data-edit-vacc]").forEach((b) => b.addEventListener("click", () => showEditVacc(b.dataset.editVacc)));
  document.querySelectorAll("[data-cancel-vacc]").forEach((b) => b.addEventListener("click", () => cancel("vaccinations", b.dataset.cancelVacc)));
  document.querySelectorAll("[data-edit-farrier]").forEach((b) => b.addEventListener("click", () => showEditFarrier(b.dataset.editFarrier)));
  document.querySelectorAll("[data-cancel-farrier]").forEach((b) => b.addEventListener("click", () => cancel("farrier-records", b.dataset.cancelFarrier)));
}

async function refresh() {
  const { render: r, bind: b } = await import("./health.mjs");
  document.getElementById("view-container").innerHTML = await r();
  b();
}

function showCreateVacc() {
  modal("Registrar vacuna", `<form class="form-grid">${formFieldsHtml(vaccFields, {}, { horseId: horseOpts() })}</form>`, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/vaccinations", payload);
    if (res && !res.error) { toast("Vacuna registrada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-clipboard2-plus");
}

function showEditVacc(id) {
  const v = vaccinations.find((item) => item.id === id); if (!v) return;
  modal("Editar vacuna", `<form class="form-grid">${formFieldsHtml(vaccFields, v, { horseId: horseOpts() })}</form>`, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/vaccinations/${id}`, payload);
    if (res && !res.error) { toast("Vacuna actualizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil");
}

function showCreateFarrier() {
  modal("Registrar herraje", `<form class="form-grid">${formFieldsHtml(farrierFields, { serviceType: "shoeing" }, { horseId: horseOpts() })}</form>`, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/farrier-records", payload);
    if (res && !res.error) { toast("Herraje registrado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Registrar", "bi-clipboard2-plus");
}

function showEditFarrier(id) {
  const f = farrierRecords.find((item) => item.id === id); if (!f) return;
  modal("Editar herraje", `<form class="form-grid">${formFieldsHtml(farrierFields, f, { horseId: horseOpts() })}</form>`, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/farrier-records/${id}`, payload);
    if (res && !res.error) { toast("Herraje actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil");
}

async function cancel(endpoint, id) {
  const html = `<form><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular registro", html, async (fd) => {
    const res = await api("POST", `/api/v1/${endpoint}/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Registro anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle");
}
