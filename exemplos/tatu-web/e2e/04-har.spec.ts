import { expect, test } from './fixtures';

/*
 * HAR = gravação das respostas reais da rede num arquivo.
 *
 * Gravar (com o BFF de verdade no ar):
 *   Linux/macOS:  HAR_UPDATE=1 npx playwright test e2e/04-har.spec.ts
 *   PowerShell:   $env:HAR_UPDATE=1; npx playwright test e2e/04-har.spec.ts
 *
 * Depois, rodando normalmente, o teste usa só o arquivo: o BFF pode estar fora.
 */
const GRAVAR = !!process.env['HAR_UPDATE'];

test('extrato servido a partir de um arquivo HAR', async ({ page, extrato }) => {
  await page.routeFromHAR('e2e/hars/extrato.har', {
    url: '**/api/extrato',
    update: GRAVAR,
    updateContent: 'embed',
    updateMode: 'minimal',
  });

  await extrato.abrir();

  await expect(extrato.linhas).toHaveCount(3);
  await expect(extrato.linhas.first()).toContainText('Salário');
});
