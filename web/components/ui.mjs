export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

export function money(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function dateLocale(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-CL");
}

export function statusLabel(code) {
  const labels = {
    active: "Activo", inactive: "Inactivo", temporary_out: "Fuera temporal",
    in_treatment: "En tratamiento", sold: "Vendido", retired: "Retirado",
    deceased: "Fallecido", in_stay: "En pension", out_of_stay: "Fuera de pension",
    payment_pending: "Pago pendiente", debt: "Con deuda", finished: "Finalizado",
    cancelled: "Anulado", valid: "Valido", pending: "Pendiente",
    accepted: "Aceptada", revoked: "Revocada", expired: "Expirada",
    own: "Propio", boarded: "Pensionado",
    cash: "Efectivo", transfer: "Transferencia",
    client_supplies: "Insumos cliente", included_supplies: "Insumos criadero", mixed: "Mixta", other: "Otro",
    hembra: "Hembra", macho: "Macho", castrado: "Castrado",
    mare: "Hembra", stallion: "Macho", gelding: "Capado",
    trim: "Recorte", shoeing: "Herradura", correction: "Correccion",
    horse: "Caballo", client: "Cliente", boarding_stay: "Pension",
    boarding_payment: "Pago", vaccination: "Vacuna", farrier_record: "Herraje",
    health_treatment: "Tratamiento", document: "Documento", genealogy: "Genealogia",
    user: "Usuario", system: "Sistema", security: "Seguridad",
    horse_gallery: "Galeria", boarding_stay_supply: "Insumo pension",
    create: "Crear", update: "Editar", delete: "Eliminar",
    reactivate: "Reactivar", deactivate: "Desactivar", change_status: "Cambio estado",
    login: "Inicio sesion", logout: "Cierre sesion",
    change_password: "Cambio contrasena",
    create_invitation: "Crear invitacion", accept_invitation: "Aceptar invitacion",
    low: "Baja", medium: "Media", high: "Alta", critical: "Critica",
    all: "Todos", horses: "Caballos", clients: "Clientes", boarding_stays: "Pensiones",
    documents: "Documentos", document_batches: "Documentos",
  };
  return labels[code] || String(code || "");
}

export function statusClass(code) {
  const c = String(code || "");
  if (["active", "valid", "in_stay"].includes(c)) return "status-active";
  if (["inactive", "cancelled", "deceased"].includes(c)) return "status-inactive";
  if (["pending", "payment_pending", "debt"].includes(c)) return "status-pending";
  if (["finished", "accepted"].includes(c)) return "status-finished";
  if (["out_of_stay"].includes(c)) return "status-out_of_stay";
  return "";
}

export function table(headers, rows) {
  if (!rows.length) return `<div class="empty">Sin registros</div>`;
  return `
    <table>
      <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
}

export function validateForm(formEl, fields) {
  const errors = [];
  formEl.querySelectorAll(".field-error").forEach((e) => e.classList.remove("field-error"));

  for (const f of fields) {
    const input = formEl.querySelector(`[name="${f.name}"]`);
    if (!input || !f.required) continue;

    if (input.type === "checkbox") { if (!input.checked) errors.push(f.label); }
    else if (input.type === "file") { if (!input.files?.length && input.hasAttribute("data-required")) errors.push(f.label); }
    else {
      const val = (input.value || "").trim();
      if (!val) errors.push(f.label);
    }
  }

  if (errors.length) {
    errors.forEach((label) => {
      const f = fields.find((fld) => fld.label === label);
      if (f) {
        const input = formEl.querySelector(`[name="${f.name}"]`);
        if (input) input.classList.add("field-error");
      }
    });
    const msg = `Campos requeridos: ${errors.join(", ")}`;
    let summary = formEl.querySelector(".validation-errors");
    if (!summary) {
      summary = document.createElement("div");
      summary.className = "validation-errors";
      formEl.prepend(summary);
    }
    summary.textContent = msg;
    summary.style.display = "block";
    return { valid: false, errors };
  }

  const summary = formEl.querySelector(".validation-errors");
  if (summary) summary.style.display = "none";
  return { valid: true, errors: [] };
}

function liveValidate(formEl, fields) {
  const handler = () => {
    formEl.querySelectorAll(".field-error").forEach((el) => el.classList.remove("field-error"));
    const summary = formEl.querySelector(".validation-errors");
    if (summary) summary.style.display = "none";
    updateSaveButton(formEl, fields);
  };
  formEl.addEventListener("input", handler);
  formEl.addEventListener("change", handler);
}

export function updateSaveButton(formEl, fields) {
  const btn = formEl.closest(".modal-box")?.querySelector(".modal-save");
  if (!btn) return;
  let allOk = true;
  for (const f of fields) {
    if (!f.required) continue;
    const input = formEl.querySelector(`[name="${f.name}"]`);
    if (!input) continue;
    if (input.type === "checkbox") { if (!input.checked) { allOk = false; break; } }
    else if (input.type === "file") { if (!input.files?.length && input.hasAttribute("data-required")) { allOk = false; break; } }
    else { if (!(input.value || "").trim()) { allOk = false; break; } }
  }
  btn.disabled = !allOk;
  btn.style.opacity = allOk ? "1" : ".5";
  btn.style.cursor = allOk ? "pointer" : "not-allowed";
}

export function modal(title, bodyHtml, onSave, saveLabel = "Guardar", icon = "bi-pencil-square", boxClass = "", formFields = null) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const hasAction = typeof onSave === "function";
  overlay.innerHTML = `
    <div class="modal-box ${boxClass}">
      <div class="modal-header">
        <h2><span class="modal-icon"><i class="bi ${icon}"></i></span>${title}</h2>
        <button class="modal-close" title="Cerrar">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-footer">
        <button class="btn ghost modal-cancel">Cerrar</button>
        ${hasAction ? `<button class="btn primary modal-save" ${formFields ? "disabled" : ""} style="${formFields ? "opacity:.5;cursor:not-allowed;" : ""}">${saveLabel}</button>` : ""}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").onclick = close;
  overlay.querySelector(".modal-cancel").onclick = close;

  const form = overlay.querySelector("form");
  const saveBtn = overlay.querySelector(".modal-save");

  if (form && formFields) {
    liveValidate(form, formFields);
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const f = overlay.querySelector("form");
      if (f && formFields) {
        const result = validateForm(f, formFields);
        if (!result.valid) {
          const btn = overlay.querySelector(".modal-save");
          if (btn) { btn.disabled = true; btn.style.opacity = ".5"; btn.style.cursor = "not-allowed"; }
          return;
        }
      }
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Guardando...";
        await onSave(f ? new FormData(f) : new FormData());
      } catch (e) {
        console.error("Modal save error:", e);
      }
      overlay.remove();
    };
  }
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  return overlay;
}

export function toast(message, success = false) {
  const node = document.createElement("div");
  node.className = "toast" + (success ? " success" : "");
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3500);
}

export function fieldHtml(field, value, options = {}) {
  const val = value ?? field.default ?? "";
  const req = field.required ? "required" : "";
  const cls = field.full ? "full" : "";

  if (field.type === "select") {
    const opts = field.options.map((o) => {
      const v = typeof o === "object" ? o.value : o;
      const l = typeof o === "object" ? o.label : o;
      return `<option value="${escapeHtml(v)}" ${val === v ? "selected" : ""}>${escapeHtml(l)}</option>`;
    }).join("");
    const asterisk = field.required ? " <span class='req'>*</span>" : "";
    return `<label class="${cls}"><span>${field.label}${asterisk}</span><select name="${field.name}" ${req}>${opts}</select></label>`;
  }
  if (field.type === "textarea") {
    const asterisk = field.required ? " <span class='req'>*</span>" : "";
    return `<label class="${cls}"><span>${field.label}${asterisk}</span><textarea name="${field.name}" ${req} placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(val)}</textarea></label>`;
  }
  if (field.type === "file") {
    const dataReq = field.required ? "data-required='true'" : "";
    const asterisk = field.required ? " <span class='req'>*</span>" : "";
    return `<label class="${cls}"><span>${field.label}${asterisk}</span><input name="${field.name}" type="file" ${field.multiple ? "multiple" : ""} ${dataReq}></label>`;
  }
  if (field.type === "relation") {
    const relOpts = (options.relations || []).map((r) => `<option value="${escapeHtml(r.id)}" ${val === r.id ? "selected" : ""}>${escapeHtml(r.label)}</option>`).join("");
    const asterisk = field.required ? " <span class='req'>*</span>" : "";
    return `<label class="${cls}"><span>${field.label}${asterisk}</span><select name="${field.name}" ${req}><option value="">Sin asignar</option>${relOpts}</select></label>`;
  }
  const inputType = field.type === "money" || field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text";
  const min = field.min !== undefined ? `min="${field.min}"` : "";
  const asterisk = field.required ? " <span class='req'>*</span>" : "";
  return `<label class="${cls}"><span>${field.label}${asterisk}</span><input name="${field.name}" type="${inputType}" value="${escapeHtml(val)}" ${req} ${min} placeholder="${escapeHtml(field.placeholder || "")}"></label>`;
}

export function formFieldsHtml(fields, values, relations = {}) {
  return fields.map((f) => fieldHtml(f, values?.[f.name], { relations: relations[f.name] })).join("");
}
