import { createBdd } from 'playwright-bdd';
import { expect } from '../e2e/fixtures';
import { test } from './fixtures';

/*
 * Os passos do pix.feature. Cada frase do Gherkin vira uma função que recebe
 * as mesmas fixtures dos testes comuns (page, novoCliente, entrarComo, pix...).
 * Dado, Quando e Então são só apelidos de Given, When e Then.
 */
const { Given: Dado, When: Quando, Then: Entao } = createBdd(test);

Dado('que sou uma cliente com saldo de R$ {int}', async ({ novoCliente, entrarComo }, saldo: number) => {
  await entrarComo(await novoCliente({ nome: 'Gabi', saldo }));
});

Quando(
  'eu envio um Pix de R$ {int} para {string}',
  async ({ pix }, valor: number, chave: string) => {
    await pix.abrir();
    await pix.preencherEEnviar(chave, valor);
  },
);

Entao('vejo o comprovante', async ({ pix }) => {
  await expect(pix.comprovante).toContainText('Comprovante PIX-');
});

Entao('vejo o aviso {string}', async ({ pix }, aviso: string) => {
  await expect(pix.erro).toHaveText(aviso);
});

Entao('meu saldo passa a ser R$ {int}', async ({ page }, saldo: number) => {
  await page.goto('/inicio');
  await expect(page.getByTestId('saldo')).toMostrarReais(saldo);
});
