import { expect, test } from './fixtures';

test.describe('Browser, context e page na prática', () => {
  test('duas sessões isoladas no mesmo navegador', async ({ browser }) => {
    // Cada context é um "apartamento": cookies e localStorage só dele.
    // No Playwright Test, browser.newContext() herda o "use" do config
    // (baseURL, storageState...). Por isso o visitante zera a sessão de propósito.
    const logado = await browser.newContext({ storageState: 'e2e/.auth/cliente.json' });
    const visitante = await browser.newContext({ storageState: { cookies: [], origins: [] } });

    const paginaDaAna = await logado.newPage();
    const paginaDoVisitante = await visitante.newPage();

    await paginaDaAna.goto('/inicio');
    await paginaDoVisitante.goto('/inicio');

    await expect(paginaDaAna.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
    await expect(paginaDoVisitante).toHaveURL(/\/login$/); // não herdou a sessão

    await logado.close();
    await visitante.close();
  });
});

test.describe('Locators: filtrar e encadear', () => {
  test('acha a linha certa da tabela', async ({ page }) => {
    await page.goto('/extrato');

    const linhas = page
      .getByRole('table', { name: 'Movimentações' })
      .locator('tbody')
      .getByRole('row');

    await expect(linhas).toHaveCount(3);
    await expect(linhas.first()).toContainText('Salário');

    // filter + hasText: a linha que contém "Mercado"
    const mercado = linhas.filter({ hasText: 'Mercado' });
    // encadear: dentro da linha, a terceira célula
    await expect(mercado.getByRole('cell').nth(2)).toHaveText('-R$ 312,40');

    // hasNotText: as linhas sem valor negativo
    await expect(linhas.filter({ hasNotText: '-R$' })).toHaveCount(2);
  });

  test('filter + has: o item que contém um botão', async ({ page }) => {
    await page.goto('/pix');

    const itemDaMae = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Mãe' }) });

    await expect(itemDaMae).toHaveCount(1);
  });
});

test.describe('Ações mais usadas', () => {
  test('preenche, escolhe, marca e envia com Enter', async ({ page }) => {
    await page.goto('/pix');

    await page.getByLabel('Chave Pix').fill('mae@tatu.com.br');       // digita
    await page.getByLabel('Valor').fill('150');
    await page.getByLabel('Conta de origem').selectOption('Poupança'); // <select>
    await page.getByLabel('Salvar como favorito').check();             // checkbox
    await page.getByLabel('Valor').press('Enter');                    // tecla

    await expect(page.getByRole('status')).toContainText('Pix enviado!');
    await expect(page.getByText('Debitado de: Poupança')).toBeVisible();
    await expect(page.getByText('Chave salva nos favoritos.')).toBeVisible();
  });

  test('navega por link e confere a URL', async ({ page }) => {
    await page.goto('/inicio');

    await page.getByRole('link', { name: 'Extrato' }).click();

    await expect(page).toHaveURL(/\/extrato$/);
    await expect(page).toHaveTitle('Extrato | Banco Tatu');
  });

  test('limpa e desmarca', async ({ page }) => {
    await page.goto('/pix');
    const favorito = page.getByLabel('Salvar como favorito');

    await page.getByLabel('Chave Pix').fill('algo');
    await page.getByLabel('Chave Pix').clear();
    await favorito.check();
    await favorito.uncheck();

    await expect(page.getByLabel('Chave Pix')).toBeEmpty();
    await expect(favorito).not.toBeChecked();
  });
});
