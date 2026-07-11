import { api, setToken, getToken } from "./api.mjs";
import { renderDashboard } from "./components/dashboard.mjs";
import { renderClients } from "./components/clients.mjs";
import { renderHorses } from "./components/horses.mjs";
import { renderBoarded } from "./components/boarded.mjs";
import { renderStays } from "./components/stays.mjs";
import { renderPayments } from "./components/payments.mjs";
import { renderVaccinations } from "./components/vaccinations.mjs";
import { renderFarrier } from "./components/farrier.mjs";
import { renderDocuments } from "./components/documents.mjs";
import { renderGenealogy } from "./components/genealogy.mjs";
import { renderAudit } from "./components/audit.mjs";
import { renderAdmins } from "./components/admins.mjs";
import { renderLogin, renderAcceptInvite } from "./components/login.mjs";

const app = document.getElementById("app");
let user = null;
let route = "dashboard";

const NAV = [
  { id: "dashboard", label: "Panel", icon: "grid" },
  { id: "horses", label: "Caballos propios", icon: "shield" },
  { id: "boarded", label: "Pensionados", icon: "people" },
  { id: "clients", label: "Clientes", icon: "person" },
  { id: "stays", label: "Pensiones", icon: "calendar" },
  { id: "payments", label: "Pagos", icon: "currency-dollar" },
  { id: "vaccinations", label: "Vacunas", icon: "heart-pulse" },
  { id: "farrier", label: "Herrajes", icon: "gear" },
  { id: "documents", label: "Documentos", icon: "file-earmark" },
  { id: "genealogy", label: "Genealogia", icon: "diagram-3" },
  { id: "audit", label: "Historial", icon: "clock-history" },
  { id: "admins", label: "Admin", icon: "shield-lock" },
];

function html(strings, ...values) {
  return strings.reduce((acc, s, i) => acc + escape(String(values[i - 1])) + s);
}

function escape(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }

export function esc(v) { return escape(v); }

export function show(toast) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = toast;
  document.body.append(t); setTimeout(() => t.remove(), 3000);
}

export function badge(status) {
  const cls = ({ active:"active", inactive:"inactive", valid:"valid", cancelled:"cancelled", finished:"finished", pending:"pending", expired:"inactive", revoked:"cancelled", out_of_stay:"inactive", in_stay:"active" })[status] || "active";
  return `<span class="badge badge-${cls}">${esc(status)}</span>`;
}

export function money(v) { return new Intl.NumberFormat("es-CL", { style:"currency", currency:"CLP", maximumFractionDigits:0 }).format(Number(v||0)); }

function renderNav() {
  return NAV.map(n => `<button class="nav-item${route===n.id?" active":""}" data-nav="${n.id}">
    <i class="bi bi-${n.icon}"></i> ${esc(n.label)}
  </button>`).join("");
}

function renderTopbar() {
  const navItem = NAV.find(n => n.id === route);
  const title = navItem ? navItem.label : "Criadero Camila Andrea";
  return `<div class="topbar">
    <div>
      <div class="meta">${route === "dashboard" ? "" : `/api/v1 · ${esc(user?.role || "")}`}</div>
      <h1>${esc(title)}</h1>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span class="pill">${esc(user?.name || "")}</span>
      <span class="badge badge-${user?.role==="owner"?"active":"valid"}">${esc(user?.role||"")}</span>
      <button class="btn btn-ghost btn-sm" id="btn-logout">Salir</button>
    </div>
  </div>`;
}

export function navigate(to) { route = to; render(); }

async function render() {
  if (!getToken()) {
    const params = new URLSearchParams(location.search);
    if (params.get("invite")) return renderAcceptInvite(app, params.get("invite"));
    return renderLogin(app, (u, t) => { setToken(t); user = u; render(); });
  }
  try {
    user = await api.get("/auth/me");
  } catch {
    setToken(null); render(); return;
  }
  app.innerHTML = `<div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">CA</div>
        <div><h1>Criadero Camila Andrea</h1><small>Gestion interna</small></div>
      </div>
      <nav class="nav">${renderNav()}</nav>
      <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-ghost btn-sm" style="width:100%" id="btn-theme"><i class="bi bi-moon"></i> Tema</button>
      </div>
    </aside>
    <main class="main">
      ${renderTopbar()}
      <div class="content" id="content"></div>
    </main>
  </div>`;
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    try { await api.logout(); } catch {}
    setToken(null); render();
  });
  document.getElementById("btn-theme")?.addEventListener("click", () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "" : "dark";
  });
  document.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(b.dataset.nav)));
  renderContent();
}

async function renderContent() {
  const content = document.getElementById("content");
  if (!content) return;
  try {
    if (route === "dashboard") return renderDashboard(content);
    if (route === "clients") return renderClients(content);
    if (route === "horses") return renderHorses(content);
    if (route === "boarded") return renderBoarded(content);
    if (route === "stays") return renderStays(content);
    if (route === "payments") return renderPayments(content);
    if (route === "vaccinations") return renderVaccinations(content);
    if (route === "farrier") return renderFarrier(content);
    if (route === "documents") return renderDocuments(content);
    if (route === "genealogy") return renderGenealogy(content);
    if (route === "audit") return renderAudit(content);
    if (route === "admins") return renderAdmins(content);
    content.innerHTML = `<div class="empty">Pantalla no encontrada</div>`;
  } catch(e) {
    content.innerHTML = `<div class="empty">Error: ${escape(e.message||"desconocido")}</div>`;
  }
}

render();
