import type { Page } from '@playwright/test';
import { ClienteDeTeste, expect, test as base } from './fixtures';

/*
 * Os "custom commands" do Cypress no Playwright.
 *
 *   Cypress.Commands.add('login', ...)    fixture (o teste pede, o runner entrega pronto)
 *   Cypress.Commands.add('enviarPix', ..) função comum ou método de Page Object
 *   chai.use(...) / asserção própria      expect.extend (veja toMostrarReais em fixtures.ts)
 *   cy.session(...)                       storageState (veja auth.setup.ts)
 *   cy.get('[data-cy=pagar]')             testIdAttribute: 'data-cy' + getByTestId('pagar')
 *
 * Diferença principal: o comando do Cypress é global e entra numa fila;
 * a fixture é tipada, só existe para quem pede e tem limpeza embutida.
 */

// cy.login() vira uma fixture: quem pede "logada" já começa dentro do app
const test = base.extend<{ logada: ClienteDeTeste }>({
  logada: async ({ novoCliente, entrarComo, page }, use) => {
    const eva = await novoCliente({ nome: 'Eva', saldo: 42 });
    await entrarComo(eva);
    await page.goto('/inicio');
    await use(eva);
  },
});

// Cypress.Commands.add('enviarPix', ...) vira uma função comum
async function enviarPix(page: Page, chave: string, valor: number) {
  await page.goto('/pix');
  await page.getByLabel('Chave Pix').fill(chave);
  await page.getByLabel('Valor').fill(String(valor));
  await page.getByRole('button', { name: 'Enviar Pix' }).click();
}

test.describe('Vindo do Cypress', () => {
  test('cy.login vira fixture', async ({ page, logada }) => {
    await expect(page.getByRole('heading', { name: `Olá, ${logada.nome}` })).toBeVisible();
  });

  test('comando customizado vira função', async ({ page, logada }) => {
    await enviarPix(page, 'mae@tatu.com.br', 10);
    await expect(page.getByRole('status')).toContainText('Comprovante PIX-');
  });

  test('asserção customizada vira expect.extend', async ({ page, logada }) => {
    await expect(page.getByTestId('saldo')).toMostrarReais(42);
    await expect(page.getByTestId('saldo')).not.toMostrarReais(1520.75);
  });

  test.describe('migrando seletores data-cy', () => {
    test.use({ testIdAttribute: 'data-cy' });

    test('getByTestId lê o atributo do Cypress', async ({ page }) => {
      await page.setContent('<button data-cy="pagar">Pagar</button>');
      await expect(page.getByTestId('pagar')).toHaveText('Pagar');
    });
  });
});
