import { devices } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * Celular: o mesmo teste, com tela, toque e user agent de um aparelho.
 *
 *   devices['Pixel 7']    viewport, escala, isMobile, hasTouch e user agent
 *   tap()                 toque, em vez de clique
 *
 * Para rodar a suíte inteira em celular, Firefox e Safari (WebKit), use
 * npm run e2e:navegadores (playwright.navegadores.config.ts).
 */

test.use(devices['Pixel 7']);

test.describe('No celular', () => {
  test('as telas cabem na largura, sem rolagem lateral', async ({ page }) => {
    for (const tela of ['/inicio', '/extrato', '/pix', '/documentos', '/servicos']) {
      await page.goto(tela);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(sobra, `rolagem lateral em ${tela}`).toBeLessThanOrEqual(0);
    }
  });

  test('toque abre o Pix e o navegador se apresenta como celular', async ({ page, isMobile }) => {
    expect(isMobile).toBe(true);
    await page.goto('/inicio');

    await page.getByRole('link', { name: 'Pix', exact: true }).tap();

    await expect(page).toHaveURL(/\/pix$/);
    expect(await page.evaluate(() => navigator.userAgent)).toContain('Android');
  });
});
