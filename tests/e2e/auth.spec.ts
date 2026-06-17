import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test("página de login renderiza corretamente", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Totum/i);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /senha/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("exibe erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill("invalido@teste.com");
    await page.getByRole("textbox", { name: /senha/i }).fill("senhaerrada");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(
      page.getByText(/inválid|incorret|erro|invalid/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test("login com sucesso redireciona para dashboard", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL e E2E_PASSWORD não definidos");
      return;
    }

    await page.goto("/login");

    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.getByRole("textbox", { name: /senha/i }).fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
