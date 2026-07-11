import { api } from "../api.mjs";
import { escapeHtml, statusLabel, table } from "../components/ui.mjs";

let logs = [];

export async function render() {
  const res = await api("GET", "/api/v1/audit-logs");
  logs = Array.isArray(res) ? res : [];
  logs.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return `
    <div class="card">
      <div class="card-header">
        <h2>Historial / Auditoria</h2>
        <span class="status-pill status-active">${logs.length} eventos</span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Usuario</th><th>Rol</th><th>Accion</th><th>Entidad</th><th>Importancia</th><th>Fecha</th></tr></thead>
          <tbody>${logs.map((l) => `
            <tr>
              <td><strong>${escapeHtml(l.actor_name)}</strong></td>
              <td>${statusLabel(l.actor_role)}</td>
              <td>${escapeHtml(l.action)}</td>
              <td>${escapeHtml(l.entity_type)}:${escapeHtml(l.entity_id)}</td>
              <td>${escapeHtml(l.importance)}</td>
              <td>${new Date(l.created_at).toLocaleString("es-CL")}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function bind() {}
