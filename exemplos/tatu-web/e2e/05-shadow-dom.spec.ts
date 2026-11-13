import { expect, test } from './fixtures';

/*
 * Shadow DOM aparece em dois lugares neste app:
 *   <tatu-cartao-saldo>   componente Angular com ViewEncapsulation.ShadowDom
 *   <tatu-pix-favoritos>  Web Component nativo, como um MFE de outro time
 *
 * Os locators do Playwright atravessam shadow roots ABERTOS sozinhos.
 * Exceções: XPath não atravessa, e shadow root fechado (mode: 'closed') não é suportado.
 */
test.describe('Shadow DOM', () => {
  test('o saldo está mesmo dentro de um shadow root', async ({ page }) => {
    await page.goto('/inicio');

    const temShadowRoot = await page
      .locator('tatu-cartao-saldo')
      .evaluate((host) => host.shadowRoot !== null);

    expect(temShadowRoot).toBe(true);
  });

  test('getByTestId e getByRole encontram elementos dentro dele', async ({ page }) => {
    await page.goto('/inicio');

    await expect(page.getByTestId('saldo')).toContainText('1.520,75');
    await expect(page.getByRole('region', { name: 'Saldo' })).toBeVisible();
  });

  test('clique dentro do shadow root funciona igual', async ({ page }) => {
    await page.goto('/inicio');

    await page.getByRole('button', { name: 'Ocultar saldo' }).click();

    await expect(page.getByTestId('saldo')).not.toContainText('1.520,75');
    await expect(page.getByRole('button', { name: 'Mostrar saldo' })).toBeVisible();
  });

  test('CSS atravessa o shadow root, XPath não', async ({ page }) => {
    await page.goto('/inicio');

    // CSS: host + elemento interno, sem nenhum ">>>" ou "::shadow".
    await expect(page.locator('tatu-cartao-saldo .valor')).toBeVisible();

    // XPath: não enxerga o que está dentro do shadow root.
    await expect(page.locator('xpath=//p[@data-testid="saldo"]')).toHaveCount(0);
  });

  test('Web Component nativo: favorito preenche a chave Pix', async ({ pix }) => {
    await pix.abrir();

    await pix.favorito('Mãe').click();

    await expect(pix.chave).toHaveValue('mae@tatu.com.br');
  });

  test('restringir a busca ao componente evita ambiguidade', async ({ page, pix }) => {
    await pix.abrir();

    // Útil quando o mesmo texto existe dentro e fora do componente.
    const favoritos = page.locator('tatu-pix-favoritos');
    await favoritos.getByRole('button', { name: 'Síndico' }).click();

    await expect(pix.chave).toHaveValue('11999990000');
  });
});
