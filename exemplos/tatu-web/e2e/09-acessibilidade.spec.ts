import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

/*
 * Acessibilidade automatizada com axe-core: pega uma parte dos problemas
 * (contraste, rótulos, papéis ARIA). Não substitui teste com leitor de tela.
 * O axe também analisa o que está dentro de Shadow DOM aberto.
 */
const TELAS = ['/inicio', '/extrato', '/pix'];

for (const tela of TELAS) {
  test(`${tela} sem violações WCAG A e AA`, async ({ page }, testInfo) => {
    await page.goto(tela);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Anexa o JSON ao relatório HTML: quando falhar, o detalhe já está lá.
    await testInfo.attach('axe-violacoes', {
      body: JSON.stringify(resultado.violations, null, 2),
      contentType: 'application/json',
    });

    expect(resultado.violations).toEqual([]);
  });
}

test('login sem violações, ignorando uma regra conhecida', async ({ page }) => {
  await page.goto('/login');

  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // exemplo: regra tratada em outra demanda
    .analyze();

  expect(resultado.violations).toEqual([]);
});

test('o axe pega problema de verdade: imagem sem alt e botão sem nome', async ({ page }) => {
  await page.setContent(`
    <main>
      <h1>Página de exemplo</h1>
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
      <button></button>
    </main>
  `);

  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const regras = resultado.violations.map((v) => v.id);

  expect(regras).toContain('image-alt');
  expect(regras).toContain('button-name');
});

test('escopo: analisa só um trecho da página', async ({ page }) => {
  await page.goto('/inicio');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const resultado = await new AxeBuilder({ page })
    .include('tatu-cartao-saldo') // só este componente
    .analyze();

  expect(resultado.violations).toEqual([]);
});
