import { api } from "../api.mjs";
import { escapeHtml, statusLabel, modal } from "../components/ui.mjs";
import { setCurrentView } from "../app.mjs";

let logs = [];
let auditFilters = { entity: "", action: "", importance: "", eventType: "", actorName: "", dateFrom: "", dateTo: "" };
let showLow = false;
let sortBy = "date";
let sortDir = "desc";

function field(obj, camel, snake) { return obj[camel] ?? obj[snake] ?? ""; }

function ts(obj, camel, snake) { return new Date(field(obj, camel, snake)).getTime() || 0; }

function importanceOrder(v) { return { critical: 4, high: 3, medium: 2, low: 1 }[v] || 0; }

export async function render() {
  const res = await api("GET", "/api/v1/audit-logs");
  logs = (Array.isArray(res) ? res : []);

  const entityTypes = [...new Set(logs.map((l) => field(l, "entityType", "entity_type")).filter(Boolean))];
  const actions = [...new Set(logs.map((l) => l.action).filter(Boolean))];
  const importances = [...new Set(logs.map((l) => field(l, "importance", "importance")).filter(Boolean))];
  const actorNames = [...new Set(logs.map((l) => field(l, "actorName", "actor_name")).filter(Boolean))];

  let filtered = logs.filter((l) => {
    const et = field(l, "entityType", "entity_type");
    if (auditFilters.entity && et !== auditFilters.entity) return false;
    if (auditFilters.action && l.action !== auditFilters.action) return false;
    if (auditFilters.importance && field(l, "importance", "importance") !== auditFilters.importance) return false;
    if (auditFilters.eventType && (field(l, "eventType", "event_type") !== auditFilters.eventType && l.eventType?.code !== auditFilters.eventType)) return false;
    if (auditFilters.actorName && field(l, "actorName", "actor_name") !== auditFilters.actorName) return false;
    if (!auditFilters.importance && !showLow && field(l, "importance", "importance") === "low") return false;
    if (auditFilters.dateFrom) { const d = ts(l, "createdAt", "created_at"); if (d < new Date(auditFilters.dateFrom).getTime()) return false; }
    if (auditFilters.dateTo) { const d = ts(l, "createdAt", "created_at"); if (d > new Date(auditFilters.dateTo + "T23:59:59").getTime()) return false; }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === "date") return sortDir === "desc" ? ts(b, "createdAt", "created_at") - ts(a, "createdAt", "created_at") : ts(a, "createdAt", "created_at") - ts(b, "createdAt", "created_at");
    if (sortBy === "importance") return sortDir === "desc" ? importanceOrder(field(b, "importance", "importance")) - importanceOrder(field(a, "importance", "importance")) : importanceOrder(field(a, "importance", "importance")) - importanceOrder(field(b, "importance", "importance"));
    return 0;
  });

  return `
    <div class="card">
      <div class="card-header">
        <h2>Historial / Auditoria</h2>
        <span class="status-pill status-active">${filtered.length} de ${logs.length} eventos${!showLow ? " (sin low)" : ""}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
        <select id="audit-filter-entity" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px;min-width:120px;">
          <option value="">Tipo entidad</option>
          ${entityTypes.map((t) => `<option value="${t}" ${auditFilters.entity === t ? "selected" : ""}>${statusLabel(t)}</option>`).join("")}
        </select>
        <select id="audit-filter-action" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px;min-width:100px;">
          <option value="">Accion</option>
          ${actions.map((a) => `<option value="${a}" ${auditFilters.action === a ? "selected" : ""}>${escapeHtml(a)}</option>`).join("")}
        </select>
        <select id="audit-filter-importance" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px;min-width:120px;">
          <option value="">Importancia</option>
          ${importances.map((i) => `<option value="${i}" ${auditFilters.importance === i ? "selected" : ""}>${statusLabel(i)}</option>`).join("")}
        </select>
        <select id="audit-filter-eventtype" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px;min-width:120px;">
          <option value="">Tipo evento</option>
          ${entityTypes.map((t) => `<option value="${t}" ${auditFilters.eventType === t ? "selected" : ""}>${statusLabel(t)}</option>`).join("")}
        </select>
        <select id="audit-filter-actor" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px;min-width:100px;">
          <option value="">Usuario</option>
          ${actorNames.map((n) => `<option value="${n}" ${auditFilters.actorName === n ? "selected" : ""}>${escapeHtml(n)}</option>`).join("")}
        </select>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);white-space:nowrap;">
          Desde: <input type="date" id="audit-filter-datefrom" value="${auditFilters.dateFrom}" style="padding:4px 6px;border:none;background:transparent;font-size:13px;outline:none;">
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);white-space:nowrap;">
          Hasta: <input type="date" id="audit-filter-dateto" value="${auditFilters.dateTo}" style="padding:4px 6px;border:none;background:transparent;font-size:13px;outline:none;">
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);white-space:nowrap;">
          <input type="checkbox" id="audit-show-low" ${showLow ? "checked" : ""}> Baja
        </label>
        <button class="btn ghost small" id="audit-sort-date" style="min-width:90px;text-align:center;">${sortBy === "date" ? (sortDir === "desc" ? "Fecha ↓" : "Fecha ↑") : "Fecha"}</button>
        <button class="btn ghost small" id="audit-sort-importance" style="min-width:90px;text-align:center;">${sortBy === "importance" ? (sortDir === "desc" ? "Importancia ↓" : "Importancia ↑") : "Importancia"}</button>
        ${(auditFilters.entity || auditFilters.action || auditFilters.importance) ? `<button class="btn ghost small" id="audit-clear-filters" style="min-width:90px;">Limpiar</button>` : ""}
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Accion</th><th>Entidad</th></tr></thead>
          <tbody>${filtered.map((l) => {
            const date = new Date(field(l, "createdAt", "created_at")).toLocaleString("es-CL");
            const name = escapeHtml(field(l, "actorName", "actor_name"));
            const role = statusLabel(field(l, "actorRole", "actor_role"));
            const action = escapeHtml(l.action);
            const et = field(l, "entityType", "entity_type");
            const eid = (field(l, "entityId", "entity_id")).slice(0, 12);
            return `
            <tr style="cursor:pointer;" data-audit-detail="${l.id}">
              <td style="white-space:nowrap;">${escapeHtml(date)}</td>
              <td><strong>${name}</strong><br><small style="color:var(--text-2);">${role}</small></td>
              <td>${action}</td>
              <td style="color:var(--brand);">${escapeHtml(et)}:${escapeHtml(eid)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
        ${filtered.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--text-2);">Sin eventos.</div>` : ""}
      </div>
    </div>
  `;
}

function showAuditDetail(id) {
  const l = logs.find((item) => item.id === id);
  if (!l) return;

  const date = new Date(field(l, "createdAt", "created_at")).toLocaleString("es-CL");
  const action = l.action || "";
  const entityType = field(l, "entityType", "entity_type");
  const entityId = field(l, "entityId", "entity_id").slice(0, 12);
  const actor = escapeHtml(field(l, "actorName", "actor_name"));
  const role = statusLabel(field(l, "actorRole", "actor_role"));
  const reason = l.reason || l.details || "";
  const before = l.before || null;
  const after = l.after || null;

  function val(v) { return v ?? "(vacio)"; }
  function safeStr(v) { return typeof v === "object" ? JSON.stringify(v) : String(v ?? ""); }
  function fieldRow(label, v) { return v ? `<div><strong>${label}:</strong> ${escapeHtml(safeStr(v))}</div>` : ""; }

  let body = "";

  if (action === "create" || action === "register") {
    body = `<div style="margin-bottom:12px;padding:10px;background:var(--surface-2);border-radius:8px;border-left:3px solid var(--success);">`;
    body += `<div style="font-size:13px;font-weight:600;color:var(--success);margin-bottom:8px;"><i class="bi bi-plus-circle"></i> Registro creado</div>`;
    if (after) {
      const fields = Object.entries(after).filter(([k, v]) => v !== null && v !== undefined && !k.endsWith("Id") && !k.endsWith("At") && k !== "id" && k !== "createdAt" && k !== "updatedAt" && !k.startsWith("_"));
      fields.slice(0, 10).forEach(([k, v]) => { body += fieldRow(statusLabel(k), typeof v === "object" ? (v.name || v.code || v.label || JSON.stringify(v)) : v); });
    }
    body += `</div>`;

  } else if (action === "update") {
    body = `<div style="margin-bottom:12px;">`;
    if (before && after) {
      const changes = [];
      Object.keys({ ...before, ...after }).forEach((k) => {
        if (k === "id" || k === "createdAt" || k === "updatedAt" || k.endsWith("Id")) return;
        const b = safeStr(before[k]);
        const a = safeStr(after[k]);
        if (b !== a) changes.push({ field: k, from: b, to: a });
      });
      if (changes.length) {
        body += `<strong style="color:var(--warning);margin-bottom:8px;display:block;"><i class="bi bi-pencil"></i> Campos modificados (${changes.length})</strong>`;
        body += `<table style="font-size:12px;width:100%;border-collapse:collapse;"><tr><th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--border);">Campo</th><th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--border);">Antes</th><th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--border);">Despues</th></tr>`;
        changes.forEach((c) => {
          body += `<tr><td style="padding:4px 8px;border-bottom:1px solid var(--border);font-weight:600;">${statusLabel(c.field)}</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);color:var(--danger);">${escapeHtml(c.from.slice(0, 80))}</td><td style="padding:4px 8px;border-bottom:1px solid var(--border);color:var(--success);">${escapeHtml(c.to.slice(0, 80))}</td></tr>`;
        });
        body += `</table>`;
      } else {
        body += `<div style="color:var(--text-2);">Sin cambios detectados.</div>`;
      }
    } else {
      body += `<div style="color:var(--text-2);">Datos de antes/despues no disponibles.</div>`;
    }
    body += `</div>`;

  } else if (action === "cancel" || action === "delete" || action === "anular") {
    body = `<div style="margin-bottom:12px;padding:10px;background:var(--surface-2);border-radius:8px;border-left:3px solid var(--danger);">`;
    body += `<div style="font-size:13px;font-weight:600;color:var(--danger);margin-bottom:8px;"><i class="bi bi-x-circle"></i> Registro ${action === "delete" ? "eliminado" : "anulado"}</div>`;
    if (reason) body += `<div style="background:var(--danger-soft);padding:10px;border-radius:6px;margin-top:4px;"><strong>Motivo:</strong> ${escapeHtml(reason)}</div>`;
    if (after && after.reason && after.reason !== reason) body += `<div style="margin-top:4px;"><strong>Detalle adicional:</strong> ${escapeHtml(after.reason)}</div>`;
    body += `</div>`;

  } else if (action === "change_status" || action === "deactivate" || action === "activate" || action === "reactivate") {
    body = `<div style="margin-bottom:12px;">`;
    body += `<div style="font-size:13px;font-weight:600;color:var(--warning);margin-bottom:8px;"><i class="bi bi-arrow-repeat"></i> Cambio de estado</div>`;
    if (before && after) {
      const oldSt = before.statusName || before.status || safeStr(before);
      const newSt = after.statusName || after.status || safeStr(after);
      body += `<div style="display:flex;gap:12px;align-items:center;"><span class="status-pill">${escapeHtml(oldSt)}</span> <i class="bi bi-arrow-right"></i> <span class="status-pill status-active">${escapeHtml(newSt)}</span></div>`;
    }
    if (reason) body += `<div style="margin-top:8px;"><strong>Motivo:</strong> ${escapeHtml(reason)}</div>`;
    body += `</div>`;

  } else if (action === "finish") {
    body = `<div style="margin-bottom:12px;padding:10px;background:var(--surface-2);border-radius:8px;border-left:3px solid var(--brand);">`;
    body += `<div style="font-size:13px;font-weight:600;color:var(--brand);margin-bottom:8px;"><i class="bi bi-check-circle"></i> Pension finalizada</div>`;
    if (after) {
      Object.entries(after).filter(([k]) => k === "actualExitDate" || k === "exitDate" || k === "finishDate").forEach(([k, v]) => { body += fieldRow("Fecha salida", v); });
    }
    if (reason) body += `<div><strong>Motivo:</strong> ${escapeHtml(reason)}</div>`;
    body += `</div>`;

  } else if (action === "create_invitation" || action === "accept_invitation") {
    body = `<div style="margin-bottom:12px;padding:10px;background:var(--surface-2);border-radius:8px;border-left:3px solid var(--info);">`;
    body += `<div style="font-size:13px;font-weight:600;margin-bottom:8px;"><i class="bi bi-envelope"></i> ${action === "create_invitation" ? "Invitacion creada" : "Invitacion aceptada"}</div>`;
    if (after) {
      if (after.email) body += fieldRow("Email", after.email);
      if (after.role) body += fieldRow("Rol", after.role);
    }
    if (reason) body += `<div><strong>Detalle:</strong> ${escapeHtml(reason)}</div>`;
    body += `</div>`;

  } else if (action === "login" || action === "logout") {
    body = `<div style="padding:10px;background:var(--surface-2);border-radius:8px;">`;
    body += `<div style="font-size:13px;"><i class="bi bi-${action === 'login' ? 'box-arrow-in-right' : 'box-arrow-right'}"></i> ${action === "login" ? "Inicio de sesion" : "Cierre de sesion"}</div>`;
    body += `</div>`;

  } else {
    body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">`;
    body += `<div><strong style="color:var(--danger);">Antes</strong><pre style="background:var(--surface-2);padding:10px;border-radius:6px;font-size:11px;max-height:300px;overflow:auto;margin-top:4px;">${before ? escapeHtml(JSON.stringify(before, null, 2).slice(0, 500)) : "(sin datos)"}</pre></div>`;
    body += `<div><strong style="color:var(--success);">Despues</strong><pre style="background:var(--surface-2);padding:10px;border-radius:6px;font-size:11px;max-height:300px;overflow:auto;margin-top:4px;">${after ? escapeHtml(JSON.stringify(after, null, 2).slice(0, 500)) : "(sin datos)"}</pre></div>`;
    body += `</div>`;
  }

  if (reason && !["cancel", "delete", "anular", "change_status", "deactivate", "activate", "reactivate", "finish"].includes(action)) {
    body += `<div style="margin-top:12px;"><strong>Motivo:</strong> ${escapeHtml(reason)}</div>`;
  }

  const html = `
    <div style="font-size:13px;line-height:1.6;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div><strong>Fecha:</strong> ${escapeHtml(date)}</div>
        <div><strong>Usuario:</strong> ${actor} (${role})</div>
        <div><strong>Accion:</strong> ${escapeHtml(action)}</div>
        <div><strong>Entidad:</strong> ${escapeHtml(entityType)}:${escapeHtml(entityId)}</div>
      </div>
      ${body}
    </div>`;
  modal("Detalle de auditoria", html, null, null, "bi-journal-text");
}

export function bind() {
  document.getElementById("audit-filter-entity")?.addEventListener("change", (e) => { auditFilters.entity = e.target.value; refresh(); });
  document.getElementById("audit-filter-action")?.addEventListener("change", (e) => { auditFilters.action = e.target.value; refresh(); });
  document.getElementById("audit-filter-importance")?.addEventListener("change", (e) => { auditFilters.importance = e.target.value; refresh(); });
  document.getElementById("audit-filter-eventtype")?.addEventListener("change", (e) => { auditFilters.eventType = e.target.value; refresh(); });
  document.getElementById("audit-filter-actor")?.addEventListener("change", (e) => { auditFilters.actorName = e.target.value; refresh(); });
  document.getElementById("audit-filter-datefrom")?.addEventListener("change", (e) => { auditFilters.dateFrom = e.target.value; refresh(); });
  document.getElementById("audit-filter-dateto")?.addEventListener("change", (e) => { auditFilters.dateTo = e.target.value; refresh(); });
  document.getElementById("audit-show-low")?.addEventListener("change", (e) => { showLow = e.target.checked; refresh(); });
  document.getElementById("audit-sort-date")?.addEventListener("click", () => { if (sortBy === "date") { sortDir = sortDir === "desc" ? "asc" : "desc"; } else { sortBy = "date"; sortDir = "desc"; } refresh(); });
  document.getElementById("audit-sort-importance")?.addEventListener("click", () => { if (sortBy === "importance") { sortDir = sortDir === "desc" ? "asc" : "desc"; } else { sortBy = "importance"; sortDir = "desc"; } refresh(); });
  document.getElementById("audit-clear-filters")?.addEventListener("click", () => { auditFilters = { entity: "", action: "", importance: "", eventType: "", actorName: "", dateFrom: "", dateTo: "" }; refresh(); });
  document.querySelectorAll("[data-audit-detail]").forEach((el) => {
    el.addEventListener("click", () => showAuditDetail(el.dataset.auditDetail));
  });
}

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }
