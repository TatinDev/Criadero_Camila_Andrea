export function renderLogin() {
  return `
    <div class="login-shell">
      <div class="login-card">
        <div class="logo">CA</div>
        <h1>Criadero Camila Andrea</h1>
        <p class="sub">Gestion privada interna</p>
        <form id="login-form">
          <label>Correo
            <input name="email" type="email" value="owner@criadero.local" required>
          </label>
          <button class="btn primary" type="submit">Iniciar sesion</button>
        </form>
        <p style="font-size:11px;color:var(--muted);margin-top:16px;">Demo: owner@criadero.local / admin@criadero.local</p>
      </div>
    </div>
  `;
}
