import { api } from "../api.mjs";
import { esc, badge } from "../app.mjs";

export async function renderAudit(container) {
  const logs = await api.get("/audit-logs");
  const filterTypes = ["horse","client","boarding_stay","boarding_payment","vaccination","farrier_record","document","genealogy","security","system"];
  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Historial de acciones</h2></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px" id="audit-filters">
      <input placeholder="Buscar usuario..." id="audit-user" style="width:200px">
      <select id="audit-type"><option value="">Todos los tipos</option>${filterTypes.map(t => `<option value="${t}">${t}</option>`).join("")}</select>
      <select id="audit-importance"><option value="">Todas</option>${["low","medium","high","critical"].map(t => `<option value="${t}">${t}</option>`).join("")}</select>
    </div>
    <div id="audit-table">
    <div class="table-wrap"><table>
      <thead><tr><th>Usuario</th><th>Accion</th><th>Entidad</th><th>Importancia</th><th>Fecha</th></tr></thead>
      <tbody>${logs.slice().reverse().map(l => `<tr>
        <td>${esc(l.actor_name)}</td><td>${esc(l.action)}</td>
        <td><span class="mono">${esc(l.entity_type)}:${esc(l.entity_id)}</span></td>
        <td>${badge(l.importance)}</td>
        <td>${esc(new Date(l.created_at).toLocaleString("es-CL"))}</td>
      </tr>`).join("")}</tbody>
    </table></div>
    </div>
  </div>`;
  container.querySelector("#audit-user")?.addEventListener("input", filter);
  container.querySelector("#audit-type")?.addEventListener("change", filter);
  container.querySelector("#audit-importance")?.addEventListener("change", filter);
  function filter() {
    const user = (container.querySelector("#audit-user").value||"").toLowerCase();
    const type = container.querySelector("#audit-type").value;
    const imp = container.querySelector("#audit-importance").value;
    const rows = container.querySelectorAll("#audit-table tbody tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const show = (!user || text.includes(user)) && (!type || text.includes(type)) && (!imp || text.includes(imp));
      row.style.display = show ? "" : "none";
    });
  }
}
