import { expect, test } from './fixtures';

/*
 * Um teste que conta a própria história no relatório HTML.
 *
 *   annotation    links e notas que aparecem no topo do teste (chamado, regra de negócio)
 *   tag           vira filtro clicável no relatório (@pix)
 *   test.step     cada passo vira um item recolhível, com o tempo de cada um
 *   testInfo.attach   anexa o que ajuda a investigar: JSON da resposta, imagem, log
 *
 *   npm run e2e -- e2e/12-relatorio.spec.ts
 *   npm run e2e:report
 */
test(
  'Pix de R$ 25 gera comprovante',
  {
    tag: '@pix',
    annotation: [
      { type: 'issue', description: 'https://jira.tatu.test/browse/PIX-142' },
      { type: 'regra', description: 'Pix só sai até o valor do saldo disponível' },
    ],
  },
  async ({ page }, testInfo) => {
    await test.step('abrir a tela do Pix', async () => {
      await page.goto('/pix');
      await expect(page.getByRole('heading', { name: 'Pix' })).toBeVisible();
    });

    const resposta = page.waitForResponse('**/api/pix');

    await test.step('enviar R$ 25 para a Mãe', async () => {
      await page.getByRole('button', { name: 'Mãe' }).click();
      await page.getByLabel('Valor').fill('25');
      await page.getByRole('button', { name: 'Enviar Pix' }).click();
    });

    await test.step('conferir o comprovante', async () => {
      await expect(page.getByRole('status')).toContainText('Comprovante PIX-');
    });

    // Anexos: aparecem no fim do teste, no relatório HTML
    await testInfo.attach('resposta do BFF', {
      body: JSON.stringify(await (await resposta).json(), null, 2),
      contentType: 'application/json',
    });
    await testInfo.attach('comprovante', {
      body: await page.getByRole('status').screenshot(),
      contentType: 'image/png',
    });
  },
);
