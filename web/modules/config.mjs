import { api } from "../api.mjs";
import { escapeHtml, toast } from "../components/ui.mjs";

let config = {};

export async function render() {
  const res = await api("GET", "/api/v1/system-config");
  config = (res && !res.error) ? res : {};

  const fields = [
    { key: "invite_expiration_days", label: "Expiracion invitaciones (dias)", type: "number", default: "30" },
    { key: "max_file_size_mb", label: "Tamaño maximo archivos (MB)", type: "number", default: "10" },
    { key: "allowed_extensions", label: "Extensiones permitidas", type: "text", default: ".jpg,.jpeg,.png,.pdf" },
    { key: "session_timeout_minutes", label: "Tiempo de sesion (minutos)", type: "number", default: "480" },
  ];

  return `
    <div class="card">
      <div class="card-header"><h2>Configuracion del sistema</h2></div>
      <form id="config-form" class="form-grid" style="max-width:500px;">
        ${fields.map((f) => `
          <label class="full">${escapeHtml(f.label)}
            <input name="${f.key}" type="${f.type}" value="${escapeHtml(config[f.key] || f.default)}" style="width:100%;">
          </label>
        `).join("")}
        <div class="full" style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn primary" type="submit">Guardar configuracion</button>
        </div>
      </form>
    </div>
  `;
}

export function bind() {
  document.getElementById("config-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    const res = await api("PATCH", "/api/v1/system-config", payload);
    if (res && !res.error) { toast("Configuracion guardada", true); }
    else toast(res?.error?.message || "Error al guardar");
  });
}
