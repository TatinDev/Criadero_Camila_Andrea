import { api } from "../api.mjs";
import { escapeHtml, statusLabel, statusClass, table } from "../components/ui.mjs";

let results = [];
let query = "";

export async function render() {
  if (query) results = await api("GET", `/api/v1/search?q=${encodeURIComponent(query)}`) || [];
  else results = [];

  return `
    <div class="card">
      <div class="card-header">
        <h2>Buscador global</h2>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <input id="search-input" type="text" value="${escapeHtml(query)}" placeholder="Nombre, telefono, documento, ID de pension..."
          style="flex:1;padding:12px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);font-size:14px;outline:none;">
        <button class="btn primary" id="btn-search">Buscar</button>
      </div>
      ${query ? `
        <p style="font-size:13px;color:var(--muted);margin-bottom:16px;">${results.length || 0} resultados para "${escapeHtml(query)}"</p>
        ${table(["Tipo", "Titulo", "Estado", "Vista previa"], results.map((r) => [
          `${escapeHtml(r.type)}`,
          `<strong>${escapeHtml(r.title)}</strong>`,
          `<span class="status-pill ${statusClass(r.status)}">${statusLabel(r.status)}</span>`,
          escapeHtml(r.preview?.slice(0, 100) || ""),
        ]))}
      ` : `<div class="empty">Escribe una busqueda para encontrar caballos, clientes, pensiones y documentos</div>`}
    </div>
  `;
}

export function bind() {
  document.getElementById("btn-search")?.addEventListener("click", async () => {
    query = document.getElementById("search-input")?.value || "";
    const { render: r, bind: b } = await import("./search.mjs");
    document.getElementById("view-container").innerHTML = await r();
    b();
  });
  document.getElementById("search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-search")?.click();
  });
}
