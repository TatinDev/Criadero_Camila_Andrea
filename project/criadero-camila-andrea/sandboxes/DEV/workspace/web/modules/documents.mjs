import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml } from "../components/ui.mjs";

let batches = [];

const fields = [
  { name: "entityType", label: "Entidad", type: "select", options: ["horse", "client", "boarding_stay", "boarding_payment", "vaccination", "farrier_record"], required: true },
  { name: "entityId", label: "ID entidad", type: "text", required: true },
  { name: "title", label: "Nombre lote", type: "text", required: true },
  { name: "description", label: "Descripcion", type: "textarea", full: true },
  { name: "filesText", label: "Archivos (uno por linea)", type: "textarea", full: true },
];

export async function render() {
  const res = await api("GET", "/api/v1/document-batches");
  batches = Array.isArray(res) ? res : [];
  return `<div class="card"><div class="card-header"><h2>Documentos</h2><button class="btn primary" id="btn-new-batch">Subir documentos</button></div><div style="overflow-x:auto;"><table><thead><tr><th>Lote</th><th>Entidad</th><th>Archivos</th><th>Estado</th><th></th></tr></thead><tbody>${batches.map((b) => `<tr><td><strong>${escapeHtml(b.title)}</strong></td><td>${escapeHtml(b.entityType)}:${escapeHtml(b.entityId)}</td><td>${escapeHtml(b.files?.map((f) => f.name).join(", ") || "")}</td><td><span class="status-pill ${statusClass(b.status)}">${statusLabel(b.status)}</span></td><td><div style="display:flex;gap:6px;"><button class="btn ghost small" data-edit-batch="${b.id}">Editar</button>${b.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-batch="${b.id}">Anular</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div></div>`;
}

export function bind() {
  document.getElementById("btn-new-batch")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-batch]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editBatch)));
  document.querySelectorAll("[data-cancel-batch]").forEach((b) => b.addEventListener("click", () => cancelBatch(b.dataset.cancelBatch)));
}

async function refresh() { const { render: r, bind: b } = await import("./documents.mjs"); document.getElementById("view-container").innerHTML = await r(); b(); }

function showCreate() {
  const html = `<form class="form-grid">${formFieldsHtml(fields, {})}<label class="full">Archivos <input name="fileUpload" type="file" multiple></label></form>`;
  modal("Subir documentos", html, async (fd) => {
    const fileInput = document.querySelector('[name="fileUpload"]');
    if (fileInput?.files?.length > 0) {
      const names = [];
      for (const file of fileInput.files) { const uRes = await uploadFile(file); if (uRes && !uRes.error) names.push(file.name); }
      fd.set("filesText", names.join("\n"));
    }
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/document-batches", payload);
    if (res && !res.error) { toast("Documentos subidos", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Subir", "bi-cloud-upload");
}

function showEdit(id) {
  const b = batches.find((item) => item.id === id); if (!b) return;
  const html = `<form class="form-grid">${formFieldsHtml(fields, b)}</form>`;
  modal("Editar lote", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/document-batches/${id}`, payload);
    if (res && !res.error) { toast("Lote actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil");
}

async function cancelBatch(id) {
  const html = `<form class="form-grid"><label class="full">Motivo de anulacion <input name="reason" type="text" required></label></form>`;
  modal("Anular lote", html, async (fd) => {
    const res = await api("POST", `/api/v1/document-batches/${id}/cancel`, { reason: fd.get("reason") });
    if (res && !res.error) { toast("Lote anulado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Anular", "bi-x-circle");
}
