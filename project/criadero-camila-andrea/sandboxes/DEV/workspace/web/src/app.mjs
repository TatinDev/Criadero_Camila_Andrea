import { CriaderoApi, createStore, dashboard, genealogyTree, search } from "./criadero-core.mjs";
import { MODULES, STATUS_LABELS, money } from "./domain.mjs";

const store = createStore();
let actor = store.getState().users[0];
let api = new CriaderoApi(store, actor);
let activeView = "dashboard";
let editing = null;
let searchText = "";
const app = document.querySelector("#app");

function render() {
  const state = store.getState();
  actor = state.users.find((item) => item.id === actor.id) || state.users[0];
  api = new CriaderoApi(store, actor);
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">CA</div>
        <div>
          <strong>Criadero Camila Andrea</strong>
          <small>Gestion privada interna</small>
        </div>
      </div>
      <label class="actor">Sesion
        <select data-actor>
          ${state.users.filter((user) => user.status === "active").map((user) => `<option value="${user.id}" ${user.id === actor.id ? "selected" : ""}>${escapeHtml(user.name)} · ${user.role}</option>`).join("")}
        </select>
      </label>
      <nav class="nav">
        ${nav("dashboard", "Panel")}
        ${nav("search", "Buscador")}
        ${MODULES.map((module) => nav(module.id, module.label)).join("")}
        ${nav("genealogy", "Genealogia")}
        ${nav("audit", "Auditoria")}
        ${nav("consumption", "Consumo")}
      </nav>
      <button class="ghost wide" data-reset>Restaurar demo</button>
    </aside>
    <main class="main">
      ${topbar(state)}
      ${view(state)}
    </main>
  `;
  bind();
}

function nav(id, label) {
  return `<button class="nav-item ${activeView === id ? "active" : ""}" data-nav="${id}">${label}</button>`;
}

function topbar(state) {
  const module = MODULES.find((item) => item.id === activeView);
  const title = module?.label || ({ dashboard: "Panel operativo", search: "Buscador global", audit: "Historial auditable", consumption: "Registro de consumo", genealogy: "Arbol genealogico" }[activeView]);
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">/api/v1 · ARNES · local only · ${escapeHtml(actor.role)}</p>
        <h1>${title}</h1>
      </div>
      <div class="toolbar">
        <span class="pill">${state.auditLogs.length} eventos</span>
        <span class="pill">${state.consumption.length} ciclos</span>
      </div>
    </header>
  `;
}

function view(state) {
  if (activeView === "dashboard") return renderDashboard(state);
  if (activeView === "search") return renderSearch(state);
  if (activeView === "audit") return renderAudit(state);
  if (activeView === "consumption") return renderConsumption(state);
  if (activeView === "genealogy") return renderGenealogy(state);
  const module = MODULES.find((item) => item.id === activeView);
  return renderCrud(module, state);
}

function renderDashboard(state) {
  const summary = dashboard(state);
  const kpis = [
    ["Caballos propios", summary.kpis.ownHorses],
    ["Pensionados", summary.kpis.boardedHorses],
    ["Clientes activos", summary.kpis.clients],
    ["Pensiones activas", summary.kpis.activeStays],
    ["Alertas pago", summary.kpis.dueStays],
    ["Pagos validos", money(summary.kpis.paymentsTotal)]
  ];
  return `
    <section class="kpi-grid">${kpis.map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`).join("")}</section>
    <section class="split">
      <div class="panel">
        <h2>Pensiones activas</h2>
        ${summary.activeStays.length ? table(["ID", "Caballo", "Cliente", "Costo", "Estado"], summary.activeStays.map((stay) => [stay.code, horseName(state, stay.horseId), clientName(state, stay.clientId), money(stay.monthlyCost), label(stay.agreementStatus)])) : empty("Sin pensiones activas")}
      </div>
      <div class="panel">
        <h2>Cuidados recientes</h2>
        ${summary.upcomingCare.length ? table(["Tipo", "Caballo", "Fecha", "Detalle"], summary.upcomingCare.map((item) => [item.type, horseName(state, item.horseId), item.date, item.text])) : empty("Sin cuidados registrados")}
      </div>
    </section>
    <section class="panel">
      <h2>Actividad reciente</h2>
      ${summary.recentAudit.length ? table(["Usuario", "Accion", "Entidad", "Importancia", "Fecha"], summary.recentAudit.map(auditRow)) : empty("Aun no hay actividad")}
    </section>
  `;
}

function renderCrud(module, state) {
  const rows = state[module.id] || [];
  return `
    <section class="workspace">
      <form class="panel form" data-form="${module.id}">
        <div class="panel-head">
          <h2>${editing ? "Editar" : "Nuevo"} ${module.singular}</h2>
          ${editing ? `<button type="button" class="ghost" data-cancel>Cancelar</button>` : ""}
        </div>
        <div class="form-grid">
          ${module.fields.map((field) => fieldControl(field, state, editing || module.defaults || {})).join("")}
        </div>
        <button class="primary" type="submit">${editing ? "Guardar cambios" : "Crear registro"}</button>
      </form>
      <section class="panel list">
        <div class="panel-head">
          <h2>${module.label}</h2>
          <span class="pill">${module.endpoint}</span>
        </div>
        ${rows.length ? recordsTable(module, rows, state) : empty("Sin registros")}
      </section>
    </section>
  `;
}

function fieldControl(field, state, values) {
  const value = values[field.name] ?? "";
  const required = field.required ? "required" : "";
  if (field.type === "textarea") return `<label>${field.label}<textarea name="${field.name}" ${required} placeholder="${field.placeholder || ""}">${escapeHtml(value)}</textarea></label>`;
  if (field.type === "select") return `<label>${field.label}<select name="${field.name}" ${required}>${field.options.map((option) => `<option value="${option}" ${value === option ? "selected" : ""}>${label(option)}</option>`).join("")}</select></label>`;
  if (field.type === "relation") {
    const options = state[field.collection].filter((item) => item.status !== "inactive" && item.status !== "deleted" && matchesFilter(item, field.filter));
    return `<label>${field.label}<select name="${field.name}" ${required}><option value="">Sin asignar</option>${options.map((item) => `<option value="${item.id}" ${value === item.id ? "selected" : ""}>${escapeHtml(item[field.display] || item.name || item.id)}</option>`).join("")}</select></label>`;
  }
  const type = field.type === "money" ? "number" : field.type;
  return `<label>${field.label}<input name="${field.name}" type="${type}" value="${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}" ${required} ${field.min !== undefined ? `min="${field.min}"` : ""} placeholder="${field.placeholder || ""}"></label>`;
}

function recordsTable(module, rows, state) {
  const fields = module.fields.slice(0, 4);
  const headers = [...fields.map((field) => field.label), "Estado", "Acciones"];
  const body = rows.map((row) => [
    ...fields.map((field) => display(field, row[field.name], row, state)),
    label(row.agreementStatus || row.status),
    actions(module, row)
  ]);
  return table(headers, body, true);
}

function actions(module, row) {
  const buttons = [
    `<button class="icon-btn" data-edit="${module.id}:${row.id}">Editar</button>`,
    `<button class="icon-btn danger" data-delete="${module.id}:${row.id}">Inactivar</button>`
  ];
  if (module.id === "boardingStays" && row.agreementStatus === "active") buttons.push(`<button class="icon-btn good" data-finish="${row.id}">Finalizar</button>`);
  if (["boardingPayments", "vaccinations", "farrierRecords", "documentBatches"].includes(module.id) && row.status !== "cancelled") buttons.push(`<button class="icon-btn danger" data-cancel-record="${module.id}:${row.id}">Anular</button>`);
  if (module.id === "adminInvitations" && row.status === "pending") buttons.push(`<button class="icon-btn danger" data-revoke="${row.id}">Revocar</button>`);
  return `<div class="row-actions">${buttons.join("")}</div>`;
}

function renderSearch(state) {
  const results = search(state, searchText);
  return `
    <section class="panel">
      <h2>Buscar caballos, clientes, pensiones y documentos</h2>
      <div class="searchbar">
        <input data-search-input value="${escapeHtml(searchText)}" placeholder="Nombre, telefono, documento, distintivo, ID de pension">
        <button class="primary" data-search-button>Buscar</button>
      </div>
      ${results.length ? table(["Tipo", "Titulo", "Estado", "Vista previa"], results.map((item) => [item.type, item.title, label(item.status), item.preview])) : empty("Escribe una busqueda para encontrar informacion")}
    </section>
  `;
}

function renderGenealogy(state) {
  const horses = state.horses.filter((item) => item.status !== "inactive");
  const selected = horses[0]?.id;
  const tree = selected ? genealogyTree(state, selected) : null;
  return `
    <section class="panel">
      <h2>Arbol disponible</h2>
      ${tree ? `
        <div class="tree">
          <div class="tree-node root">${escapeHtml(tree.name)}</div>
          <div class="tree-row">${tree.parents.map((item) => `<div class="tree-node">${escapeHtml(item.name)}<small>${item.registered ? "registrado" : "externo"}</small></div>`).join("") || `<div class="tree-node muted">Sin padres</div>`}</div>
          <div class="tree-row">${tree.children.map((item) => `<div class="tree-node">${escapeHtml(item.name)}<small>descendencia</small></div>`).join("") || `<div class="tree-node muted">Sin descendencia</div>`}</div>
        </div>
      ` : empty("Sin caballos")}
    </section>
  `;
}

function renderAudit(state) {
  return `<section class="panel"><h2>Historial filtrable</h2>${state.auditLogs.length ? table(["Usuario", "Accion", "Entidad", "Importancia", "Fecha"], state.auditLogs.slice().reverse().map(auditRow)) : empty("Sin eventos")}</section>`;
}

function renderConsumption(state) {
  return `<section class="panel"><h2>Uso estimado y optimizacion</h2>${state.consumption.length ? table(["Razon", "Input", "Output", "Optimizacion"], state.consumption.slice().reverse().map((item) => [item.reason, item.estimated_input_tokens, item.estimated_output_tokens, item.optimization])) : empty("Sin ciclos registrados")}</section>`;
}

function bind() {
  app.querySelector("[data-actor]")?.addEventListener("change", (event) => {
    actor = store.getState().users.find((item) => item.id === event.target.value);
    render();
  });
  app.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => {
    activeView = button.dataset.nav;
    editing = null;
    render();
  }));
  app.querySelector("[data-reset]")?.addEventListener("click", () => {
    store.reset();
    actor = store.getState().users[0];
    editing = null;
    render();
  });
  app.querySelector("[data-cancel]")?.addEventListener("click", () => {
    editing = null;
    render();
  });
  app.querySelectorAll("[data-form]").forEach((form) => form.addEventListener("submit", submitForm));
  app.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => {
    const [collection, id] = button.dataset.edit.split(":");
    activeView = collection;
    editing = store.getState()[collection].find((item) => item.id === id);
    render();
  }));
  app.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    const [collection, id] = button.dataset.delete.split(":");
    const module = MODULES.find((item) => item.id === collection);
    handle(api.request("DELETE", `${module.endpoint}/${id}`));
  }));
  app.querySelectorAll("[data-finish]").forEach((button) => button.addEventListener("click", () => handle(api.request("POST", `/api/v1/boarding-stays/${button.dataset.finish}/finish`, { actualExitDate: new Date().toISOString().slice(0, 10) }))));
  app.querySelectorAll("[data-cancel-record]").forEach((button) => button.addEventListener("click", () => {
    const [collection, id] = button.dataset.cancelRecord.split(":");
    const module = MODULES.find((item) => item.id === collection);
    const path = `${module.endpoint}/${id}/cancel`;
    handle(api.request("POST", path, { reason: "Anulacion administrativa local" }));
  }));
  app.querySelectorAll("[data-revoke]").forEach((button) => button.addEventListener("click", () => handle(api.request("POST", `/api/v1/admin-invitations/${button.dataset.revoke}/revoke`))));
  app.querySelector("[data-search-button]")?.addEventListener("click", () => {
    searchText = app.querySelector("[data-search-input]").value;
    render();
  });
  app.querySelector("[data-search-input]")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchText = event.currentTarget.value;
      render();
    }
  });
}

function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const module = MODULES.find((item) => item.id === form.dataset.form);
  const payload = Object.fromEntries(new FormData(form).entries());
  const response = editing ? api.request("PATCH", `${module.endpoint}/${editing.id}`, payload) : api.request("POST", module.endpoint, payload);
  if (!response.error) editing = null;
  handle(response);
}

function handle(response) {
  if (response.error) return toast(response.error.message);
  render();
}

function table(headers, rows, html = false) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${html ? cell : escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function display(field, value, row, state) {
  if (field.name === "paidMonths" && Array.isArray(row.paidMonths)) return row.paidMonths.join(", ");
  if (field.type === "money") return money(value);
  if (field.type === "relation") return state[field.collection].find((item) => item.id === value)?.[field.display] || value || "";
  if (field.name === "ownershipType") return value === "own" ? "Propio" : "Pensionado";
  return value ?? "";
}

function matchesFilter(item, filter) {
  if (!filter) return true;
  return Object.entries(filter).every(([key, value]) => item[key] === value);
}

function auditRow(item) {
  return [item.actor_name, item.action, `${item.entity_type}:${item.entity_id}`, item.importance, new Date(item.created_at).toLocaleString("es-CL")];
}

function label(value) {
  return STATUS_LABELS[value] || String(value || "");
}

function horseName(state, id) {
  return state.horses.find((item) => item.id === id)?.name || id || "";
}

function clientName(state, id) {
  return state.clients.find((item) => item.id === id)?.fullName || id || "";
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.append(node);
  setTimeout(() => node.remove(), 3500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

render();
