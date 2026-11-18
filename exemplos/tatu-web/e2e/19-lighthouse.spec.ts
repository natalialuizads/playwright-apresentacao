import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';
import { expect, test } from './fixtures';

/*
 * Lighthouse dentro do Playwright: notas de performance, acessibilidade e
 * boas práticas, com o relatório HTML do Lighthouse anexado ao do Playwright.
 *
 *   npm run e2e:lighthouse
 *
 * O Lighthouse se conecta ao navegador pela porta de depuração do Chromium.
 * Fica num projeto próprio (lighthouse) porque é lento: não roda com a suíte comum.
 * Rode contra o build de produção para a nota de performance valer alguma coisa;
 * contra o ng serve de dev, confira só acessibilidade e boas práticas.
 */
test('Lighthouse da tela de login', { tag: '@lighthouse' }, async ({ baseURL }, testInfo) => {
  test.slow();
  const porta = 9222 + testInfo.workerIndex;
  const navegador = await chromium.launch({
    args: [`--remote-debugging-port=${porta}`],
    channel: process.env['PW_CANAL'],
  });

  try {
    const resultado = await lighthouse(
      `${baseURL}/login`,
      { port: porta, output: 'html', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] },
      desktop,
    );
    const notas = Object.fromEntries(
      Object.entries(resultado!.lhr.categories).map(([nome, c]) => [nome, Math.round((c.score ?? 0) * 100)]),
    );

    await testInfo.attach('lighthouse.html', { body: String(resultado!.report), contentType: 'text/html' });
    await testInfo.attach('notas.json', { body: JSON.stringify(notas, null, 2), contentType: 'application/json' });

    expect(notas['accessibility'], 'nota de acessibilidade').toBeGreaterThanOrEqual(90);
    expect(notas['best-practices'], 'nota de boas práticas').toBeGreaterThanOrEqual(90);
  } finally {
    await navegador.close();
  }
});
