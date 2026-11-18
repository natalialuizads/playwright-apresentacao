import { expect, test } from './fixtures';

/*
 * Dados de teste: preparar pela API, agir e conferir pela tela, limpar sempre.
 *
 *   Arrange pela API   rápido e estável: o teste não perde tempo clicando no que não é o foco
 *   Act pela tela      o que está sendo testado é a tela
 *   Assert             na tela (o que o usuário vê) e, quando importa, no backend
 *   Limpeza            na fixture novoCliente, depois do use(): roda mesmo se o teste falhar
 *
 * Cada teste cria a SUA cliente. Ninguém depende de ordem nem de dado de outro
 * teste, então tudo roda em paralelo. O contexto do navegador (cookies e
 * localStorage) já nasce limpo em todo teste; o que precisa de limpeza é o
 * dado que fica no backend.
 */

test.describe('Dados pela API e limpeza', () => {
  test('prepara pela API, confere na tela', async ({ page, novoCliente, entrarComo }) => {
    // Arrange: uma cliente com saldo e uma conta de luz no extrato, em milissegundos
    const bia = await novoCliente({
      nome: 'Bia',
      saldo: 250.5,
      extrato: [{ data: '2026-11-15', descricao: 'Conta de luz', valor: -180 }],
    });
    await entrarComo(bia);

    // Act e Assert: pela tela
    await page.goto('/inicio');
    await expect(page.getByRole('heading', { name: 'Olá, Bia' })).toBeVisible();
    await expect(page.getByTestId('saldo')).toMostrarReais(250.5);

    await page.getByRole('link', { name: 'Extrato' }).click();
    await expect(page.getByRole('row', { name: /Conta de luz/ })).toMostrarReais(180);
  });

  test('age pela tela, confere no backend', async ({ page, request, novoCliente, entrarComo, pix }) => {
    const caio = await novoCliente({ nome: 'Caio', saldo: 100 });
    await entrarComo(caio);

    await pix.abrir();
    await pix.preencherEEnviar('mae@tatu.com.br', 30);
    await expect(pix.comprovante).toContainText('Comprovante PIX-');

    // A tela disse que deu certo; o backend concorda?
    const estado = await (await request.get(`/api/teste/clientes/${caio.token}`)).json();
    expect(estado.saldo).toBe(70);
    expect(estado.extrato[0]).toMatchObject({ descricao: 'Pix para mae@tatu.com.br', valor: -30 });
  });

  test('cenário de borda montado pela API: saldo zero', async ({ novoCliente, entrarComo, pix }) => {
    // Pela tela, chegar a saldo zero exigiria vários Pix. Pela API, é um campo.
    await entrarComo(await novoCliente({ nome: 'Dani', saldo: 0 }));

    await pix.abrir();
    await pix.preencherEEnviar('mae@tatu.com.br', 1);

    await expect(pix.erro).toHaveText('Saldo insuficiente');
  });
});
