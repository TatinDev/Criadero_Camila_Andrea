import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml, money } from "../components/ui.mjs";

let clients = [], horses = [], stays = [], searchText = "", showInactive = false;

const fields = [
  { name: "firstName", label: "Nombres", type: "text", required: true },
  { name: "lastName", label: "Apellidos", type: "text", required: true },
  { name: "phone", label: "Contacto principal", type: "text", required: true },
  { name: "address", label: "Direccion", type: "text", required: true },
  { name: "internalNotes", label: "Notas internas", type: "textarea", full: true },
];

export async function render() {
  const cRes = await api("GET", `/api/v1/clients${showInactive ? "?show_inactive=true" : ""}`);
  clients = Array.isArray(cRes) ? cRes : [];
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];
  const sRes = await api("GET", "/api/v1/boarding-stays");
  stays = Array.isArray(sRes) ? sRes : [];

  const filtered = clients.filter((c) => {
    if (!searchText) return true;
    const s = searchText.toLowerCase();
    return (c.firstName || "").toLowerCase().includes(s)
      || (c.lastName || "").toLowerCase().includes(s)
      || (c.phone || "").toLowerCase().includes(s)
      || (c.address || "").toLowerCase().includes(s)
      || (c.fullName || "").toLowerCase().includes(s);
  });

  return `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;gap:12px;align-items:center;">
          <h2>Clientes</h2>
          <span class="status-pill status-active">${clients.filter((c) => c.status === "active").length} activos</span>
        </div>
        <button class="btn primary" id="btn-new-client">Nuevo cliente</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input type="text" id="client-search" placeholder="Buscar por nombre, apellido, telefono, direccion..." value="${escapeHtml(searchText)}" style="flex:1;padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
        ${searchText ? `<button class="btn ghost small" id="client-clear-search">Limpiar</button>` : ""}
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-2);padding:6px 10px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--surface-2);white-space:nowrap;">
          <input type="checkbox" id="client-show-inactive" ${showInactive ? "checked" : ""}> Mostrar inactivos
        </label>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Direccion</th><th>Caballos</th><th>Estado</th><th></th></tr></thead>
          <tbody>${filtered.map((c) => {
            const cHorses = horses.filter((h) => h.clientId === c.id);
            const cStays = stays.filter((s) => s.clientId === c.id);
            return `
            <tr>
              <td><strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong></td>
              <td>${escapeHtml(c.phone)}</td>
              <td>${escapeHtml(c.address)}</td>
              <td>${cHorses.length ? cHorses.map((h) => `<span class="status-pill status-active" style="font-size:11px;margin:1px;">${escapeHtml(h.name)}</span>`).join(" ") : "-"}</td>
              <td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-detail-client="${c.id}">Ficha</button>
                  <button class="btn ghost small" data-edit-client="${c.id}">Editar</button>
                  <button class="btn ghost small" data-toggle-client="${c.id}">${c.status === "active" ? "Inactivar" : "Activar"}</button>
                </div>
              </td>
            </tr>`;
          }).join("")}</tbody>
        </table>
        ${filtered.length === 0 ? `<div style="text-align:center;padding:24px;color:var(--text-2);">Sin resultados.</div>` : ""}
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-client")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-client]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editClient)));
  document.querySelectorAll("[data-toggle-client]").forEach((b) => b.addEventListener("click", () => toggle(b.dataset.toggleClient)));
  document.querySelectorAll("[data-detail-client]").forEach((b) => b.addEventListener("click", () => showDetail(b.dataset.detailClient)));
  document.getElementById("client-search")?.addEventListener("input", debounce((e) => { searchText = e.target.value; refresh(); }, 300));
  document.getElementById("client-clear-search")?.addEventListener("click", () => { searchText = ""; refresh(); });
  document.getElementById("client-show-inactive")?.addEventListener("change", (e) => { showInactive = e.target.checked; refresh(); });
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }

function showCreate() {
  const html = `<form class="form-grid">${formFieldsHtml(fields, {})}</form>`;
  modal("Nuevo cliente", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/clients", payload);
    if (res && !res.error) { toast("Cliente creado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Crear", "bi-person-plus", "", fields);
}

function showEdit(id) {
  const c = clients.find((item) => item.id === id);
  if (!c) return;
  const html = `<form class="form-grid">${formFieldsHtml(fields, c)}</form>`;
  modal("Editar cliente", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/clients/${id}`, payload);
    if (res && !res.error) { toast("Cliente actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-pencil", "", fields);
}

function showDetail(id) {
  const c = clients.find((item) => item.id === id);
  if (!c) return;
  const cHorses = horses.filter((h) => h.clientId === c.id);
  const cStays = stays.filter((s) => s.clientId === c.id);
  const html = `
    <div style="font-size:14px;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
        <div><strong>Nombre:</strong> ${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</div>
        <div><strong>Contacto:</strong> ${escapeHtml(c.phone)}</div>
        <div><strong>Direccion:</strong> ${escapeHtml(c.address)}</div>
        <div><strong>Estado:</strong> <span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></div>
      </div>
      ${c.internalNotes ? `<div style="margin-bottom:12px;"><strong>Notas:</strong><br>${escapeHtml(c.internalNotes)}</div>` : ""}
      <div style="margin-bottom:12px;">
        <strong>Caballos bajo cuidado (${cHorses.length}):</strong>
        ${cHorses.length ? `<table style="margin-top:4px;"><tr><th>Nombre</th><th>Sexo</th><th>Color</th><th>Estado</th></tr>${cHorses.map((h) => `<tr><td>${escapeHtml(h.name)}</td><td>${statusLabel(h.sex)}</td><td>${escapeHtml(h.color)}</td><td><span class="status-pill ${statusClass(h.status)}">${statusLabel(h.status)}</span></td></tr>`).join("")}</table>` : "<p style='color:var(--text-2);'>Sin caballos registrados.</p>"}
      </div>
      <div>
        <strong>Pensiones (${cStays.length}):</strong>
        ${cStays.length ? `<table style="margin-top:4px;"><tr><th>Codigo</th><th>Inicio</th><th>Costo</th><th>Estado</th></tr>${cStays.map((s) => `<tr><td>${escapeHtml(s.id)}</td><td>${escapeHtml(s.startDate)}</td><td>${money(s.boardingCost)}</td><td><span class="status-pill ${statusClass(s.agreementStatus)}">${statusLabel(s.agreementStatus)}</span></td></tr>`).join("")}</table>` : "<p style='color:var(--text-2);'>Sin pensiones registradas.</p>"}
      </div>
    </div>`;
  modal("Ficha de cliente", html, null, "", "bi-person-lines-fill", "");
}

async function toggle(id) {
  const c = clients.find((item) => item.id === id);
  if (!c) return;
  const toInactive = c.status === "active";
  if (toInactive) {
    const cStays = stays.filter((item) => item.clientId === id && item.agreementStatus === "active");
    if (cStays.length) {
      toast("No se puede inactivar: el cliente tiene " + cStays.length + " pension(es) activa(s).");
      return;
    }
  }
  const endpoint = toInactive ? "deactivate" : "reactivate";
  const res = await api("POST", `/api/v1/clients/${id}/${endpoint}`);
  if (res && !res.error) { toast("Estado cambiado", true); refresh(); }
  else toast(res?.error?.message || "Error");
}
