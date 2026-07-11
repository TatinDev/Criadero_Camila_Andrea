import { api } from "../api.mjs";
import { money, escapeHtml, statusLabel, statusClass, table } from "../components/ui.mjs";

export async function render() {
  const summary = await api("GET", "/api/v1/dashboard/summary") || {};
  const k = summary.kpis || {};
  const kpis = [
    ["Caballos propios", k.ownHorses],
    ["Pensionados", k.boardedHorses],
    ["Clientes activos", k.clients],
    ["Pensiones activas", k.activeStays],
    ["Alertas de pago", k.dueStays],
    ["Pagos validos", money(k.paymentsTotal)],
  ];

  const stays = summary.activeStays || [];
  const care = summary.upcomingCare || [];
  const audit = summary.recentAudit || [];

  return `
    <div class="kpi-grid">${kpis.map(([l, v]) => `<div class="kpi"><span>${escapeHtml(l)}</span><strong>${escapeHtml(String(v ?? 0))}</strong></div>`).join("")}</div>
    <div class="split-2">
      <div class="card">
        <div class="card-header"><h2>Pensiones activas</h2></div>
        ${table(["ID", "Caballo", "Costo", "Estado"], stays.map((s) => [
          `<span data-href="boarding" style="cursor:pointer;color:var(--brand);font-weight:600">${escapeHtml(s.code)}</span>`,
          escapeHtml(s.horseId),
          money(s.monthlyCost),
          `<span class="status-pill ${statusClass(s.agreementStatus)}">${statusLabel(s.agreementStatus)}</span>`,
        ]))}
      </div>
      <div class="card">
        <div class="card-header"><h2>Cuidados recientes</h2></div>
        ${table(["Tipo", "Caballo", "Fecha"], care.map((c) => [
          escapeHtml(c.type),
          escapeHtml(c.horseId),
          escapeHtml(c.date),
        ]))}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h2>Actividad reciente</h2></div>
      ${table(["Usuario", "Accion", "Entidad", "Fecha"], audit.map((a) => [
        escapeHtml(a.actor_name),
        escapeHtml(a.action),
        `${escapeHtml(a.entity_type)}:${escapeHtml(a.entity_id)}`,
        escapeHtml(new Date(a.created_at).toLocaleString("es-CL")),
      ]))}
    </div>
  `;
}
