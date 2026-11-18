/*
 * REFERÊNCIA: login real no Azure AD (Entra ID) com MSAL, uma vez, no projeto setup.
 * Não roda neste projeto: precisa de um tenant e de um usuário de teste.
 * Copie para o e2e/ do seu app e ajuste.
 *
 * Antes de começar:
 *  - Use um usuário SÓ de teste, sem MFA. Peça ao time de identidade uma política de
 *    acesso condicional que dispense MFA só para esse usuário e só no ambiente de teste.
 *    Nunca use a sua conta.
 *  - O MSAL guarda os tokens no sessionStorage por padrão (cacheLocation). O storageState
 *    do Playwright salva cookies, localStorage e IndexedDB, mas NÃO sessionStorage.
 *    Por isso o setup grava o sessionStorage à parte e o fixture abaixo restaura.
 *    Alternativa: no build de teste, configure cacheLocation: 'localStorage'.
 *  - Os campos da tela da Microsoft não são seus: os seletores podem mudar. Confira no seu tenant.
 *  - Credenciais vêm de variáveis (AZURE_USUARIO, AZURE_SENHA), do cofre do CI.
 *
 * No playwright.config.ts:
 *   { name: 'setup', testMatch: /msal-azure-ad\.setup\.ts/ },
 *   { name: 'app', dependencies: ['setup'], use: { storageState: '.auth/azure.json' } },
 */
import { expect, test as setup } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

setup('login no Azure AD', async ({ page, baseURL }) => {
  await page.goto('/'); // o app redireciona para login.microsoftonline.com
  await page.waitForURL(/login\.microsoftonline\.com/);

  await page.locator('input[type="email"]').fill(process.env['AZURE_USUARIO']!);
  await page.getByRole('button', { name: /Avançar|Next/ }).click();
  await page.locator('input[type="password"]').fill(process.env['AZURE_SENHA']!);
  await page.getByRole('button', { name: /Entrar|Sign in/ }).click();

  // "Continuar conectado?" aparece em alguns tenants
  const continuar = page.getByRole('button', { name: /^(Não|No)$/ });
  if (await continuar.isVisible({ timeout: 5_000 }).catch(() => false)) await continuar.click();

  // De volta ao app, já logado
  await page.waitForURL(`${baseURL}/**`);
  await expect(page.getByRole('navigation')).toBeVisible();

  mkdirSync('.auth', { recursive: true });
  await page.context().storageState({ path: '.auth/azure.json' });
  // O que o MSAL guardou no sessionStorage, à parte
  writeFileSync('.auth/azure-session.json', JSON.stringify(await page.sessionStorage.items()));
});

/*
 * No seu fixtures.ts: restaura o sessionStorage em todo teste, antes do MSAL rodar.
 *
 * export const test = base.extend({
 *   context: async ({ context, baseURL }, use) => {
 *     const itens = JSON.parse(readFileSync('.auth/azure-session.json', 'utf8'));
 *     const origem = new URL(baseURL!).origin;
 *     await context.addInitScript(({ itens, origem }) => {
 *       if (location.origin !== origem) return;
 *       for (const { name, value } of itens) sessionStorage.setItem(name, value);
 *     }, { itens, origem });
 *     await use(context);
 *   },
 * });
 *
 * Os tokens expiram (em geral, em uma hora): o setup roda de novo a cada execução da suíte.
 * Para testes que não são do login, considere um modo de teste do app que troca o MSAL
 * por um provedor falso, e deixe só um ou dois testes passando pelo Azure AD de verdade.
 */
