import { expect, test } from './fixtures';

/*
 * Tags e steps: organizam a suíte e o relatório.
 *
 *   npx playwright test --grep @smoke        só os testes com a tag
 *   npx playwright test --grep-invert @lento todos, menos os lentos
 *   npx playwright test --debug              abre o Inspector e pausa no primeiro passo
 *
 * Dentro de um teste, await page.pause() também abre o Inspector naquele ponto.
 */
test('Pix ponta a ponta', { tag: '@smoke' }, async ({ page }) => {
  await test.step('abrir a tela do Pix', async () => {
    await page.goto('/pix');
    await expect(page.getByRole('heading', { name: 'Pix' })).toBeVisible();
  });

  await test.step('preencher com um favorito', async () => {
    await page.getByRole('button', { name: 'Mãe' }).click();
    await page.getByLabel('Valor').fill('25');
    // await page.pause(); // descomente para investigar a tela aqui
  });

  await test.step('enviar e conferir o comprovante', async () => {
    await page.getByRole('button', { name: 'Enviar Pix' }).click();
    await expect(page.getByRole('status')).toContainText('Comprovante PIX-');
  });
});

test('extrato com rede lenta', { tag: ['@lento', '@extrato'] }, async ({ page }) => {
  test.slow(); // triplica o timeout deste teste

  await page.route('**/api/extrato', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.continue();
  });

  await page.goto('/extrato');
  await expect(page.getByRole('table', { name: 'Movimentações' })).toBeVisible();
});
