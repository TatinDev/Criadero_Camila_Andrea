import { api } from "../api.mjs";
import { esc, badge, show } from "../app.mjs";

export async function renderDocuments(container) {
  const batches = await api.get("/document-batches");
  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Lotes documentales</h2><button class="btn btn-primary btn-sm" id="btn-new">+ Subir documentos</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Entidad</th><th>ID entidad</th><th>Archivos</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${batches.map(b => `<tr>
        <td>${esc(b.title)}</td><td>${esc(b.entityType)}</td><td class="mono">${esc(b.entityId)}</td>
        <td>${(b.files||[]).map(f=>esc(f.name)).join(", ")||"-"}</td>
        <td>${badge(b.status)}</td>
        <td><button class="btn-icon" data-cancel='${b.id}'><i class="bi bi-x-circle"></i></button></td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
  container.querySelector("#btn-new")?.addEventListener("click", () => showForm(container));
  container.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", async () => {
    if (!confirm("Anular este lote?")) return;
    await api.post(`/document-batches/${b.dataset.cancel}/cancel`, { reason: "Anulado" });
    show("Lote anulado"); renderDocuments(container);
  }));
}

async function showForm(container) {
  const overlay = document.createElement("div"); overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal">
    <h2>Subir documentos</h2>
    <form id="frm-doc">
      <div class="form-grid">
        <label>Entidad <select name="entityType" id="doc-entity-type">
          ${["horse","client","boarding_stay","vaccination","farrier_record"].map(t => `<option value="${t}">${t}</option>`).join("")}
        </select></label>
        <label>ID entidad <input name="entityId" required placeholder="HOR-001"></label>
        <label class="full">Nombre lote <input name="title" required></label>
        <label class="full">Descripcion <textarea name="description"></textarea></label>
        <label class="full">Archivos <input type="file" multiple id="doc-files"></label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button type="submit" class="btn btn-primary">Subir lote</button>
      </div>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("[data-close-modal]")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#frm-doc")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd);
    const fileInput = overlay.querySelector("#doc-files");
    const names = [];
    if (fileInput?.files?.length > 0) {
      for (const file of fileInput.files) {
        const reader = new FileReader();
        const content = await new Promise(res => { reader.onload = () => res(reader.result.split(",")[1]); reader.readAsDataURL(file); });
        const up = await api.upload(file.name, content, file.type);
        names.push(up.fileName);
      }
    }
    if (names.length) payload.filesText = names.join("\n");
    try { await api.post("/document-batches", payload); overlay.remove(); show("Lote creado"); renderDocuments(container); }
    catch(err) { show(err.message||"Error"); }
  });
}
