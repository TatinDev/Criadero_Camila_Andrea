import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money } from "../components/ui.mjs";

let horses = [], clients = [];

const fields = [
  { name: "ownershipType", label: "Tipo", type: "select", options: [{ value: "own", label: "Propio" }, { value: "boarded", label: "Pensionado" }], required: true },
  { name: "name", label: "Nombre", type: "text", required: true },
  { name: "sex", label: "Sexo", type: "select", options: ["hembra", "macho", "castrado"], required: true },
  { name: "color", label: "Color", type: "text", required: true },
  { name: "distinctiveMarks", label: "Distintivos", type: "textarea", required: true },
  { name: "clientId", label: "Cliente dueno", type: "relation" },
  { name: "birthDate", label: "Fecha nacimiento", type: "date" },
  { name: "breederName", label: "Criador", type: "text" },
  { name: "temporaryLocation", label: "Ubicacion temporal", type: "text" },
  { name: "fatherExternalName", label: "Padre externo", type: "text" },
  { name: "motherExternalName", label: "Madre externa", type: "text" },
  { name: "notes", label: "Notas", type: "textarea", full: true },
];

export async function render() {
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];
  const cRes = await api("GET", "/api/v1/clients");
  clients = Array.isArray(cRes) ? cRes : [];

  return `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;gap:12px;align-items:center;">
          <h2>Caballos</h2>
          <span class="status-pill status-active">${horses.filter((h) => h.ownershipType === "own").length} propios</span>
          <span class="status-pill status-in_stay">${horses.filter((h) => h.ownershipType === "boarded").length} pensionados</span>
        </div>
        <button class="btn primary" id="btn-new-horse">Nuevo caballo</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Nombre</th><th>Tipo</th><th>Sexo</th><th>Color</th><th>Estado</th><th></th></tr></thead>
          <tbody>${horses.map((h) => `
            <tr>
              <td><strong>${escapeHtml(h.name)}</strong></td>
              <td>${statusLabel(h.ownershipType)}</td>
              <td>${statusLabel(h.sex)}</td>
              <td>${escapeHtml(h.color)}</td>
              <td><span class="status-pill ${statusClass(h.status)}">${statusLabel(h.status)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit="${h.id}">Editar</button>
                  <button class="btn ghost small" data-status="${h.id}">Estado</button>
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-horse")?.addEventListener("click", () => showCreateModal());
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => showEditModal(b.dataset.edit)));
  document.querySelectorAll("[data-status]").forEach((b) => b.addEventListener("click", () => showStatusModal(b.dataset.status)));
}

async function refresh() {
  const { render: r, bind: b } = await import("./horses.mjs");
  document.getElementById("view-container").innerHTML = await r();
  b();
}

function clientOpts() {
  return clients.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
}

function showCreateModal() {
  const html = `<form>${formFieldsHtml(fields, { ownershipType: "own" }, { clientId: clientOpts() })}</form>`;
  modal("Nuevo caballo", html, async (formData) => {
    const payload = Object.fromEntries(formData.entries());
    const res = await api("POST", "/api/v1/horses", payload);
    if (res && !res.error) { toast("Caballo creado", true); refresh(); }
    else toast(res?.error?.message || "Error al crear");
  });
}

function showEditModal(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const html = `<form>${formFieldsHtml(fields, h, { clientId: clientOpts() })}</form>`;
  modal("Editar caballo", html, async (formData) => {
    const payload = Object.fromEntries(formData.entries());
    const res = await api("PATCH", `/api/v1/horses/${id}`, payload);
    if (res && !res.error) { toast("Caballo actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error al actualizar");
  });
}

function showStatusModal(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const opts = h.ownershipType === "own"
    ? ["active", "temporary_out", "in_treatment", "sold", "retired", "deceased", "inactive"]
    : ["active", "in_stay", "out_of_stay", "in_treatment", "inactive"];
  const html = `
    <form>
      <label class="full">Nuevo estado
        <select name="status">${opts.map((o) => `<option value="${o}" ${h.status === o ? "selected" : ""}>${statusLabel(o)}</option>`).join("")}</select>
      </label>
    </form>`;
  modal("Cambiar estado", html, async (formData) => {
    const status = formData.get("status");
    const res = await api("POST", `/api/v1/horses/${id}/change-status`, { status });
    if (res && !res.error) { toast("Estado actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error al cambiar estado");
  });
}
