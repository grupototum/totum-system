import { test, expect } from "@playwright/test";

// Smoke: verifica que rotas críticas carregam sem crash de JS
// Executa sem autenticação — testa apenas o que é público ou que redireciona corretamente.

test.describe("Smoke — rotas públicas", () => {
  test("raiz redireciona para login quando não autenticado", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("página /login carrega sem erro de JS", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("Warning:"))).toHaveLength(0);
  });

  test("rota inexistente exibe 404 ou redireciona", async ({ page }) => {
    await page.goto("/rota-que-nao-existe-xyz");
    // Ou exibe página 404, ou redireciona para login
    const url = page.url();
    const body = await page.textContent("body");
    const isHandled =
      url.includes("/login") ||
      (body?.toLowerCase().includes("não encontrad") ?? false) ||
      (body?.toLowerCase().includes("not found") ?? false);
    expect(isHandled).toBe(true);
  });
});

test.describe("Smoke — app autenticado", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
  });

  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL e E2E_PASSWORD não definidos — pule este grupo");
      return;
    }

    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /senha/i }).fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("dashboard principal carrega sem erro de JS", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("Warning:"))).toHaveLength(0);
  });

  test("página de tarefas carrega", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/tarefas");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("Warning:"))).toHaveLength(0);
    await expect(page.locator("body")).toBeVisible();
  });

  test("página de clientes carrega", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");

    expect(errors.filter((e) => !e.includes("Warning:"))).toHaveLength(0);
  });
});
