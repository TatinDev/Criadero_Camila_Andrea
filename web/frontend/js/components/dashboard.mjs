import { api, getToken } from "../api.mjs";
import { esc, badge, money, navigate } from "../app.mjs";

export async function renderDashboard(container) {
  const data = await api.get("/dashboard/summary");
  const kpis = data.kpis || {};
  container.innerHTML = `<div class="kpi-grid">
    <article class="kpi-card"><div class="kpi-label">Caballos propios</div><div class="kpi-value">${esc(kpis.ownHorses||0)}</div></article>
    <article class="kpi-card"><div class="kpi-label">Pensionados</div><div class="kpi-value">${esc(kpis.boardedHorses||0)}</div></article>
    <article class="kpi-card"><div class="kpi-label">Clientes activos</div><div class="kpi-value">${esc(kpis.clients||0)}</div></article>
    <article class="kpi-card"><div class="kpi-label">Pensiones activas</div><div class="kpi-value">${esc(kpis.activeStays||0)}</div></article>
    <article class="kpi-card"><div class="kpi-label">Alertas de pago</div><div class="kpi-value">${esc(kpis.dueStays||0)}</div></article>
    <article class="kpi-card"><div class="kpi-label">Pagos registrados</div><div class="kpi-value">${money(kpis.paymentsTotal||0)}</div></article>
  </div>
  <div class="split">
    <div class="card">
      <div class="card-header"><h2>Pensiones activas</h2></div>
      ${renderTable(data.activeStays, [
        {label:"ID", fn:s=>esc(s.code||s.id)},
        {label:"Caballo", fn:s=>esc(s.horseName||s.horseId)},
        {label:"Costo", fn:s=>money(s.monthlyCost)},
        {label:"Estado", fn:s=>badge(s.agreementStatus||s.status)},
      ])}
    </div>
    <div class="card">
      <div class="card-header"><h2>Proximos cuidados</h2></div>
      ${renderTable(data.upcomingCare, [
        {label:"Tipo", fn:c=>esc(c.type)},
        {label:"Fecha", fn:c=>esc(c.date)},
        {label:"Detalle", fn:c=>esc(c.text)},
      ])}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><h2>Actividad reciente</h2></div>
    ${renderTable(data.recentAudit, [
      {label:"Usuario", fn:a=>esc(a.actor_name)},
      {label:"Accion", fn:a=>esc(a.action)},
      {label:"Entidad", fn:a=>esc(a.entity_type)},
      {label:"Importancia", fn:a=>badge(a.importance)},
      {label:"Fecha", fn:a=>esc(new Date(a.created_at).toLocaleString("es-CL"))},
    ])}
  </div>`;
}

function renderTable(items, cols) {
  if (!items || !items.length) return `<div class="empty">Sin datos</div>`;
  return `<div class="table-wrap"><table>
    <thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join("")}</tr></thead>
    <tbody>${items.map(row=>`<tr>${cols.map(c=>`<td>${c.fn(row)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}
