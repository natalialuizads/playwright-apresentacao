import { expect, test } from './fixtures';

/*
 * Teste instável: achar a causa e marcar o que ainda não dá para consertar.
 *
 *   npx playwright test e2e/arquivo.spec.ts --repeat-each=30 --workers=4
 *       repete até a falha aparecer; abra o trace da repetição que falhou
 *   npx playwright test --fail-on-flaky-tests
 *       no CI: teste que só passou no retry também quebra o pipeline
 *   npx playwright test --last-failed
 *       roda de novo só o que falhou
 *
 *   test.fail()    "este teste falha, e sabemos": se um dia passar, avisa
 *   test.fixme()   "ainda não roda": pulado, mas aparece no relatório
 */

test.describe('Instáveis', () => {
  test('a causa mais comum: ler a tela sem esperar (versão errada)', async ({ page, bff }) => {
    test.fail(true, 'Exemplo do erro: isVisible() responde na hora, sem esperar o BFF');
    await bff.lento('**/api/pix', 800);
    await page.goto('/pix');
    await page.getByRole('button', { name: 'Mãe' }).click();
    await page.getByLabel('Valor').fill('10');
    await page.getByRole('button', { name: 'Enviar Pix' }).click();

    // ERRADO: isVisible() responde agora; com o BFF lento, o comprovante ainda não apareceu.
    // Numa máquina rápida passa, no CI cheio falha: é o teste instável clássico.
    expect(await page.getByRole('status').isVisible()).toBe(true);
  });

  test('a mesma coisa, do jeito certo: o expect espera', async ({ page, bff }) => {
    await bff.lento('**/api/pix', 800);
    await page.goto('/pix');
    await page.getByRole('button', { name: 'Mãe' }).click();
    await page.getByLabel('Valor').fill('10');
    await page.getByRole('button', { name: 'Enviar Pix' }).click();

    await expect(page.getByRole('status')).toContainText('Comprovante');
  });

  test.fixme('Pix agendado: aguardando a funcionalidade', async ({ page }) => {
    await page.goto('/pix');
    await page.getByLabel('Data do Pix').fill('2026-12-01');
  });
});
