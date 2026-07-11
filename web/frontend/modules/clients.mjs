import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, toast, modal, formFieldsHtml } from "../components/ui.mjs";

let clients = [];

const fields = [
  { name: "firstName", label: "Nombres", type: "text", required: true },
  { name: "lastName", label: "Apellidos", type: "text", required: true },
  { name: "phone", label: "Contacto principal", type: "text", required: true },
  { name: "address", label: "Direccion", type: "text", required: true },
  { name: "internalNotes", label: "Notas internas", type: "textarea", full: true },
];

export async function render() {
  const res = await api("GET", "/api/v1/clients");
  clients = Array.isArray(res) ? res : [];
  return `
    <div class="card">
      <div class="card-header">
        <h2>Clientes</h2>
        <button class="btn primary" id="btn-new-client">Nuevo cliente</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Direccion</th><th>Estado</th><th></th></tr></thead>
          <tbody>${clients.map((c) => `
            <tr>
              <td><strong>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</strong></td>
              <td>${escapeHtml(c.phone)}</td>
              <td>${escapeHtml(c.address)}</td>
              <td><span class="status-pill ${statusClass(c.status)}">${statusLabel(c.status)}</span></td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost small" data-edit-client="${c.id}">Editar</button>
                  <button class="btn ghost small" data-toggle-client="${c.id}">${c.status === "active" ? "Inactivar" : "Activar"}</button>
                </div>
              </td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-new-client")?.addEventListener("click", () => showCreate());
  document.querySelectorAll("[data-edit-client]").forEach((b) => b.addEventListener("click", () => showEdit(b.dataset.editClient)));
  document.querySelectorAll("[data-toggle-client]").forEach((b) => {
    b.addEventListener("click", () => toggle(b.dataset.toggleClient));
  });
}

async function refresh() {
  const { render: r, bind: b } = await import("./clients.mjs");
  document.getElementById("view-container").innerHTML = await r();
  b();
}

function showCreate() {
  const html = `<form>${formFieldsHtml(fields, {})}</form>`;
  modal("Nuevo cliente", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("POST", "/api/v1/clients", payload);
    if (res && !res.error) { toast("Cliente creado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}

function showEdit(id) {
  const c = clients.find((item) => item.id === id);
  if (!c) return;
  const html = `<form>${formFieldsHtml(fields, c)}</form>`;
  modal("Editar cliente", html, async (fd) => {
    const payload = Object.fromEntries(fd.entries());
    const res = await api("PATCH", `/api/v1/clients/${id}`, payload);
    if (res && !res.error) { toast("Cliente actualizado", true); refresh(); }
    else toast(res?.error?.message || "Error");
  });
}

async function toggle(id) {
  const c = clients.find((item) => item.id === id);
  if (!c) return;
  const endpoint = c.status === "active" ? "deactivate" : "activate";
  const res = await api("POST", `/api/v1/clients/${id}/${endpoint}`);
  if (res && !res.error) { toast("Estado cambiado", true); refresh(); }
  else toast(res?.error?.message || "Error");
}
