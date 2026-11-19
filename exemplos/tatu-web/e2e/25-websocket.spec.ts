import { expect, test } from './fixtures';

/*
 * WebSocket: cotação ao vivo.
 *
 *   routeWebSocket                 intercepta a conexão, como o page.route faz com HTTP
 *   ws.send / ws.close             o teste faz o papel do servidor
 *   ws.connectToServer()           liga no servidor de verdade e deixa mexer no meio
 */

const tique = (valor: number, hora = '10:00:00') => JSON.stringify({ moeda: 'USD', valor, hora });

test.describe('Cotação ao vivo', () => {
  test('servidor de verdade: a cotação chega sozinha', async ({ page }) => {
    await page.goto('/cotacao');

    await expect(page.getByRole('status')).toHaveText('Ao vivo');
    await expect(page.getByText(/^Dólar agora: R\$/)).toBeVisible();
  });

  test('servidor de mentira: a tela mostra o que o teste mandar', async ({ page }) => {
    await page.routeWebSocket('**/ws/cotacao', (ws) => {
      ws.send(tique(5.5, '10:00:00'));
      ws.send(tique(5.6, '10:00:01'));
    });

    await page.goto('/cotacao');

    await expect(page.getByText('Dólar agora: R$ 5,60')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Últimas atualizações' }).getByRole('listitem')).toHaveCount(2);
  });

  test('o servidor cai: a tela avisa e reconecta', async ({ page }) => {
    let conexoes = 0;
    await page.routeWebSocket('**/ws/cotacao', (ws) => {
      conexoes += 1;
      if (conexoes === 1) {
        ws.send(tique(5.5));
        ws.close({ code: 1011, reason: 'queda' });
      } else {
        ws.send(tique(5.7, '10:00:05'));
      }
    });

    await page.goto('/cotacao');
    await expect(page.getByRole('status')).toHaveText('Conexão perdida. Tentando de novo...');

    // A tela tenta de novo sozinha (2 s depois)
    await expect(page.getByText('Dólar agora: R$ 5,70')).toBeVisible();
    expect(conexoes).toBe(2);
  });

  test('servidor de verdade, mensagem alterada no meio do caminho', async ({ page }) => {
    await page.routeWebSocket('**/ws/cotacao', (ws) => {
      const servidor = ws.connectToServer();
      servidor.onMessage((mensagem) => {
        ws.send(JSON.stringify({ ...JSON.parse(String(mensagem)), valor: 9.99 }));
      });
    });

    await page.goto('/cotacao');

    await expect(page.getByText('Dólar agora: R$ 9,99')).toBeVisible();
  });
});
