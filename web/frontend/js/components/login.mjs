import { api, setToken } from "../api.mjs";
import { esc, show } from "../app.mjs";

export function renderLogin(container, onLogin) {
  container.innerHTML = `<div class="login-shell">
    <div class="login-card">
      <div class="brand-mark">CA</div>
      <h1>Criadero Camila Andrea</h1>
      <p class="sub">Gestion privada interna</p>
      <form id="frm-login">
        <label>Correo electronico
          <input name="email" type="email" value="owner@criadero.local" required>
        </label>
        <button class="btn btn-primary login-btn" type="submit">Iniciar sesion</button>
      </form>
      <p style="margin-top:16px;font-size:12px;color:var(--muted)">
        Demo: owner@criadero.local / admin@criadero.local
      </p>
    </div>
  </div>`;
  document.getElementById("frm-login")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    try {
      const res = await api.login(email);
      onLogin(res.user, res.token);
    } catch(err) {
      show(err.message || "Error al iniciar sesion");
    }
  });
}

export function renderAcceptInvite(container, token) {
  container.innerHTML = `<div class="login-shell">
    <div class="login-card">
      <div class="brand-mark">CA</div>
      <h1>Aceptar invitacion</h1>
      <p class="sub">Crea tu cuenta de administrador</p>
      <form id="frm-accept">
        <label>Nombre <input name="name" required></label>
        <label>Apellido <input name="lastName" required></label>
        <label>Correo <input name="email" type="email" required></label>
        <label>Contraseña <input name="password" type="password" required minlength="6"></label>
        <label>Confirmar contraseña <input name="confirm" type="password" required></label>
        <button class="btn btn-primary login-btn" type="submit">Crear cuenta</button>
      </form>
    </div>
  </div>`;
  document.getElementById("frm-accept")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("confirm")) return show("Las contraseñas no coinciden");
    try {
      const res = await api.post("/admin-invitations/" + token + "/accept", { name: fd.get("name"), email: fd.get("email") });
      setToken(res.token);
      location.reload();
      show("Cuenta creada. Ahora puedes iniciar sesion.");
      setTimeout(() => location.reload(), 1500);
    } catch(err) {
      show(err.message || "Error al aceptar invitacion");
    }
  });
}
