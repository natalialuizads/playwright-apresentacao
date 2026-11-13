import { expect, test } from './fixtures';

test.describe('Mock avançado', () => {
  test('fetch: pega a resposta real e troca um campo só', async ({ page }) => {
    await page.route('**/api/conta', async (route) => {
      const resposta = await route.fetch(); // vai ao BFF de verdade
      const conta = await resposta.json();
      await route.fulfill({ response: resposta, json: { ...conta, saldo: 0 } });
    });

    await page.goto('/inicio');

    // O nome continua vindo do servidor; só o saldo foi trocado.
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
    await expect(page.getByTestId('saldo')).toContainText('0,00');
  });

  test('confere o que o front ENVIOU para a API', async ({ page, pix }) => {
    await pix.abrir();

    // Começa a esperar pela requisição ANTES de clicar.
    const pedido = page.waitForRequest('**/api/pix');
    await pix.preencherEEnviar('mae@tatu.com.br', 150);

    const corpo = (await pedido).postDataJSON();
    expect(corpo).toEqual({ chave: 'mae@tatu.com.br', valor: 150 });
    await expect(pix.comprovante).toContainText('Pix enviado! Comprovante PIX-');
  });

  test('confere o header de autenticação enviado', async ({ page }) => {
    const pedido = page.waitForRequest('**/api/conta');
    await page.goto('/inicio');

    expect((await pedido).headers()['authorization']).toBe('Bearer token-ana');
  });

  test('erro de negócio (422) mostra a mensagem do BFF', async ({ page, pix }) => {
    await page.route('**/api/pix', (route) =>
      route.fulfill({ status: 422, json: { mensagem: 'Limite noturno excedido' } }),
    );

    await pix.abrir();
    await pix.preencherEEnviar('11999990000', 50);

    await expect(pix.erro).toHaveText('Limite noturno excedido');
  });

  test('serviço de terceiro fora do ar: só a cotação some', async ({ page }) => {
    await page.route('**/api/cotacao', (route) => route.fulfill({ status: 503 }));

    await page.goto('/inicio');

    await expect(page.getByText('Cotação indisponível no momento.')).toBeVisible();
    // O resto da tela continua funcionando.
    await expect(page.getByTestId('saldo')).toContainText('1.520,75');
  });

  test('glob x regex: um route para várias URLs', async ({ page }) => {
    // Qualquer GET em /api/conta ou /api/cotacao cai aqui.
    await page.route(/\/api\/(conta|cotacao)$/, (route) => route.fulfill({ status: 500 }));

    await page.goto('/inicio');

    await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar sua conta.');
    await expect(page.getByText('Cotação indisponível no momento.')).toBeVisible();
  });
});

test.describe('Mock com a fixture "bff"', () => {
  test('mesma ideia, menos código', async ({ bff, extrato }) => {
    await bff.json('**/api/extrato', [{ data: '2026-11-05', descricao: 'Cinema', valor: -40 }]);

    await extrato.abrir();

    await expect(extrato.linhas).toHaveCount(1);
  });

  test('falha e sem rede com a fixture', async ({ bff, page }) => {
    await bff.falha('**/api/conta', 500);
    await bff.semRede('**/api/cotacao');

    await page.goto('/inicio');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Cotação indisponível no momento.')).toBeVisible();
  });
});
