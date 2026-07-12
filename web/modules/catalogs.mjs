import { api } from "../api.mjs";
import { escapeHtml, statusLabel, toast, modal, formFieldsHtml } from "../components/ui.mjs";

const CATALOGS = [
  { id: "horse-colors", label: "Colores de caballo", fields: ["code", "name", "description"] },
  { id: "horse-sexes", label: "Sexos de caballo", fields: ["code", "name"] },
  { id: "horse-breeds", label: "Razas de caballo", fields: ["code", "name", "description"] },
  { id: "boarding-types", label: "Tipos de pension", fields: ["code", "name", "description"] },
  { id: "agreement-statuses", label: "Estados del acuerdo", fields: ["code", "name", "description", "sortOrder"] },
  { id: "payment-methods", label: "Medios de pago", fields: ["code", "name"] },
  { id: "client-statuses", label: "Estados de cliente", fields: ["code", "name"] },
  { id: "vaccination-statuses", label: "Estados de vacuna", fields: ["code", "name"] },
  { id: "farrier-record-statuses", label: "Estados de herraje", fields: ["code", "name"] },
  { id: "importance-levels", label: "Niveles de importancia", fields: ["code", "name", "sortOrder"] },
  { id: "event-types", label: "Tipos de evento", fields: ["code", "name"] },
  { id: "supplies", label: "Insumos", fields: ["code", "name", "unit", "description"] },
];

let selectedCatalog = CATALOGS[0].id;
let entries = [];

export async function render() {
  const res = await api("GET", `/api/v1/catalogs/${selectedCatalog}`);
  entries = Array.isArray(res) ? res : [];

  const cat = CATALOGS.find((c) => c.id === selectedCatalog) || CATALOGS[0];
  const cols = cat.fields;

  return `
    <div class="card">
      <div class="card-header">
        <h2>Catalogos del sistema</h2>
        <button class="btn primary" id="btn-new-catalog-entry">Nuevo</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <select id="catalog-selector" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;min-width:200px;">
          ${CATALOGS.map((c) => `<option value="${c.id}" ${c.id === selectedCatalog ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
        </select>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr>${cols.map((c) => `<th>${statusLabel(c)}</th>`).join("")}<th></th></tr></thead>
          <tbody>${entries.map((e) => `
            <tr>
              ${cols.map((c) => `<td>${escapeHtml(String(e[c] ?? ""))}</td>`).join("")}
              <td>
                <button class="btn ghost small" data-edit-catalog="${e.id}">Editar</button>
                <button class="btn ghost small" data-delete-catalog="${e.id}" style="color:var(--danger);">Eliminar</button>
              </td>
            </tr>`).join("")}</tbody>
        </table>
        ${entries.length === 0 ? `<div style="text-align:center;padding:16px;color:var(--text-2);">Sin registros en este catalogo.</div>` : ""}
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("catalog-selector")?.addEventListener("change", (e) => { selectedCatalog = e.target.value; refresh(); });
  document.getElementById("btn-new-catalog-entry")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-catalog]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editCatalog)));
  document.querySelectorAll("[data-delete-catalog]").forEach((b) => b.addEventListener("click", () => confirmDelete(b.dataset.deleteCatalog)));
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function getFields() {
  const cat = CATALOGS.find((c) => c.id === selectedCatalog);
  return (cat?.fields || []).map((f) => {
    const type = f === "sortOrder" ? "number" : "text";
    return { name: f, label: statusLabel(f), type, required: f === "code" || f === "name" };
  });
}

function showCreate() {
  const fields = getFields();
  const html = `<form class="form-grid">${formFieldsHtml(fields, {})}</form>`;
  modal("Nuevo registro", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", `/api/v1/catalogs/${selectedCatalog}`, payload);
    if (res && !res.error) { toast("Registro creado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Crear", "bi-plus-circle", "", fields);
}

function showEdit(id) {
  const e = entries.find((item) => item.id === id);
  if (!e) return;
  const fields = getFields();
  const html = `<form class="form-grid">${formFieldsHtml(fields, e)}</form>`;
  modal("Editar registro", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/catalogs/${selectedCatalog}/${id}`, payload);
    if (res && !res.error) { toast("Registro actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "", fields);
}

function confirmDelete(id) {
  const e = entries.find((item) => item.id === id);
  if (!e) return;
  const name = e.name || e.code || e.id;
  modal("Eliminar registro", `<p>¿Eliminar <strong>${escapeHtml(name)}</strong>?</p><p style="font-size:13px;color:var(--text-2);">Esta accion no se puede deshacer.</p>`, async () => {
    const res = await api("DELETE", `/api/v1/catalogs/${selectedCatalog}/${id}`);
    if (res && !res.error) { toast("Registro eliminado", true); refresh(); }
    else toast(res?.error?.message || "Error al eliminar");
  }, "Eliminar", "bi-trash");
}
