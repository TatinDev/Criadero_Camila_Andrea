import { api, uploadFile } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal } from "../components/ui.mjs";

let batches = [], horses = [], clients = [], stays = [], payments = [], vaccs = [], farriers = [], showCancelled = false;

function truncate(str, max = 30) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function fileIcon(mime) {
  if (!mime) return "bi-file-earmark";
  if (mime.startsWith("image/")) return "bi-file-image";
  if (mime === "application/pdf") return "bi-filetype-pdf";
  if (mime.includes("word") || mime.includes("document")) return "bi-filetype-docx";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("xls")) return "bi-filetype-xlsx";
  if (mime.includes("text/") || mime.endsWith("txt")) return "bi-filetype-txt";
  if (mime.includes("csv")) return "bi-filetype-csv";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return "bi-file-zip";
  return "bi-file-earmark";
}

const ENTITY_TYPES = [
  { value: "horse", label: "Caballo" },
  { value: "client", label: "Cliente" },
  { value: "boarding_stay", label: "Pension" },
  { value: "boarding_payment", label: "Pago" },
  { value: "vaccination", label: "Vacuna" },
  { value: "farrier_record", label: "Herraje" },
];

function entityLabel(type, id) {
  if (type === "horse") return horses.find((h) => h.id === id)?.name || id;
  if (type === "client") return clients.find((c) => c.id === id)?.fullName || id;
  if (type === "boarding_stay") return stays.find((s) => s.id === id)?.code || id;
  if (type === "boarding_payment") return payments.find((p) => p.id === id)?.id || id;
  if (type === "vaccination") return vaccs.find((v) => v.id === id)?.vaccineName || id;
  if (type === "farrier_record") return farriers.find((f) => f.id === id)?.id || id;
  return id;
}

function entityOptions(type) {
  if (type === "horse") return horses.map((h) => `<option value="${h.id}">${escapeHtml(h.name)} (${h.id})</option>`).join("");
  if (type === "client") return clients.map((c) => `<option value="${c.id}">${escapeHtml(`${c.firstName} ${c.lastName}`)} (${c.id})</option>`).join("");
  if (type === "boarding_stay") return stays.map((s) => `<option value="${s.id}">${escapeHtml(s.code)}</option>`).join("");
  if (type === "boarding_payment") return payments.map((p) => `<option value="${p.id}">${escapeHtml(p.id)}</option>`).join("");
  if (type === "vaccination") return vaccs.map((v) => `<option value="${v.id}">${escapeHtml(v.vaccineName)} (${v.id})</option>`).join("");
  if (type === "farrier_record") return farriers.map((f) => `<option value="${f.id}">${escapeHtml(f.id)}</option>`).join("");
  return "";
}

function fileHtml(file) {
  if (!file) return "-";
  const name = file.displayName || file.fileName || file.name || file.storagePath || file;
  const path = file.storagePath || file;
  const mime = file.mimeType || file.mime || "application/octet-stream";
  const icon = fileIcon(mime);
  const isImg = mime.startsWith("image/");
  const dl = `/api/v1/uploads/${encodeURIComponent(path)}`;
  return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
    <i class="bi ${icon}" style="font-size:14px;flex-shrink:0;"></i>
    <span style="flex:1;font-size:13px;" title="${escapeHtml(name)}">${escapeHtml(truncate(name, 35))}</span>
    <a href="${dl}" target="_blank" class="btn ghost small" style="font-size:10px;padding:2px 6px;" title="Descargar">Descargar</a>
    ${isImg ? `<a href="${dl}?inline=1" target="_blank" class="btn ghost small" style="font-size:10px;padding:2px 6px;" title="Ver imagen">Ver</a>` : ""}
  </div>`;
}

function filesListHtml(files) {
  if (!Array.isArray(files) || !files.length) return "-";
  return files.map((f) => fileHtml(f)).join("");
}

export async function render() {
  const [bRes, hRes, cRes, sRes, pRes, vRes, fRes] = await Promise.all([
    api("GET", "/api/v1/document-batches"),
    api("GET", "/api/v1/horses"),
    api("GET", "/api/v1/clients"),
    api("GET", "/api/v1/boarding-stays"),
    api("GET", "/api/v1/boarding-payments"),
    api("GET", "/api/v1/vaccinations"),
    api("GET", "/api/v1/farrier-records"),
  ]);
  batches = Array.isArray(bRes) ? bRes : [];
  horses = Array.isArray(hRes) ? hRes : [];
  clients = Array.isArray(cRes) ? cRes : [];
  stays = Array.isArray(sRes) ? sRes : [];
  payments = Array.isArray(pRes) ? pRes : [];
  vaccs = Array.isArray(vRes) ? vRes : [];
  farriers = Array.isArray(fRes) ? fRes : [];

  const filtered = showCancelled ? batches : batches.filter((b) => b.status !== "cancelled");

  return `
    <div class="card">
      <div class="card-header"><h2>Documentos</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);white-space:nowrap;">
            <input type="checkbox" id="docs-show-cancelled" ${showCancelled ? "checked" : ""}> Mostrar anulados
          </label>
          <button class="btn primary" id="btn-new-batch">Subir documentos</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Lote</th><th>Entidad</th><th>Descripcion</th><th>Archivos</th><th>Estado</th><th></th></tr></thead>
        <tbody>${filtered.map((b) => `
          <tr>
            <td><strong>${escapeHtml(b.title)}</strong></td>
            <td>${statusLabel(b.entityType)}: ${escapeHtml(entityLabel(b.entityType, b.entityId))}</td>
            <td style="max-width:200px;">${escapeHtml(b.description || "-")}</td>
            <td>${Array.isArray(b.files) ? b.files.length : 0} archivos</td>
            <td><span class="status-pill ${statusClass(b.status)}">${statusLabel(b.status)}</span></td>
            <td>
              <div style="display:flex;gap:6px;">
                <button class="btn ghost small" data-view-batch="${b.id}">Ver</button>
                <button class="btn ghost small" data-edit-batch="${b.id}">Editar</button>
                ${b.status !== "cancelled" ? `<button class="btn ghost small" data-cancel-batch="${b.id}">Anular</button>` : ""}
              </div>
            </td>
          </tr>`).join("")}</tbody></table></div></div>`;
}

export function bind() {
  document.getElementById("btn-new-batch")?.addEventListener("click", () => showCreate());
  document.getElementById("docs-show-cancelled")?.addEventListener("change", (e) => { showCancelled = e.target.checked; refresh(); });
  document.querySelectorAll("[data-view-batch]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.viewBatch)));
  document.querySelectorAll("[data-edit-batch]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editBatch)));
  document.querySelectorAll("[data-cancel-batch]").forEach((b) => b.addEventListener("click", () => cancelBatch(b.dataset.cancelBatch)));
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function fileEntry(up, originalFile) {
  return `${up.storagePath}::${up.originalName || originalFile.name}::${up.mimeType || originalFile.type || "application/octet-stream"}`;
}

function showCreate() {
  const html = `
    <form class="form-grid">
      <label class="full" style="flex-direction:row;align-items:center;gap:12px;font-size:14px;">
        Tipo de entidad:
        <select name="entityType" id="entity-type-select" required style="width:auto;min-width:140px;padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="">Seleccionar...</option>
          ${ENTITY_TYPES.map((et) => `<option value="${et.value}">${et.label}</option>`).join("")}
        </select>
      </label>
      <label class="full" id="entity-id-wrapper" style="display:none;">Seleccione primero un tipo de entidad</label>
      <label class="full">Nombre del lote <input name="title" type="text" required></label>
      <label class="full">Descripcion <input name="description" type="text" placeholder="Descripcion del conjunto documental"></label>
      <label class="full">Seleccionar archivos <input name="files" type="file" multiple required></label>
      <div id="file-list" class="full" style="display:none;font-size:12px;color:var(--text-2);padding:8px 12px;background:var(--surface-2);border-radius:8px;"></div>
    </form>`;
  const overlay = modal("Subir documentos", html, async (fd) => {
    const form = overlay.querySelector("form");
    const payload = { title: fd.get("title"), description: fd.get("description"), entityType: fd.get("entityType"), entityId: fd.get("entityId") };
    if (payload.entityType && !payload.entityId) { toast("Debe seleccionar una entidad especifica del tipo elegido"); return; }
    const fileInput = form?.querySelector('input[type="file"]');
    const entries = [];
    if (fileInput?.files?.length > 0) {
      for (const file of fileInput.files) {
        const up = await uploadFile(file);
        if (up && !up.error && up.storagePath) entries.push(fileEntry(up, file));
      }
    }
    if (entries.length === 0) { toast("Debe seleccionar al menos un archivo"); return; }
    payload.filesText = entries.join("\n");
    const res = await api("POST", "/api/v1/document-batches", payload);
    if (res && !res.error) { toast("Documentos subidos", true); refresh(); }
    else toast(res?.error?.message || "Error al subir");
  }, "Subir", "bi-cloud-upload");

  const saveBtn = overlay.querySelector(".modal-save");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = ".5"; saveBtn.style.cursor = "not-allowed"; }

  document.getElementById("entity-type-select")?.addEventListener("change", (e) => {
    updateEntityDropdown(e.target.value);
  });
  document.querySelector('input[name="files"]')?.addEventListener("change", (e) => {
    const list = document.getElementById("file-list");
    const saveBtn = document.querySelector(".modal-save");
    if (!list || !e.target.files?.length) {
      if (list) list.style.display = "none";
      if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = ".5"; saveBtn.style.cursor = "not-allowed"; }
      return;
    }
    if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = "1"; saveBtn.style.cursor = "pointer"; }
    list.style.display = "block";
    const names = Array.from(e.target.files).map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`);
    list.innerHTML = `<strong>${e.target.files.length} archivo(s):</strong><br>` + names.join("<br>");
  });
}

function updateEntityDropdown(type) {
  const wrapper = document.getElementById("entity-id-wrapper");
  if (!wrapper) return;
  if (!type) {
    wrapper.style.display = "none";
    wrapper.innerHTML = "Seleccione primero un tipo de entidad";
    return;
  }
  const opts = entityOptions(type);
  wrapper.style.display = "block";
  wrapper.innerHTML = `Entidad:
    <select name="entityId" required style="width:100%;padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
      <option value="">Seleccionar...</option>
      ${opts}
    </select>`;
}

function showView(id) {
  const b = batches.find((item) => item.id === id); if (!b) return;
  const imgs = Array.isArray(b.files) ? b.files.filter((f) => (f.mimeType || f.mime || "").startsWith("image/")) : [];
  const html = `
    <div style="font-size:14px;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
        <div><strong>Lote:</strong> ${escapeHtml(b.title)}</div>
        <div><strong>Entidad:</strong> ${statusLabel(b.entityType)} — ${escapeHtml(entityLabel(b.entityType, b.entityId))}</div>
        <div><strong>Estado:</strong> <span class="status-pill ${statusClass(b.status)}">${statusLabel(b.status)}</span></div>
      </div>
      ${b.description ? `<div style="margin-bottom:12px;color:var(--text-2);">${escapeHtml(b.description)}</div>` : ""}
      ${imgs.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">${imgs.map((f) => {
        const dl = `/api/v1/uploads/${encodeURIComponent(f.storagePath || f)}`;
        return `<a href="${dl}?inline=1" target="_blank"><img src="${dl}?inline=1" style="max-width:120px;max-height:90px;border-radius:8px;border:1px solid var(--border);" alt="${escapeHtml(f.displayName || f.fileName || f.name || "")}" onerror="this.style.display='none'"></a>`;
      }).join("")}</div>` : ""}
      <div style="font-size:13px;"><strong>Archivos (${Array.isArray(b.files) ? b.files.length : 0}):</strong></div>
      <div style="margin-top:8px;">${filesListHtml(b.files)}</div>
    </div>`;
  modal("Ver lote documental", html, null, "", "bi-eye", "");
}

function showEdit(id) {
  const b = batches.find((item) => item.id === id); if (!b) return;
  const html = `<form class="form-grid">
    <label class="full" style="font-size:14px;color:var(--text-2);">Entidad: <strong>${statusLabel(b.entityType)}</strong> — <strong>${escapeHtml(entityLabel(b.entityType, b.entityId))}</strong></label>
    <label class="full">Nombre del lote <input name="title" type="text" value="${escapeHtml(b.title || "")}" required></label>
    <label class="full">Descripcion <input name="description" type="text" value="${escapeHtml(b.description || "")}"></label>
    ${Array.isArray(b.files) ? `<div class="full" style="font-size:13px;padding:8px 12px;background:var(--surface-2);border-radius:8px;">${filesListHtml(b.files)}</div>` : ""}
  </form>`;
  modal("Editar lote", html, async (fd) => {
    const payload = { title: fd.get("title"), description: fd.get("description") };
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
