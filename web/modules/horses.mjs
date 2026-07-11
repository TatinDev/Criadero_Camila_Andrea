import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, dateLocale, money } from "../components/ui.mjs";

let horses = [], clients = [], filters = { search: "", type: "all", status: "all", sex: "all" }, showInactive = false;

const commonFields = [
  { name: "name", label: "Nombre", type: "text", required: true },
  { name: "sex", label: "Sexo", type: "select", options: ["hembra", "macho"], required: true },
  { name: "color", label: "Color", type: "text", required: true },
  { name: "birthDate", label: "Fecha de nacimiento", type: "date" },
  { name: "breederName", label: "Nombre del criador", type: "text" },
  { name: "breedingFarmName", label: "Nombre del criadero", type: "text" },
  { name: "distinctiveMarks", label: "Distintivos", type: "textarea", full: true, required: true },
  { name: "notes", label: "Notas", type: "textarea", full: true },
];

const ownFields = [
  { name: "temporaryLocation", label: "Ubicacion temporal", type: "text" },
  { name: "status", label: "Estado propio", type: "select", options: [
    { value: "active", label: "Activo" }, { value: "temporary_out", label: "Salida temporal" },
    { value: "in_treatment", label: "En tratamiento" }, { value: "sold", label: "Vendido" },
    { value: "retired", label: "Retirado" }, { value: "deceased", label: "Fallecido" },
    { value: "inactive", label: "Inactivo" }
  ]},
];

const boardedFields = [
  { name: "clientId", label: "Cliente dueño", type: "relation", required: true },
  { name: "status", label: "Estado pensionado", type: "select", options: [
    { value: "active", label: "Activo" }, { value: "in_stay", label: "En pension" },
    { value: "out_of_stay", label: "Retirado" }, { value: "in_treatment", label: "En tratamiento" },
    { value: "inactive", label: "Inactivo" }
  ]},
];

export async function render() {
  const hRes = await api("GET", `/api/v1/horses${showInactive ? "?show_inactive=true" : ""}`);
  horses = Array.isArray(hRes) ? hRes : [];
  const cRes = await api("GET", "/api/v1/clients");
  clients = Array.isArray(cRes) ? cRes : [];

  const filtered = horses.filter((h) => {
    if (filters.type === "own" && h.ownershipType !== "own") return false;
    if (filters.type === "boarded" && h.ownershipType !== "boarded") return false;
    if (filters.status !== "all" && h.status !== filters.status) return false;
    if (filters.sex !== "all" && h.sex !== filters.sex) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      return (h.name || "").toLowerCase().includes(s) || (h.color || "").toLowerCase().includes(s)
        || (h.distinctiveMarks || "").toLowerCase().includes(s) || (h.breederName || "").toLowerCase().includes(s)
        || (h.temporaryLocation || "").toLowerCase().includes(s);
    }
    return true;
  });

  return `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;gap:12px;align-items:center;">
          <h2>Caballos</h2>
          <span class="status-pill status-active">${horses.filter((h) => h.ownershipType === "own").length} propios</span>
          <span class="status-pill status-in_stay">${horses.filter((h) => h.ownershipType === "boarded").length} pensionados</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn primary" id="btn-new-own">Nuevo propio</button>
          <button class="btn primary" id="btn-new-boarded">Nuevo pensionado</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input type="text" id="horse-search" placeholder="Buscar por nombre, color, distintivos..." value="${escapeHtml(filters.search)}" style="flex:1;min-width:180px;padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
        <select id="horse-filter-type" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="all" ${filters.type === "all" ? "selected" : ""}>Todos</option>
          <option value="own" ${filters.type === "own" ? "selected" : ""}>Propios</option>
          <option value="boarded" ${filters.type === "boarded" ? "selected" : ""}>Pensionados</option>
        </select>
        <select id="horse-filter-status" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="all" ${filters.status === "all" ? "selected" : ""}>Todos estados</option>
          <option value="active" ${filters.status === "active" ? "selected" : ""}>Activo</option>
          <option value="in_stay" ${filters.status === "in_stay" ? "selected" : ""}>En pension</option>
          <option value="in_treatment" ${filters.status === "in_treatment" ? "selected" : ""}>En tratamiento</option>
          <option value="inactive" ${filters.status === "inactive" ? "selected" : ""}>Inactivo</option>
        </select>
        <select id="horse-filter-sex" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="all" ${filters.sex === "all" ? "selected" : ""}>Ambos sexos</option>
          <option value="hembra" ${filters.sex === "hembra" ? "selected" : ""}>Hembra</option>
          <option value="macho" ${filters.sex === "macho" ? "selected" : ""}>Macho</option>
        </select>
        ${(filters.type !== "all" || filters.status !== "all" || filters.sex !== "all" || filters.search) ? `<button class="btn ghost small" id="horse-clear-filters">Limpiar filtros</button>` : ""}
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);">
          <input type="checkbox" id="horse-show-inactive" ${showInactive ? "checked" : ""}> Mostrar inactivos
        </label>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Nombre</th><th>Tipo</th><th>Sexo</th><th>Color</th><th>Cliente</th><th>Ubicacion</th><th>Estado</th><th></th></tr></thead>
          <tbody>${filtered.map((h) => `
            <tr>
              <td><strong>${escapeHtml(h.name)}</strong>${h.birthDate ? `<br><small style="color:var(--text-2);">Nac. ${dateLocale(h.birthDate)}</small>` : ""}</td>
              <td>${statusLabel(h.ownershipType)}</td>
              <td>${statusLabel(h.sex)}</td>
              <td>${escapeHtml(h.color)}</td>
              <td>${h.ownershipType === "boarded" ? escapeHtml(clients.find((c) => c.id === h.clientId)?.fullName || h.clientId || "-") : "-"}</td>
              <td>${escapeHtml(h.temporaryLocation || h.breedingFarmName || "-")}</td>
              <td><span class="status-pill ${statusClass(h.status)}">${statusLabel(h.status)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-ficha="${h.id}">Ficha</button>
                  <button class="btn ghost small" data-edit="${h.id}">Editar</button>
                  <button class="btn ghost small" data-status="${h.id}">Estado</button>
                  <button class="btn ghost small" data-delete="${h.id}" style="color:var(--danger);">Eliminar</button>
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
        ${filtered.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--text-2);">Sin resultados para los filtros seleccionados.</div>` : ""}
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-own")?.addEventListener("click", () => showCreateOwn());
  document.getElementById("btn-new-boarded")?.addEventListener("click", () => showCreateBoarded());
  document.querySelectorAll("[data-ficha]").forEach((b) => b.addEventListener("click", () => showDetail(b.dataset.ficha)));
  document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => showEditModal(b.dataset.edit)));
  document.querySelectorAll("[data-status]").forEach((b) => b.addEventListener("click", () => showStatusModal(b.dataset.status)));
  document.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => confirmDelete(b.dataset.delete)));
  document.getElementById("horse-clear-filters")?.addEventListener("click", () => { filters = { search: "", type: "all", status: "all", sex: "all" }; refresh(); });
  document.getElementById("horse-search")?.addEventListener("input", debounce((e) => { filters.search = e.target.value; refresh(); }, 300));
  document.getElementById("horse-filter-type")?.addEventListener("change", (e) => { filters.type = e.target.value; refresh(); });
  document.getElementById("horse-filter-status")?.addEventListener("change", (e) => { filters.status = e.target.value; refresh(); });
  document.getElementById("horse-filter-sex")?.addEventListener("change", (e) => { filters.sex = e.target.value; refresh(); });
  document.getElementById("horse-show-inactive")?.addEventListener("change", (e) => { showInactive = e.target.checked; refresh(); });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function clientOpts() {
  return clients.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
}

function fatherOpts(excludeId = null) {
  return horses.filter((h) => h.id !== excludeId && h.sex === "macho").map((h) => ({ id: h.id, label: h.name }));
}

function motherOpts(excludeId = null) {
  return horses.filter((h) => h.id !== excludeId && h.sex === "hembra").map((h) => ({ id: h.id, label: h.name }));
}

function buildFieldsFor(ownershipType) {
  if (ownershipType === "boarded") return [...commonFields, ...boardedFields];
  return [...commonFields, ...ownFields];
}

function parentHtml(prefix, label, icon, hasReg = false, horseId = "", extName = "", optsList = []) {
  return `
    <div class="genealogy-box">
      <label>
        <input type="checkbox" id="${prefix}-registered" ${hasReg ? "checked" : ""}>
        <i class="bi ${icon}" style="font-size:14px;"></i> ${label} registrado en el sistema
      </label>
      <div id="${prefix}-select" style="display:${hasReg ? "block" : "none"};" class="genealogy-inner">
        <select name="${prefix}HorseId">
          <option value="">Seleccionar caballo...</option>
          ${optsList.map((h) => `<option value="${escapeHtml(h.id)}" ${horseId === h.id ? "selected" : ""}>${escapeHtml(h.label)}</option>`).join("")}
        </select>
      </div>
      <div id="${prefix}-text" style="display:${hasReg ? "none" : "block"};" class="genealogy-inner">
        <input name="${prefix}ExternalName" type="text" value="${escapeHtml(extName || "")}" placeholder="Nombre del ${label.toLowerCase()}">
      </div>
    </div>`;
}

function showCreateOwn() {
  const fields = [...commonFields, ...ownFields];
  const html = `
    <form class="form-grid">
      <input type="hidden" name="ownershipType" value="own">
      <div id="horse-fields-container">${formFieldsHtml(fields, {}, {})}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        ${parentHtml("father", "Padre", "bi-gender-male", false, "", "", fatherOpts())}
        ${parentHtml("mother", "Madre", "bi-gender-female", false, "", "", motherOpts())}
      </div>
    </form>`;
  modal("Nuevo caballo propio", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    payload.ownershipType = "own";
    delete payload.clientId;
    if (!document.getElementById("father-registered")?.checked) payload.fatherHorseId = "";
    if (!document.getElementById("mother-registered")?.checked) payload.motherHorseId = "";
    const res = await api("POST", "/api/v1/horses", payload);
    if (res && !res.error) { toast("Caballo creado", true); refresh(); }
    else toast(res?.error?.message || "Error al crear");
  }, "Crear", "bi-heart", "wide", fields);
  setupGenealogyToggles();
}

function showCreateBoarded() {
  const fields = [...commonFields, ...boardedFields];
  const html = `
    <form class="form-grid">
      <input type="hidden" name="ownershipType" value="boarded">
      <div id="horse-fields-container">${formFieldsHtml(fields, {}, { clientId: clientOpts() })}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        ${parentHtml("father", "Padre", "bi-gender-male", false, "", "", fatherOpts())}
        ${parentHtml("mother", "Madre", "bi-gender-female", false, "", "", motherOpts())}
      </div>
    </form>`;
  modal("Nuevo caballo pensionado", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    payload.ownershipType = "boarded";
    delete payload.temporaryLocation;
    if (!document.getElementById("father-registered")?.checked) payload.fatherHorseId = "";
    if (!document.getElementById("mother-registered")?.checked) payload.motherHorseId = "";
    const res = await api("POST", "/api/v1/horses", payload);
    if (res && !res.error) { toast("Caballo creado", true); refresh(); }
    else toast(res?.error?.message || "Error al crear");
  }, "Crear", "bi-heart", "wide", fields);
  setupGenealogyToggles();
}

function setupGenealogyToggles() {
  for (const p of ["father", "mother"]) {
    document.getElementById(`${p}-registered`)?.addEventListener("change", (e) => {
      document.getElementById(`${p}-select`).style.display = e.target.checked ? "block" : "none";
      document.getElementById(`${p}-text`).style.display = e.target.checked ? "none" : "block";
    });
  }
}

function showEditModal(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const otype = h.ownershipType || "own";
  const fields = buildFieldsFor(otype);
  const rels = otype === "boarded" ? { clientId: clientOpts() } : {};
  const hasFatherReg = Boolean(h.fatherHorseId);
  const hasMotherReg = Boolean(h.motherHorseId);
  const fatherOptsList = fatherOpts(id);
  const motherOptsList = motherOpts(id);
  const html = `<form class="form-grid">
    <label class="full" style="font-size:14px;color:var(--text-2);">Tipo: <strong>${otype === "own" ? "Propio" : "Pensionado"}</strong></label>
    ${formFieldsHtml(fields, h, rels)}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
      ${parentHtml("father", "Padre", "bi-gender-male", hasFatherReg, h.fatherHorseId, h.fatherExternalName, fatherOptsList)}
      ${parentHtml("mother", "Madre", "bi-gender-female", hasMotherReg, h.motherHorseId, h.motherExternalName, motherOptsList)}
    </div>
    <label class="full" style="grid-column:1/-1;">Fotos o bocetos (opcional) <input name="photos" type="file" multiple accept="image/*"></label>
  </form>`;
  modal("Editar caballo", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    if (otype === "own") delete payload.clientId;
    if (otype === "boarded") delete payload.temporaryLocation;
    if (!document.getElementById("father-registered")?.checked) payload.fatherHorseId = "";
    if (!document.getElementById("mother-registered")?.checked) payload.motherHorseId = "";
    const res = await api("PATCH", `/api/v1/horses/${id}`, payload);
    if (res && !res.error) { toast("Caballo actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error al actualizar");
  }, "Guardar", "bi-pencil", "wide", fields);

  for (const p of ["father", "mother"]) {
    document.getElementById(`${p}-registered`)?.addEventListener("change", (e) => {
      document.getElementById(`${p}-select`).style.display = e.target.checked ? "block" : "none";
      document.getElementById(`${p}-text`).style.display = e.target.checked ? "none" : "block";
    });
  }
}

function showStatusModal(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const opts = h.ownershipType === "own"
    ? ["active", "temporary_out", "in_treatment", "sold", "retired", "deceased", "inactive"]
    : ["active", "in_stay", "out_of_stay", "in_treatment", "inactive"];
  const html = `
    <form class="form-grid">
      <label class="full">Nuevo estado
        <select name="status">${opts.map((o) => `<option value="${o}" ${h.status === o ? "selected" : ""}>${statusLabel(o)}</option>`).join("")}</select>
      </label>
      <label class="full">Motivo (opcional) <input name="reason" type="text"></label>
    </form>`;
  modal("Cambiar estado", html, async (formData) => {
    const status = formData.get("status");
    const reason = formData.get("reason");
    const res = await api("POST", `/api/v1/horses/${id}/change-status`, { status, reason });
    if (res && !res.error) {
      toast("Estado actualizado", true);
      refresh();
      if (h.ownershipType === "boarded" && (h.status === "inactive" || h.status === "out_of_stay") && (status === "active" || status === "in_stay")) {
        setTimeout(() => {
          if (confirm("Desea crear una nueva pension para este caballo?")) {
            import("../app.mjs").then((m) => m.setCurrentView("boarding"));
          }
        }, 500);
      }
    }
    else toast(res?.error?.message || "Error al cambiar estado");
  }, "Guardar", "bi-arrow-repeat", "", [{ name: "status", label: "Nuevo estado", type: "select", required: true }]);
}

async function showDetail(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const [vaccines, farrierRecords, docs, gallery] = await Promise.all([
    api("GET", `/api/v1/vaccinations?horse_id=${id}`),
    api("GET", `/api/v1/farrier-records?horse_id=${id}`),
    api("GET", `/api/v1/document-batches?entity_type=horse&entity_id=${id}`),
    api("GET", `/api/v1/horses/${id}/gallery`),
  ]);
  const vList = (Array.isArray(vaccines) ? vaccines : []).slice(0, 5);
  const fList = (Array.isArray(farrierRecords) ? farrierRecords : []).slice(0, 5);
  const dList = (Array.isArray(docs) ? docs : []).slice(0, 5);
  const galleryList = Array.isArray(gallery) ? gallery : [];
  const clientName = clients.find((c) => c.id === h.clientId)?.fullName || "";

  const html = `
    <div style="font-size:13px;line-height:1.6;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div><strong>Nombre:</strong> ${escapeHtml(h.name)}</div>
        <div><strong>Tipo:</strong> ${statusLabel(h.ownershipType)}</div>
        <div><strong>Sexo:</strong> ${statusLabel(h.sex)}</div>
        <div><strong>Color:</strong> ${escapeHtml(h.color)}</div>
        <div><strong>Nacimiento:</strong> ${h.birthDate ? dateLocale(h.birthDate) : "-"}</div>
        <div><strong>Distintivos:</strong> ${escapeHtml(h.distinctiveMarks || "-")}</div>
        <div><strong>Criadero:</strong> ${escapeHtml(h.breedingFarmName || "-")}</div>
        <div><strong>Criador:</strong> ${escapeHtml(h.breederName || "-")}</div>
        <div><strong>Ubicacion:</strong> ${escapeHtml(h.temporaryLocation || "-")}</div>
        <div><strong>Cliente:</strong> ${clientName ? escapeHtml(clientName) : "-"}</div>
        <div><strong>Estado:</strong> <span class="status-pill ${statusClass(h.status)}">${statusLabel(h.status)}</span></div>
        <div><strong>Notas:</strong> ${escapeHtml(h.notes || "-")}</div>
      </div>
      ${galleryList.length ? `<div style="margin-bottom:8px;"><strong>Galeria (${galleryList.length}):</strong>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${galleryList.map((g) => {
          const imgUrl = `/api/v1/uploads/${encodeURIComponent(g.storagePath)}`;
          return `<a href="${imgUrl}" target="_blank"><img src="${imgUrl}?inline=1" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" alt="${escapeHtml(g.title || 'foto')}" onerror="this.style.display='none'"></a>`;
        }).join("")}</div></div>` : ""}
      ${vList.length ? `<div style="margin-bottom:8px;"><strong>Ultimas vacunas (${vList.length}):</strong>
        <table style="margin-top:4px;"><tr><th>Vacuna</th><th>Fecha</th><th>Aplicado por</th></tr>
        ${vList.map((v) => `<tr><td>${escapeHtml(v.vaccineName)}</td><td>${dateLocale(v.applicationDate)}</td><td>${escapeHtml(v.appliedBy || "-")}</td></tr>`).join("")}</table></div>` : ""}
      ${fList.length ? `<div style="margin-bottom:8px;"><strong>Ultimos herrajes (${fList.length}):</strong>
        <table style="margin-top:4px;"><tr><th>Tipo</th><th>Fecha</th></tr>
        ${fList.map((f) => `<tr><td>${escapeHtml(f.description || "-")}</td><td>${dateLocale(f.serviceDate)}</td></tr>`).join("")}</table></div>` : ""}
      ${dList.length ? `<div style="margin-bottom:8px;"><strong>Documentos (${dList.length}):</strong>
        ${dList.map((d) => `<div style="font-size:12px;">${escapeHtml(d.title || d.name)} (${(d.files || d.documents || []).length} archivos)</div>`).join("")}</div>` : ""}
    </div>`;
  modal(`Ficha: ${escapeHtml(h.name)}`, html, null, "", "bi-info-circle", "");
}

function confirmDelete(id) {
  const h = horses.find((item) => item.id === id);
  if (!h) return;
  const html = `<form class="form-grid">
    <p style="grid-column:1/-1;color:var(--danger);">¿Eliminar el caballo <strong>${escapeHtml(h.name)}</strong>?</p>
    <p style="grid-column:1/-1;font-size:13px;color:var(--text-2);">La eliminacion es logica. Si el caballo tiene pension activa o es padre/madre de otro, no se permitira.</p>
    <label class="full">Motivo <input name="reason" type="text" required></label>
  </form>`;
  modal("Eliminar caballo", html, async (fd) => {
    const res = await api("DELETE", `/api/v1/horses/${id}`, { reason: fd.get("reason") });
    if (res && !res.error) {
      showInactive = false;
      const chk = document.getElementById("horse-show-inactive");
      if (chk) chk.checked = false;
      toast("Caballo eliminado", true);
      refresh();
    } else { toast(res?.error?.message || "Error al eliminar"); }
  }, "Eliminar", "bi-trash", "", [{ name: "reason", label: "Motivo", type: "text", required: true }]);
}
