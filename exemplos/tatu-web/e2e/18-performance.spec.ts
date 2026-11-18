import { expect, test } from './fixtures';

/*
 * Achar gargalo de performance com o Playwright.
 *
 *   Web Vitals        PerformanceObserver dentro da página (LCP, CLS)
 *   rede              request.timing(): as chamadas mais lentas da tela
 *   CPU fraca         CDP: Emulation.setCPUThrottlingRate (só Chromium)
 *   trace de CPU      browser.startTracing: abre no painel Performance do DevTools
 *
 * Os números vão como anexo no relatório HTML. Os limites são orçamentos:
 * ajuste para o seu app, e rode num ambiente estável (o ng serve de dev é mais lento que o build).
 */

test.describe('Performance', { tag: '@perf' }, () => {
  test('Web Vitals e as chamadas mais lentas da tela inicial', async ({ page }, testInfo) => {
    const chamadas: { url: string; ms: number }[] = [];
    page.on('requestfinished', (req) => {
      const t = req.timing();
      chamadas.push({ url: new URL(req.url()).pathname, ms: Math.round(t.responseEnd) });
    });

    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();

    const vitais = await page.evaluate(
      () =>
        new Promise<{ lcp: number; cls: number; ttfb: number }>((pronto) => {
          let cls = 0;
          new PerformanceObserver((l) => {
            for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) cls += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver((l) => {
            const entradas = l.getEntries();
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            pronto({ lcp: entradas[entradas.length - 1].startTime, cls, ttfb: nav.responseStart });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );

    const maisLentas = chamadas.sort((a, b) => b.ms - a.ms).slice(0, 5);
    await testInfo.attach('performance.json', {
      body: JSON.stringify({ vitais, maisLentas }, null, 2),
      contentType: 'application/json',
    });

    expect(vitais.lcp, 'LCP (ms)').toBeLessThan(2500);
    expect(vitais.cls, 'CLS').toBeLessThan(0.1);
  });

  test('o gargalo aparece: uma API lenta vira a primeira da lista', async ({ page, bff }) => {
    await bff.lento('**/api/conta', 1500);
    const chamadas: { url: string; ms: number }[] = [];
    page.on('requestfinished', (req) => chamadas.push({ url: new URL(req.url()).pathname, ms: req.timing().responseEnd }));

    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();

    const api = chamadas.filter((c) => c.url.startsWith('/api/')).sort((a, b) => b.ms - a.ms);
    expect(api[0].url).toBe('/api/conta');
    expect(api[0].ms).toBeGreaterThan(1400);
  });

  test('celular simples: CPU 4x mais lenta e trace de CPU para o DevTools', async ({ page, browser, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'CDP e tracing só no Chromium');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const arquivo = testInfo.outputPath('trace-cpu.json');
    await browser.startTracing(page, { path: arquivo, screenshots: true });
    const inicio = Date.now();
    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
    const ms = Date.now() - inicio;
    await browser.stopTracing();

    // Abra no Chrome: DevTools > Performance > Load profile
    await testInfo.attach('trace-cpu.json', { path: arquivo, contentType: 'application/json' });
    expect(ms, 'tempo até o saldo aparecer com CPU 4x mais lenta (ms)').toBeLessThan(8000);
  });
});
