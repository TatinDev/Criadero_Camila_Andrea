import { test, expect } from "@playwright/test";

test("healthz responde ok", async ({ page }) => {
  const res = await page.goto("/healthz");
  expect(res?.status()).toBe(200);
  const json = await res?.json();
  expect(json.status).toBe("ok");
});

test("pagina principal carga sin login", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app")).toBeVisible();
});

test("navegacion a modulos principales", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app");
  const buttons = page.locator(".nav-item");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
});

test("dashboard carga", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app");
  await expect(page.locator("#app")).toBeVisible();
});

test("login muestra formulario", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".nav-item");
  const loginBtns = page.locator("text=Iniciar sesion");
  if (await loginBtns.count() > 0) {
    await loginBtns.first().click();
    await expect(page.locator("input[type=email]")).toBeVisible();
  }
});
