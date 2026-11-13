import { expect, test } from './fixtures';

/*
 * As quatro respostas possíveis dentro de um page.route:
 *
 *   route.fulfill(...)   responde você mesmo (JSON, status, headers)
 *   route.abort(...)     derruba a conexão (rede fora do ar)
 *   route.continue(...)  deixa seguir para o servidor (pode mudar a requisição)
 *   route.fetch()        vai ao servidor e devolve a resposta para você editar
 *
 * Regra de ouro: registre o route ANTES da navegação que dispara a chamada.
 */
test.describe('Mock básico com page.route', () => {
  test('fulfill com JSON: lista controlada pelo teste', async ({ page, extrato }) => {
    await page.route('**/api/extrato', (route) =>
      route.fulfill({
        json: [
          { data: '2026-11-01', descricao: 'Padaria', valor: -18.5 },
          { data: '2026-11-02', descricao: 'Reembolso', valor: 50 },
        ],
      }),
    );

    await extrato.abrir();

    await expect(extrato.linhas).toHaveCount(2);
    await expect(extrato.linhas.first()).toContainText('Padaria');
  });

  test('fulfill com lista vazia: estado vazio', async ({ page, extrato }) => {
    await page.route('**/api/extrato', (route) => route.fulfill({ json: [] }));

    await extrato.abrir();

    await expect(extrato.vazio).toBeVisible();
  });

  test('fulfill com status 500: erro e "tentar novamente"', async ({ page, extrato }) => {
    let chamadas = 0;
    await page.route('**/api/extrato', async (route) => {
      chamadas += 1;
      if (chamadas === 1) {
        // Primeira chamada falha...
        await route.fulfill({ status: 500, json: { mensagem: 'Erro interno' } });
      } else {
        // ...a segunda segue para o BFF de verdade.
        await route.continue();
      }
    });

    await extrato.abrir();
    await expect(extrato.erro).toContainText('Não foi possível carregar o extrato.');

    await extrato.tentarNovamente.click();
    await expect(extrato.linhas).toHaveCount(3);
    expect(chamadas).toBe(2);
  });

  test('abort: rede caiu no meio do caminho', async ({ page, extrato }) => {
    await page.route('**/api/extrato', (route) => route.abort('internetdisconnected'));

    await extrato.abrir();

    await expect(extrato.erro).toBeVisible();
  });

  test('continue com atraso: dá para ver o "carregando"', async ({ page, extrato }) => {
    await page.route('**/api/extrato', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });

    await extrato.abrir();

    await expect(extrato.carregando).toHaveText('Carregando extrato...');
    await expect(extrato.tabela).toBeVisible();
  });
});
