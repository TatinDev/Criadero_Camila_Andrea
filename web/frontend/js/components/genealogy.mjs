import { api } from "../api.mjs";
import { esc, show } from "../app.mjs";

export async function renderGenealogy(container) {
  const horses = await api.get("/horses");
  const own = horses.filter(h => h.ownershipType === "own" && h.status !== "inactive");
  if (!own.length) return container.innerHTML = `<div class="empty">No hay caballos propios para mostrar arbol genealogico</div>`;
  const selected = own[0];
  const tree = await api.get(`/horses/${selected.id}/genealogy-tree`);
  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Arbol genealogico</h2>
      <select id="sel-tree-horse">${own.map(h => `<option value="${h.id}"${h.id===selected.id?" selected":""}>${esc(h.name)}</option>`).join("")}</select>
    </div>
    <div style="padding:24px;text-align:center">
      <div style="display:inline-flex;flex-direction:column;align-items:center;gap:16px">
        <div style="background:var(--brand);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600">${esc(tree.name)}</div>
        <div style="display:flex;gap:40px">
          ${(tree.parents||[]).map(p => `<div style="background:var(--surface-2);padding:8px 16px;border-radius:8px;border:1px solid var(--border)">
            <div>${esc(p.name)}</div><small style="color:var(--muted)">${p.registered?"registrado":"externo"}</small>
          </div>`).join("")||'<div style="color:var(--muted)">Sin padres registrados</div>'}
        </div>
        <hr style="width:60%;border-color:var(--border)">
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
          ${(tree.children||[]).map(c => `<div style="background:var(--success-soft);padding:8px 16px;border-radius:8px;border:1px solid var(--border)">
            <div>${esc(c.name)}</div><small style="color:var(--muted)">descendencia</small>
          </div>`).join("")||'<div style="color:var(--muted)">Sin descendencia</div>'}
        </div>
      </div>
    </div>
  </div>`;
  container.querySelector("#sel-tree-horse")?.addEventListener("change", async (e) => {
    const id = e.target.value;
    const tree2 = await api.get(`/horses/${id}/genealogy-tree`);
    renderGenealogy(container);
  });
}
