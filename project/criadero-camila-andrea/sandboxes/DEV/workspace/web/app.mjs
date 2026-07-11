import { checkServer, getToken, setToken, request, api, isServerOnline } from "./api.mjs";
import { escapeHtml, statusLabel, statusClass, toast } from "./components/ui.mjs";

let currentUser = null;
let currentView = "dashboard";
const app = document.getElementById("app");

const navItems = [
  { id: "dashboard", label: "Panel", icon: "bi-speedometer2" },
  { id: "horses", label: "Caballos", icon: "bi-heart" },
  { id: "clients", label: "Clientes", icon: "bi-people" },
  { id: "boarding", label: "Pensiones", icon: "bi-house" },
  { id: "payments", label: "Pagos", icon: "bi-cash-stack" },
  { id: "health", label: "Sanidad", icon: "bi-file-medical" },
  { id: "documents", label: "Documentos", icon: "bi-file-earmark" },
  { id: "genealogy", label: "Genealogia", icon: "bi-diagram-3" },
  { id: "audit", label: "Auditoria", icon: "bi-journal-text" },
  { id: "search", label: "Buscador", icon: "bi-search" },
  { id: "admin", label: "Admin", icon: "bi-shield-lock", ownerOnly: true },
];

async function loadModule(name) {
  try {
    return await import(`./modules/${name}.mjs`);
  } catch (e) {
    console.error("Failed to load module:", name, e);
    return null;
  }
}

async function getView(id) {
  const modules = {
    dashboard: "dashboard", horses: "horses", clients: "clients",
    boarding: "boarding", payments: "payments", health: "health",
    documents: "documents", genealogy: "genealogy", audit: "audit",
    search: "search", admin: "admin",
  };
  return await loadModule(modules[id] || id);
}

init();
async function init() {
  try {
    const serverMode = await checkServer();

    if (serverMode && getToken()) {
      const me = await api("GET", "/api/v1/auth/me");
      if (me && !me.error) currentUser = me;
      else setToken(null);
    }

    if (serverMode && !currentUser) {
      const Auth = await loadModule("auth");
      app.innerHTML = Auth ? Auth.renderLogin() : "<div class='login-shell'><div class='login-card'><p>Error cargando login</p></div></div>";
      document.getElementById("login-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        const res = await request("POST", "/api/v1/auth/login", { email });
        if (res.data?.token) {
          setToken(res.data.token);
          currentUser = res.data.user;
          currentView = "dashboard";
          render();
        } else {
          toast(res.error?.message || "Credenciales invalidas");
        }
      });
      return;
    }

    render();
  } catch (e) {
    console.error("Init error:", e);
    app.innerHTML = `<div style="padding:40px;text-align:center;font-family:sans-serif;"><h2>Error al iniciar</h2><p>${escapeHtml(e.message)}</p></div>`;
  }
}

function render() {
  const isOwner = currentUser?.role === "owner";
  const nav = navItems
    .filter((item) => !item.ownerOnly || isOwner)
    .map((item) => `<button class="${currentView === item.id ? "active" : ""}" data-nav="${item.id}"><i class="bi ${item.icon}"></i><span>${item.label}</span></button>`)
    .join("");

  const initials = currentUser ? (currentUser.firstName?.[0] || "") + (currentUser.lastName?.[0] || "") : "";
  const online = isServerOnline();

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="logo">CA</div>
          <div>
            <div class="title">Criadero</div>
            <div class="subtitle">CAMILA ANDREA</div>
          </div>
        </div>
        <nav class="sidebar-nav">${nav}</nav>
        <div class="sidebar-user">
          <div class="avatar">${escapeHtml(initials)}</div>
          <div class="info">
            <div class="name">${escapeHtml(currentUser?.firstName + " " + currentUser?.lastName || "Usuario")}</div>
            <div class="role">${statusLabel(currentUser?.role)}</div>
          </div>
          <button class="btn ghost small" id="btn-logout" title="Cerrar sesion"><i class="bi bi-box-arrow-right"></i></button>
        </div>
      </aside>
      <div class="main-area">
        <header class="topbar">
          <div>
            <div class="eyebrow">CCA · ${online ? "online" : "offline"}</div>
            <h1>${viewTitle()}</h1>
          </div>
          <div class="actions"><span class="badge ${online ? "" : "offline"}">${online ? "conectado" : "local"}</span></div>
        </header>
        <div class="content" id="view-container"><p style="color:var(--muted)">Cargando...</p></div>
      </div>
    </div>
  `;
  bindShellEvents();
  renderView();
}

function viewTitle() {
  const titles = {
    dashboard: "Panel operativo", horses: "Caballos", clients: "Clientes",
    boarding: "Pensiones", payments: "Pagos", health: "Sanidad",
    documents: "Documentos", genealogy: "Arbol genealogico",
    audit: "Historial / Auditoria", search: "Buscador global", admin: "Administracion",
  };
  return titles[currentView] || currentView;
}

async function renderView() {
  const container = document.getElementById("view-container");
  if (!container) return;
  try {
    const mod = await getView(currentView);
    if (mod) {
      container.innerHTML = await mod.render();
      if (mod.bind) mod.bind();
    } else {
      container.innerHTML = `<div class="empty">Modulo no disponible</div>`;
    }
  } catch (e) {
    console.error("Render error:", currentView, e);
    container.innerHTML = `<div class="empty">Error cargando ${currentView}: ${escapeHtml(e.message)}</div>`;
  }
}

function bindShellEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => { currentView = btn.dataset.nav; render(); });
  });
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await request("POST", "/api/v1/auth/logout");
    setToken(null);
    currentUser = null;
    currentView = "dashboard";
    init();
  });
}

export function getCurrentUser() { return currentUser; }
export function setCurrentView(v) { currentView = v; render(); }
export { toast, escapeHtml, statusLabel, statusClass };
