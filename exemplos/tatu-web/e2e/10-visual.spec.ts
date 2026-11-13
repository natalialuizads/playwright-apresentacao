import { expect, test } from './fixtures';

/*
 * Regressão visual: compara a tela com uma imagem de referência (baseline).
 *
 * Primeira vez (cria as referências na sua máquina):
 *   npm run e2e:visual -- --update-snapshots
 * Depois:
 *   npm run e2e:visual
 *
 * A renderização muda entre sistemas operacionais (fontes), por isso o
 * Playwright guarda uma referência por plataforma. No CI, gere as referências
 * no mesmo sistema do pipeline (por exemplo, a imagem Docker oficial).
 */
test.describe('Visual', { tag: '@visual' }, () => {
  test('cartão de saldo', async ({ page }) => {
    await page.goto('/inicio');

    await expect(page.locator('tatu-cartao-saldo')).toHaveScreenshot('cartao-saldo.png');
  });

  test('tela inicial, escondendo o que muda', async ({ page }) => {
    await page.route('**/api/cotacao', (route) => route.fulfill({ json: { moeda: 'USD', valor: 5 } }));
    await page.goto('/inicio');
    await expect(page.getByTestId('saldo')).toBeVisible();

    await expect(page).toHaveScreenshot('inicio.png', {
      mask: [page.getByRole('region', { name: 'Cotação' })], // pinta por cima
      maxDiffPixelRatio: 0.01, // tolera 1% de pixels diferentes
    });
  });
});
