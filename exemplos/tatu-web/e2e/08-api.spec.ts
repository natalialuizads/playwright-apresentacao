import { expect, test } from './fixtures';

/*
 * Playwright também testa API, sem abrir navegador: fixture "request".
 * As chamadas usam o baseURL do config (o ng serve, que repassa /api para o BFF).
 *
 * Bom para:
 *   - conferir o contrato do BFF a partir do repositório do front
 *   - preparar dados antes de um teste de tela (mais rápido que pela UI)
 */
const CLIENTE = { cpf: '123.456.789-09', senha: 'segredo123' };

test.describe('API do BFF', () => {
  test('login devolve token e nome', async ({ request }) => {
    const resposta = await request.post('/api/login', { data: CLIENTE });

    await expect(resposta).toBeOK();
    expect(await resposta.json()).toMatchObject({ nome: 'Ana', token: expect.any(String) });
  });

  test('senha errada devolve 401', async ({ request }) => {
    const resposta = await request.post('/api/login', { data: { ...CLIENTE, senha: 'x' } });

    expect(resposta.status()).toBe(401);
  });

  test('extrato com token devolve três lançamentos', async ({ request }) => {
    const { token } = await (await request.post('/api/login', { data: CLIENTE })).json();

    const extrato = await request.get('/api/extrato', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await expect(extrato).toBeOK();
    expect(await extrato.json()).toHaveLength(3);
  });

  test('Pix acima do saldo devolve 422 com mensagem', async ({ request }) => {
    const { token } = await (await request.post('/api/login', { data: CLIENTE })).json();

    const resposta = await request.post('/api/pix', {
      headers: { Authorization: `Bearer ${token}` },
      data: { chave: 'mae@tatu.com.br', valor: 999_999 },
    });

    expect(resposta.status()).toBe(422);
    expect(await resposta.json()).toEqual({ mensagem: 'Saldo insuficiente' });
  });
});
