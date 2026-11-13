import { expect, test as setup } from '@playwright/test';
import { LoginPage } from './pages/login.page';

const SESSAO = 'e2e/.auth/cliente.json';

// Roda uma vez antes de todos os testes (projeto "setup" no playwright.config.ts).
// Faz o login de verdade no BFF e grava cookies + localStorage num arquivo.
setup('autentica a cliente Ana', async ({ page }) => {
  const login = new LoginPage(page);
  await login.abrir();
  await login.entrar('123.456.789-09', 'segredo123');

  await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
  await page.context().storageState({ path: SESSAO });
});
