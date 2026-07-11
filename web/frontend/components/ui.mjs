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
    own: "Propio", boarded: "Pensionado",
    cash: "Efectivo", transfer: "Transferencia",
    client_supplies: "Insumos cliente", included_supplies: "Insumos criadero", mixed: "Mixta", other: "Otro",
    hembra: "Hembra", macho: "Macho", castrado: "Castrado",
    trim: "Recorte", shoeing: "Herradura", correction: "Correccion",
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

export function modal(title, bodyHtml, onSave, saveLabel = "Guardar") {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <h2>${title}</h2>
      ${bodyHtml}
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
        <button class="btn ghost modal-cancel">Cancelar</button>
        <button class="btn primary modal-save">${saveLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".modal-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".modal-save").onclick = async () => {
    const data = onSave(new FormData(overlay.querySelector("form")));
    overlay.remove();
    return data;
  };
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
    return `<label class="${cls}">${field.label}<select name="${field.name}" ${req}>${opts}</select></label>`;
  }
  if (field.type === "textarea") {
    return `<label class="${cls}">${field.label}<textarea name="${field.name}" ${req} placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(val)}</textarea></label>`;
  }
  if (field.type === "file") {
    return `<label class="${cls}">${field.label}<input name="${field.name}" type="file" ${field.multiple ? "multiple" : ""}></label>`;
  }
  if (field.type === "relation") {
    const relOpts = (options.relations || []).map((r) => `<option value="${escapeHtml(r.id)}" ${val === r.id ? "selected" : ""}>${escapeHtml(r.label)}</option>`).join("");
    return `<label class="${cls}">${field.label}<select name="${field.name}" ${req}><option value="">Sin asignar</option>${relOpts}</select></label>`;
  }
  const inputType = field.type === "money" || field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text";
  const min = field.min !== undefined ? `min="${field.min}"` : "";
  return `<label class="${cls}">${field.label}<input name="${field.name}" type="${inputType}" value="${escapeHtml(val)}" ${req} ${min} placeholder="${escapeHtml(field.placeholder || "")}"></label>`;
}

export function formFieldsHtml(fields, values, relations = {}) {
  return fields.map((f) => fieldHtml(f, values?.[f.name], { relations: relations[f.name] })).join("");
}
