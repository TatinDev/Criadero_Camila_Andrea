import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, money, dateLocale } from "../components/ui.mjs";

let horses = [];

function horseName(id) { return horses.find((h) => h.id === id)?.name || id; }

export async function render() {
  const [summaryRaw, horseList, vaccs, farriers, docs] = await Promise.all([
    api("GET", "/api/v1/dashboard/summary"),
    api("GET", "/api/v1/horses"),
    api("GET", "/api/v1/vaccinations"),
    api("GET", "/api/v1/farrier-records"),
    api("GET", "/api/v1/document-batches"),
  ]);
  const summary = (summaryRaw && !summaryRaw.error) ? summaryRaw : {};
  horses = Array.isArray(horseList) ? horseList : [];
  const vList = (Array.isArray(vaccs) ? vaccs : []).sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate)).slice(0, 5);
  const fList = (Array.isArray(farriers) ? farriers : []).sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)).slice(0, 5);
  const docList = (Array.isArray(docs) ? docs : []).slice(0, 5);

  const k = summary.kpis || {};
  const kpis = [
    ["Caballos propios", k.ownHorses],
    ["Pensionados", k.boardedHorses],
    ["Clientes activos", k.clients],
    ["Pensiones activas", k.activeStays],
    ["Alertas de pago", k.dueStays],
    ["Pagos validos", money(k.paymentsTotal)],
  ];

  const stays = summary.latestStays || [];
  const audit = summary.latestAudit || summary.recentAudit || [];

  return `
    <div class="kpi-grid">${kpis.map(([l, v]) => `<div class="kpi" data-dash-nav="${navForKpi(l)}"><span>${escapeHtml(l)}</span><strong>${escapeHtml(String(v ?? 0))}</strong></div>`).join("")}</div>
    <div style="text-align:center;margin-bottom:12px;">
      <button class="btn ghost small" data-dash-nav="search" style="font-size:13px;"><i class="bi bi-search"></i> Buscar caballo o cliente</button>
    </div>
    <div class="split-2">
      <div class="card">
        <div class="card-header"><h2>Pensiones activas</h2></div>
        <table>
          <thead><tr><th>ID</th><th>Caballo</th><th>Costo</th><th>Estado</th></tr></thead>
          <tbody>${stays.map((s) => `
            <tr>
              <td><strong style="cursor:pointer;color:var(--brand);font-weight:600" data-dash-nav="boarding">${escapeHtml(s.code)}</strong></td>
              <td>${escapeHtml(horseName(s.horseId || s.horse?.id))}</td>
              <td>${money(s.monthlyCost || s.boardingCost)}</td>
              <td><span class="status-pill ${statusClass(s.agreementStatus)}">${statusLabel(s.agreementStatus)}</span></td>
            </tr>`).join("")}</tbody>
        </table>
        ${stays.length === 0 ? '<div class="empty">Sin pensiones activas</div>' : ''}
      </div>
      <div class="card">
        <div class="card-header"><h2>Ultimas vacunas</h2></div>
        <table>
          <thead><tr><th>Caballo</th><th>Vacuna</th><th>Fecha</th></tr></thead>
          <tbody>${vList.map((v) => `
            <tr>
              <td>${escapeHtml(horseName(v.horseId || v.horse?.id))}</td>
              <td>${escapeHtml(v.vaccineName)}</td>
              <td>${dateLocale(v.applicationDate || v.appliedAt)}</td>
            </tr>`).join("")}</tbody>
        </table>
        ${vList.length === 0 ? '<div class="empty">Sin vacunas registradas</div>' : ''}
      </div>
    </div>
    <div class="split-2">
      <div class="card">
        <div class="card-header"><h2>Ultimos herrajes</h2></div>
        <table>
          <thead><tr><th>Caballo</th><th>Tipo</th><th>Fecha</th></tr></thead>
          <tbody>${fList.map((f) => `
            <tr>
              <td>${escapeHtml(horseName(f.horseId || f.horse?.id))}</td>
              <td>${statusLabel(f.serviceType || f.description)}</td>
              <td>${dateLocale(f.serviceDate)}</td>
            </tr>`).join("")}</tbody>
        </table>
        ${fList.length === 0 ? '<div class="empty">Sin herrajes registrados</div>' : ''}
      </div>
      <div class="card">
        <div class="card-header"><h2>Actividad reciente</h2></div>
        <table>
          <thead><tr><th>Usuario</th><th>Accion</th><th>Entidad</th><th>Fecha</th></tr></thead>
          <tbody>${audit.map((a) => `
            <tr>
              <td>${escapeHtml(a.actorName || a.actor_name)}</td>
              <td>${escapeHtml(a.action)}</td>
              <td>${escapeHtml(a.entityType || a.entity_type)}:${escapeHtml((a.entityId || a.entity_id || "").toString().slice(0, 8))}</td>
              <td>${escapeHtml(new Date(a.createdAt || a.created_at).toLocaleString("es-CL"))}</td>
            </tr>`).join("")}</tbody>
        </table>
        ${audit.length === 0 ? '<div class="empty">Sin actividad</div>' : ''}
      </div>
    </div>
    <div class="split-2">
      <div class="card">
        <div class="card-header"><h2>Ultimos documentos</h2></div>
        <table>
          <thead><tr><th>Nombre</th><th>Entidad</th><th>Archivos</th><th>Fecha</th></tr></thead>
          <tbody>${docList.map((d) => `
            <tr>
              <td><strong style="cursor:pointer;color:var(--brand);font-weight:600" data-dash-nav="documents">${escapeHtml(d.title || d.name)}</strong></td>
              <td>${escapeHtml(d.entityType || "")}</td>
              <td>${(d.files || d.documents || []).length} archivos</td>
              <td>${dateLocale(d.createdAt)}</td>
            </tr>`).join("")}</tbody>
        </table>
        ${docList.length === 0 ? '<div class="empty">Sin documentos subidos</div>' : ''}
      </div>
    </div>
  `;
}

function navForKpi(label) {
  const map = { "Caballos propios": "horses", "Pensionados": "horses", "Clientes activos": "clients", "Pensiones activas": "boarding", "Alertas de pago": "payments", "Pagos validos": "payments" };
  return map[label] || "";
}

import { setCurrentView } from "../app.mjs";

export function bind() {
  document.querySelectorAll("[data-dash-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const module = e.currentTarget.dataset.dashNav;
      if (module) setCurrentView(module);
    });
  });
}
