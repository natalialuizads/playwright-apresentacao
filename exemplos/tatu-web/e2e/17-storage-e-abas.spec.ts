import { expect, test } from './fixtures';

/*
 * localStorage, sessionStorage, redirecionamento e abas.
 *
 *   localStorage     o storageState salva (é assim que o login é reaproveitado)
 *   page.localStorage e page.sessionStorage   leem e escrevem sem page.evaluate
 *   sessionStorage   o storageState NÃO salva: guarde e restaure com addInitScript
 *                    (o MSAL do Azure AD usa sessionStorage por padrão: veja referencias/msal)
 *   redirecionamento expect(page).toHaveURL espera a navegação terminar
 *   aba e popup      page.waitForEvent('popup') pega a página nova
 */

test.describe('Storage', () => {
  test('localStorage: o app guarda o token e o storageState leva junto', async ({ page, context, baseURL }) => {
    await page.goto('/inicio');

    const token = await page.localStorage.getItem('tatu.token');
    expect(token).toBe('token-ana');

    const estado = await context.storageState();
    const origem = estado.origins.find((o) => o.origin === new URL(baseURL!).origin);
    expect(origem?.localStorage).toContainEqual({ name: 'tatu.token', value: 'token-ana' });
  });

  test('sessionStorage: o storageState não salva; guarde e restaure você', async ({ page, browser, baseURL }) => {
    await page.goto('/inicio');
    // Como o MSAL faz: o token fica no sessionStorage
    await page.sessionStorage.setItem('msal.idtoken', 'token-do-azure');

    const estado = await page.context().storageState();
    expect(JSON.stringify(estado)).not.toContain('msal.idtoken');

    // Guardar: lê tudo do sessionStorage (no setup, grave num arquivo)
    const sessao = await page.sessionStorage.items();

    // Restaurar num contexto novo, antes de qualquer script do app
    const contexto = await browser.newContext({ baseURL });
    const origem = new URL(baseURL!).origin;
    await contexto.addInitScript(
      ({ dados, origem }) => {
        if (location.origin !== origem) return;
        for (const { name, value } of dados) sessionStorage.setItem(name, value);
      },
      { dados: sessao, origem },
    );
    const outra = await contexto.newPage();
    await outra.goto('/login');
    expect(await outra.sessionStorage.getItem('msal.idtoken')).toBe('token-do-azure');
    await contexto.close();
  });
});

test.describe('Redirecionamento e abas', () => {
  test.describe('sem sessão', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('rota protegida redireciona para o login, e o login leva ao início', async ({ page, login }) => {
      await page.goto('/extrato');
      await expect(page).toHaveURL(/\/login$/);

      await login.entrar('123.456.789-09', 'segredo123');
      await expect(page).toHaveURL(/\/inicio$/);
    });
  });

  test('nova aba: pega a página nova e testa nela', async ({ page }) => {
    await page.goto('/inicio');

    // Num app real, é o clique num link com target="_blank" ou num botão que chama window.open
    const novaAba = page.waitForEvent('popup');
    await page.evaluate(() => window.open('/extrato', '_blank'));
    const extrato = await novaAba;

    // A aba nova é do mesmo contexto: já está logada
    await expect(extrato.getByRole('table', { name: 'Movimentações' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible(); // a primeira continua lá
    await extrato.close();
  });
});
