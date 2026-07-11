import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass } from "../components/ui.mjs";
import { setCurrentView } from "../app.mjs";

let results = [];
let query = "";
let searchType = "all";

export async function render() {
  if (query) {
    const q = searchType !== "all" ? `${encodeURIComponent(query)}&type=${encodeURIComponent(searchType)}` : encodeURIComponent(query);
    results = await api("GET", `/api/v1/search?q=${q}`) || [];
  } else results = [];
  if (!Array.isArray(results)) results = [];

  const groups = {};
  for (const r of results) {
    const t = r.type || "otros";
    if (!groups[t]) groups[t] = [];
    groups[t].push(r);
  }

  return `
    <div class="card">
      <div class="card-header"><h2>Buscador global</h2></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <input id="search-input" type="text" value="${escapeHtml(query)}" placeholder="Nombre, color, distintivos, telefono, cliente..."
          style="flex:1;min-width:200px;padding:12px 16px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;outline:none;">
        <select id="search-type" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
          <option value="all" ${searchType === "all" ? "selected" : ""}>Todos</option>
          <option value="horses" ${searchType === "horses" ? "selected" : ""}>Caballos</option>
          <option value="clients" ${searchType === "clients" ? "selected" : ""}>Clientes</option>
          <option value="boarding_stays" ${searchType === "boarding_stays" ? "selected" : ""}>Pensiones</option>
          <option value="documents" ${searchType === "documents" ? "selected" : ""}>Documentos</option>
        </select>
        <button class="btn primary" id="btn-search">Buscar</button>
        ${query ? `<button class="btn ghost small" id="btn-clear-search">Limpiar</button>` : ""}
      </div>
      ${query ? `
        <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">${results.length || 0} resultados para "${escapeHtml(query)}"${searchType !== "all" ? ` en ${statusLabel(searchType)}` : ""}</p>
        ${Object.entries(groups).map(([type, items]) => `
          <div style="margin-bottom:16px;">
            <h3 style="font-size:13px;text-transform:uppercase;color:var(--text-2);margin-bottom:6px;border-bottom:1px solid var(--border);padding-bottom:4px;">${statusLabel(type)} (${items.length})</h3>
            <table style="margin-bottom:0;">
              <thead><tr><th>Titulo</th><th>Estado</th><th>Detalle</th></tr></thead>
              <tbody>${items.map((r) => `
                <tr style="cursor:pointer;" data-search-row="${escapeHtml(r.type)}" data-search-id="${escapeHtml(r.id)}">
                  <td><strong>${escapeHtml(r.label || r.title || "")}</strong></td>
                  <td><span class="status-pill ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
                  <td style="max-width:200px;font-size:13px;">${escapeHtml(r.preview?.slice(0, 120) || r.subtitle?.slice(0, 120) || "")}</td>
                </tr>`).join("")}</tbody>
            </table>
          </div>
        `).join("")}
      ` : `<div class="empty">Busca caballos (nombre, sexo, color, lugar, distintivos), clientes (nombre, apellido, telefono, direccion), pensiones o documentos.</div>`}
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-search")?.addEventListener("click", async () => {
    query = document.getElementById("search-input")?.value || "";
    searchType = document.getElementById("search-type")?.value || "all";
    document.getElementById("view-container").innerHTML = await render();
    bind();
  });
  document.getElementById("btn-clear-search")?.addEventListener("click", async () => {
    query = ""; searchType = "all"; results = [];
    document.getElementById("view-container").innerHTML = await render();
    bind();
  });
  document.getElementById("search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-search")?.click();
  });
  document.querySelectorAll("[data-search-row]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const type = el.dataset.searchRow;
      const id = el.dataset.searchId;
      const map = { horses: "horses", clients: "clients", boarding_stays: "boarding", boarding_payments: "payments", vaccinations: "vaccinations", farrier_records: "farrier", documents: "documents" };
      const view = map[type] || type;
      if (view) setCurrentView(view, id);
    });
  });
}
