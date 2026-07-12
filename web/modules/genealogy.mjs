import { api } from "../api.mjs";
import { escapeHtml, statusLabel, toast, modal } from "../components/ui.mjs";

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

  const allHorses = [...horses]
    .sort((a, b) => (a.ownershipType === "own" ? 0 : 1) - (b.ownershipType === "own" ? 0 : 1));
  const selHorse = horses.find((h) => h.id === selectedId);

  return `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;gap:12px;align-items:center;">
          <h2>Arbol genealogico</h2>
          <select id="genealogy-select" style="padding:8px 12px;border:1.5px solid var(--border-2);border-radius:11px;background:var(--surface-2);font-size:14px;">
            ${allHorses.map((h) => `<option value="${h.id}" ${h.id === selectedId ? "selected" : ""}>${escapeHtml(h.name)} (${statusLabel(h.ownershipType)})</option>`).join("")}
          </select>
        </div>
        ${selHorse ? `<button class="btn primary" id="btn-edit-genealogy">Editar padres</button>` : ""}
      </div>
      ${tree ? `
        <div class="genealogy-tree" style="padding:16px;">
          ${renderAncestors(tree, 0)}
          <div class="tree-node root" data-horse-id="${escapeHtml(selectedId || "")}">
            <div class="name">${escapeHtml(tree.horse?.name || tree.name || "")}</div>
            <div class="label">caballo actual</div>
          </div>
          ${tree.children?.length ? `
            <div class="tree-row">${tree.children.map((c) => `<div class="tree-node"${c.id ? ` data-horse-id="${escapeHtml(c.id)}"` : ""}><div class="name">${escapeHtml(c.name)}</div><div class="label">descendencia</div></div>`).join("")}</div>
          ` : ``}
          ${tree.descendants?.length > 1 ? `<div style="margin-top:12px;"><strong>Segunda generacion:</strong><br>${tree.descendants.slice(1).flatMap((d) => d).filter(Boolean).map((c) => `<span class="status-pill status-in_stay" style="font-size:11px;">${escapeHtml(c.name)}</span>`).join(" ")}</div>` : ""}
        </div>
      ` : `<div class="empty">Selecciona un caballo para ver su arbol</div>`}
    </div>
  `;
}

function renderAncestors(tree, level = 0) {
  if (!tree.parents || tree.parents.length === 0 || level > 2) {
    if (level === 0) return `<div class="tree-row"><div class="tree-node" style="opacity:0.5"><div class="name">Sin padres registrados</div></div></div>`;
    return "";
  }
  let html = '<div class="tree-row">';
  const labels = level === 0 ? ["Padre", "Madre"] : ["Abuelo paterno", "Abuela paterna", "Abuelo materno", "Abuela materna"];
  for (let i = 0; i < tree.parents.length; i++) {
    const p = tree.parents[i];
    if (p) {
      html += `<div class="tree-node"${p.id ? ` data-horse-id="${escapeHtml(p.id)}"` : ""}><div class="name">${escapeHtml(p.name)}</div><div class="label">${labels[i] || "Ascendente"}</div></div>`;
    } else {
      html += `<div class="tree-node" style="opacity:0.5"><div class="name">Sin datos</div><div class="label">${labels[i] || ""}</div></div>`;
    }
  }
  html += '</div>';
  for (const p of tree.parents) {
    if (p && typeof p === "object" && p.parents) {
      html += renderAncestors(p, level + 1);
    }
  }
  return html;
}

export function bind() {
  document.getElementById("genealogy-select")?.addEventListener("change", async (e) => {
    selectedId = e.target.value;
    document.getElementById("view-container").innerHTML = await render();
    bind();
  });
  document.getElementById("btn-edit-genealogy")?.addEventListener("click", () => showEditGenealogy());
  document.querySelectorAll(".tree-node[data-horse-id]").forEach((node) => {
    node.addEventListener("click", async (e) => {
      const hid = e.currentTarget.dataset.horseId;
      if (hid && hid !== selectedId) {
        selectedId = hid;
        document.getElementById("view-container").innerHTML = await render();
        bind();
      }
    });
  });
}

function showEditGenealogy() {
  const h = horses.find((item) => item.id === selectedId);
  if (!h) return;
  const hasFatherReg = Boolean(h.fatherHorseId);
  const hasMotherReg = Boolean(h.motherHorseId);
  const fatherOpts = horses.filter((ho) => ho.id !== selectedId && ho.sex === "macho").map((ho) => ({ id: ho.id, label: ho.name }));
  const motherOpts = horses.filter((ho) => ho.id !== selectedId && ho.sex === "hembra").map((ho) => ({ id: ho.id, label: ho.name }));

  const parentHtml = (prefix, label, icon, hasReg, horseId, extName, optsList) => `
    <div class="genealogy-box">
      <label>
        <input type="checkbox" id="${prefix}-registered" ${hasReg ? "checked" : ""}>
        <i class="bi ${icon}" style="font-size:14px;"></i> ${label} registrado en el sistema
      </label>
      <div id="${prefix}-select" style="display:${hasReg ? "block" : "none"};" class="genealogy-inner">
        <select name="${prefix}HorseId">
          <option value="">Seleccionar caballo...</option>
          ${optsList.map((o) => `<option value="${escapeHtml(o.id)}" ${horseId === o.id ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}
        </select>
      </div>
      <div id="${prefix}-text" style="display:${hasReg ? "none" : "block"};" class="genealogy-inner">
        <input name="${prefix}ExternalName" type="text" value="${escapeHtml(extName || "")}" placeholder="Nombre del ${label.toLowerCase()}">
      </div>
    </div>`;

  const html = `
    <form class="form-grid">
      <p style="grid-column:1/-1;font-size:14px;">Caballo: <strong>${escapeHtml(h.name)}</strong></p>
      ${parentHtml("father", "Padre", "bi-gender-male", hasFatherReg, h.fatherHorseId, h.fatherExternalName, fatherOpts)}
      ${parentHtml("mother", "Madre", "bi-gender-female", hasMotherReg, h.motherHorseId, h.motherExternalName, motherOpts)}
    </form>`;

  modal("Editar genealogia", html, async (fd) => {
    const payload = {};
    if (document.getElementById("father-registered")?.checked) {
      const fhId = fd.get("fatherHorseId");
      payload.fatherHorseId = fhId || "";
      payload.fatherExternalName = "";
    } else {
      payload.fatherHorseId = "";
      payload.fatherExternalName = fd.get("fatherExternalName") || "";
    }
    if (document.getElementById("mother-registered")?.checked) {
      const mhId = fd.get("motherHorseId");
      payload.motherHorseId = mhId || "";
      payload.motherExternalName = "";
    } else {
      payload.motherHorseId = "";
      payload.motherExternalName = fd.get("motherExternalName") || "";
    }
    const res = await api("PATCH", `/api/v1/horses/${selectedId}`, payload);
    if (res && !res.error) { toast("Genealogia actualizada", true); refresh(); }
    else toast(res?.error?.message || "Error");
  }, "Guardar", "bi-diagram-3");

  for (const p of ["father", "mother"]) {
    document.getElementById(`${p}-registered`)?.addEventListener("change", (e) => {
      document.getElementById(`${p}-select`).style.display = e.target.checked ? "block" : "none";
      document.getElementById(`${p}-text`).style.display = e.target.checked ? "none" : "block";
    });
  }

  async function refresh() { document.getElementById("view-container").innerHTML = await render(); bind(); }
}
