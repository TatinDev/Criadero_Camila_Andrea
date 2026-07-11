import { api } from "../api.mjs";
import { escapeHtml, toast } from "../components/ui.mjs";

let horses = [];
let selectedId = null;

export async function render() {
  const hRes = await api("GET", "/api/v1/horses");
  horses = Array.isArray(hRes) ? hRes : [];
  if (!selectedId && horses.length > 0) selectedId = horses[0].id;

  let tree = null;
  if (selectedId) {
    tree = await api("GET", `/api/v1/horses/${selectedId}/genealogy-tree`);
  }

  const ownHorses = horses.filter((h) => h.ownershipType === "own");
  return `
    <div class="card">
      <div class="card-header">
        <h2>Arbol genealogico</h2>
        <select id="genealogy-select" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface-2);font-size:13px;">
          ${ownHorses.map((h) => `<option value="${h.id}" ${h.id === selectedId ? "selected" : ""}>${escapeHtml(h.name)}</option>`).join("")}
        </select>
      </div>
      ${tree ? `
        <div class="genealogy-tree">
          ${tree.parents?.length ? `
            <div class="tree-row">
              ${tree.parents.map((p) => p ? `<div class="tree-node"><div class="name">${escapeHtml(p.name)}</div><div class="label">${p.registered ? "registrado" : "nombre externo"}</div></div>` : `<div class="tree-node" style="opacity:0.5"><div class="name">Sin datos</div></div>`).join("")}
            </div>
          ` : ""}
          <div class="tree-node root"><div class="name">${escapeHtml(tree.name)}</div><div class="label">caballo actual</div></div>
          ${tree.children?.length ? `
            <div class="tree-row">
              ${tree.children.map((c) => `<div class="tree-node"><div class="name">${escapeHtml(c.name)}</div><div class="label">descendencia</div></div>`).join("")}
            </div>
          ` : `<div class="tree-row"><div class="tree-node" style="opacity:0.5"><div class="name">Sin descendencia</div></div></div>`}
        </div>
      ` : `<div class="empty">Selecciona un caballo para ver su arbol</div>`}
    </div>
  `;
}

export function bind() {
  document.getElementById("genealogy-select")?.addEventListener("change", async (e) => {
    selectedId = e.target.value;
    const { render: r, bind: b } = await import("./genealogy.mjs");
    document.getElementById("view-container").innerHTML = await r();
    b();
  });
}
