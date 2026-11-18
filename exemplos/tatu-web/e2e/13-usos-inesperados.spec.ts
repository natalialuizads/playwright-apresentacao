import { expect, test } from './fixtures';

/*
 * Usos do Playwright que quase ninguém pensa, e que pegam problemas que
 * nenhum teste funcional pega:
 *
 *   1. zero erro no console           page.on('console') e page.on('pageerror')
 *   2. nada de dado pessoal na URL    page.on('request'), e só os domínios esperados
 *   3. chamadas duplicadas à API      contar requests por tela
 *   4. estrutura sem pixel            toMatchAriaSnapshot
 *   5. rede caiu e voltou             context.setOffline
 *   6. relógio controlado             page.clock: sessão expirando, horário de corte
 *   7. PDF e capturas para o manual   page.pdf e screenshot como anexo
 *
 * O 8º uso, o monitoramento sintético, está em scripts/vigia.mjs.
 */

const CPF = '123.456.789-09';
const CPF_SO_DIGITOS = CPF.replace(/\D/g, '');

test.describe('Usos que ninguém pensa', () => {
  test('1. nenhuma tela solta erro no console', async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });
    page.on('pageerror', (erro) => erros.push(erro.message));

    for (const tela of ['/inicio', '/extrato', '/pix']) {
      await page.goto(tela);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }

    expect(erros).toEqual([]);
  });

  test.describe('deslogado', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('2. o CPF nunca vai na URL e nada sai para domínio desconhecido', async ({ page, login }) => {
      const urls: string[] = [];
      page.on('request', (req) => urls.push(req.url()));

      await login.abrir();
      await login.entrar(CPF, 'segredo123');
      await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();

      const comCpf = urls.filter((url) => {
        const texto = decodeURIComponent(url);
        return texto.includes(CPF) || texto.includes(CPF_SO_DIGITOS);
      });
      expect(comCpf, 'URLs com CPF (vão parar em log, proxy e analytics)').toEqual([]);

      const permitidos = ['localhost:4200'];
      const desconhecidos = urls.filter((url) => !permitidos.includes(new URL(url).host));
      expect(desconhecidos, 'chamadas para fora da lista').toEqual([]);
    });
  });

  test('3. a tela inicial chama cada API uma vez só', async ({ page }) => {
    const chamadas: Record<string, number> = {};
    page.on('request', (req) => {
      const { pathname } = new URL(req.url());
      if (pathname.startsWith('/api/')) chamadas[pathname] = (chamadas[pathname] ?? 0) + 1;
    });

    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Cotação' })).toContainText('Dólar hoje');

    // Um subscribe a mais no Angular e esta conta vira 2: o BFF agradece o teste.
    expect(chamadas).toEqual({ '/api/conta': 1, '/api/cotacao': 1 });
  });

  test('4. a estrutura da tela, sem comparar pixel', async ({ page }) => {
    await page.goto('/inicio');

    await expect(page.getByRole('navigation', { name: 'Atalhos' })).toMatchAriaSnapshot(`
      - navigation "Atalhos":
        - link "Extrato"
        - link "Pix"
        - button "Sair"
    `);
  });

  test('5. a rede cai, a tela avisa; a rede volta, a tela se recupera', async ({ page, context }) => {
    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();

    await context.setOffline(true);
    await page.getByRole('link', { name: 'Extrato' }).click();
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o extrato');

    await context.setOffline(false);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('table', { name: 'Movimentações' })).toBeVisible();
  });

  test.describe('relógio controlado', () => {
    test.use({ timezoneId: 'America/Sao_Paulo' });

    // Telas que dependem de hora são as mais difíceis de testar "na mão".
    // Aqui são páginas mínimas, para o exemplo rodar sozinho; a API é a mesma num app real.

    test('6a. a sessão expira depois de 5 minutos parado', async ({ page }) => {
      await page.clock.install();
      await page.setContent(`
        <p role="status">Sessão ativa</p>
        <script>
          setTimeout(() => {
            document.querySelector('[role=status]').textContent = 'Sua sessão expirou. Entre de novo.';
          }, 5 * 60 * 1000);
        </script>`);

      await page.clock.fastForward('04:59');
      await expect(page.getByRole('status')).toHaveText('Sessão ativa');

      await page.clock.fastForward('00:02');
      await expect(page.getByRole('status')).toHaveText('Sua sessão expirou. Entre de novo.');
    });

    test('6b. o limite do Pix muda às 20h', async ({ page }) => {
      const tela = `
        <p role="status"></p>
        <script>
          {
          const hora = new Date().getHours();
          const noturno = hora >= 20 || hora < 6;
          document.querySelector('[role=status]').textContent =
            noturno ? 'Limite noturno: R$ 1.000,00' : 'Limite diurno: R$ 20.000,00';
          }
        </script>`;

      await page.clock.setFixedTime(new Date('2026-11-20T19:59:00-03:00'));
      await page.setContent(tela);
      await expect(page.getByRole('status')).toHaveText('Limite diurno: R$ 20.000,00');

      await page.clock.setFixedTime(new Date('2026-11-20T20:00:00-03:00'));
      await page.setContent(tela);
      await expect(page.getByRole('status')).toHaveText('Limite noturno: R$ 1.000,00');
    });
  });

  test('7. PDF do extrato e capturas para o manual', { tag: '@docs' }, async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'page.pdf só existe no Chromium');

    await page.goto('/extrato');
    await expect(page.getByRole('table', { name: 'Movimentações' })).toBeVisible();
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await testInfo.attach('extrato.pdf', { body: pdf, contentType: 'application/pdf' });

    // As capturas do manual se atualizam sozinhas a cada release.
    for (const tela of ['inicio', 'extrato', 'pix']) {
      await page.goto(`/${tela}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await testInfo.attach(`manual-${tela}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  });
});
