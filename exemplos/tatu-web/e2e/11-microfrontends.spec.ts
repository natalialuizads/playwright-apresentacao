import { expect, test, type Page } from '@playwright/test';

/*
 * Microfrontends: um shell carrega um remote (Module Federation, Native
 * Federation ou um Web Component publicado por outro time) a partir de outra URL.
 *
 * Aqui o shell e o remote são simulados com page.route, então o teste roda
 * sem Angular e sem servidor. Os padrões são os mesmos num shell de verdade:
 *
 *   1. remote fora do ar  -> o shell mostra o fallback, não uma tela em branco
 *   2. contrato           -> o remote registra o elemento que o shell espera
 *   3. Shadow DOM         -> os locators entram no componente de outro time
 *   4. BFF na borda       -> o remote é testado com dados controlados
 */

const SHELL = 'https://shell.tatu.test/';
const REMOTE = 'https://extrato.tatu.test/remoteEntry.js';
// O remote chama o próprio BFF em outra origem, então a resposta precisa de CORS.
const CORS = { 'access-control-allow-origin': '*' };

// O shell: tenta carregar o remote e, se falhar, mostra um aviso.
const shellHtml = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Shell | Banco Tatu</title></head>
<body>
  <main>
    <h1>Banco Tatu</h1>
    <div id="slot"><p>Carregando o extrato...</p></div>
  </main>
  <script>
    const s = document.createElement('script');
    s.src = '${REMOTE}';
    s.onload = () => {
      document.getElementById('slot').innerHTML = '<tatu-extrato-remoto></tatu-extrato-remoto>';
    };
    s.onerror = () => {
      document.getElementById('slot').innerHTML =
        '<p role="alert">O extrato está indisponível agora. Tente de novo em instantes.</p>';
    };
    document.head.appendChild(s);
  </script>
</body></html>`;

// O remote: um Web Component com Shadow DOM aberto que busca o próprio BFF.
const remoteJs = `
customElements.define('tatu-extrato-remoto', class extends HTMLElement {
  async connectedCallback() {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = '<section aria-label="Extrato"><h2>Extrato</h2><ul></ul></section>';
    const itens = await fetch('https://extrato.tatu.test/api/extrato').then((r) => r.json());
    root.querySelector('ul').innerHTML = itens
      .map((i) => '<li>' + i.descricao + ': ' + i.valor + '</li>')
      .join('');
  }
});`;

async function abrirShell(page: Page) {
  await page.route(SHELL, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: shellHtml }));
  await page.goto(SHELL);
}

test.describe('Microfrontends', () => {
  test('remote fora do ar: o shell mostra o fallback', async ({ page }) => {
    await page.route(REMOTE, (route) => route.abort());

    await abrirShell(page);

    await expect(page.getByRole('alert')).toContainText('indisponível');
    await expect(page.getByRole('heading', { name: 'Banco Tatu' })).toBeVisible();
  });

  test('contrato: o remote registra o elemento que o shell usa', async ({ page }) => {
    await page.route(REMOTE, (route) => route.fulfill({ contentType: 'text/javascript', body: remoteJs }));
    await page.route('**/api/extrato', (route) => route.fulfill({ json: [], headers: CORS }));

    await abrirShell(page);

    await expect
      .poll(() => page.evaluate(() => !!customElements.get('tatu-extrato-remoto')))
      .toBe(true);
  });

  test('Shadow DOM e BFF na borda: o componente de outro time com dados controlados', async ({ page }) => {
    await page.route(REMOTE, (route) => route.fulfill({ contentType: 'text/javascript', body: remoteJs }));
    await page.route('**/api/extrato', (route) =>
      route.fulfill({ json: [{ descricao: 'Salário', valor: 'R$ 5.000,00' }], headers: CORS }));

    await abrirShell(page);

    // getByRole atravessa o Shadow DOM aberto do remote
    const extrato = page.getByRole('region', { name: 'Extrato' });
    await expect(extrato.getByRole('heading', { name: 'Extrato' })).toBeVisible();
    await expect(extrato.getByRole('listitem')).toHaveText(['Salário: R$ 5.000,00']);
  });
});
