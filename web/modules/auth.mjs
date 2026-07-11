export function renderLogin() {
  return `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">CA</div>
        <h1>Criadero Camila Andrea</h1>
        <p class="sub">Gestion privada interna</p>
        <form id="login-form">
          <label>Correo
            <input name="email" type="email" value="owner@criadero.local" required autocomplete="email">
          </label>
          <label>Contraseña
            <input name="password" type="password" value="admin123" required autocomplete="current-password">
          </label>
          <button class="btn primary" type="submit">Iniciar sesion</button>
        </form>
        <p style="font-size:11px;color:var(--muted);margin-top:16px;">Demo: owner@criadero.local / admin123</p>
      </div>
    </div>
  `;
}

export function renderAcceptInvite(token) {
  return `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">CA</div>
        <h1>Aceptar invitacion</h1>
        <p class="sub">Crea tu cuenta de administrador</p>
        <form id="accept-form">
          <label>Nombre completo
            <input name="name" required autocomplete="name">
          </label>
          <label>Contraseña
            <input name="password" type="password" required minlength="6" autocomplete="new-password">
          </label>
          <label>Confirmar contraseña
            <input name="confirm" type="password" required minlength="6" autocomplete="new-password">
          </label>
          <button class="btn primary" type="submit">Crear cuenta</button>
        </form>
      </div>
    </div>
  `;
}
