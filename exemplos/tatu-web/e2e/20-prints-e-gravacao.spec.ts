import { expect, test } from './fixtures';

/*
 * Prints e gravação.
 *
 *   page.screenshot          a tela inteira (fullPage) ou só o visível
 *   locator.screenshot       só um pedaço
 *   mask                     esconde dado sensível no print (saldo, CPF)
 *   page.screencast          grava vídeo de um trecho, com os cliques anotados
 *   showChapter              um "capítulo" no vídeo, para narrar a demo
 *
 * No config: screenshot: 'only-on-failure', video: 'retain-on-failure' e
 * trace: 'on-first-retry' gravam sozinhos quando um teste falha.
 */

test.describe('Prints e gravação', () => {
  test('página inteira, um pedaço e dado sensível mascarado', async ({ page }, testInfo) => {
    await page.goto('/extrato');
    const tabela = page.getByRole('table', { name: 'Movimentações' });
    await expect(tabela).toBeVisible();

    await testInfo.attach('extrato-inteiro.png', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await testInfo.attach('so-a-tabela.png', { body: await tabela.screenshot(), contentType: 'image/png' });

    await page.goto('/inicio');
    await expect(page.getByTestId('saldo')).toBeVisible();
    await testInfo.attach('saldo-mascarado.png', {
      body: await page.screenshot({ mask: [page.getByTestId('saldo')], maskColor: '#161A22' }),
      contentType: 'image/png',
    });
  });

  test('vídeo de um trecho, com cliques anotados e capítulos', async ({ page }, testInfo) => {
    const video = testInfo.outputPath('pix.webm');
    await page.screencast.start({ path: video, size: { width: 1280, height: 720 } });
    await page.screencast.showActions({ position: 'bottom' });

    await page.goto('/pix');
    await page.screencast.showChapter('Pix para a Mãe', { description: 'favorito, valor e envio' });
    await page.getByRole('button', { name: 'Mãe' }).click();
    await page.getByLabel('Valor').fill('25');
    await page.getByRole('button', { name: 'Enviar Pix' }).click();
    await expect(page.getByRole('status')).toContainText('Comprovante PIX-');

    await page.screencast.stop();
    await testInfo.attach('pix.webm', { path: video, contentType: 'video/webm' });
  });
});
