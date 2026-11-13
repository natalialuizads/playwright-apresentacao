import { expect, test } from './fixtures';

// Estes testes precisam começar deslogados: zeramos a sessão salva pelo setup.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test('cliente entra e vê o próprio nome', async ({ page, login }) => {
    // Arrange
    await login.abrir();

    // Act
    await login.entrar('123.456.789-09', 'segredo123');

    // Assert
    await expect(page).toHaveURL(/\/inicio$/);
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();
  });

  test('senha errada mostra mensagem de erro', async ({ login }) => {
    await login.abrir();
    await login.entrar('123.456.789-09', 'senha-errada');

    await expect(login.erro).toHaveText('CPF ou senha inválidos.');
  });

  test('BFF fora do ar mostra aviso de indisponibilidade', async ({ page, login }) => {
    // Mock: a chamada de login nunca chega ao servidor, devolvemos 503 na hora.
    await page.route('**/api/login', (route) => route.fulfill({ status: 503 }));

    await login.abrir();
    await login.entrar('123.456.789-09', 'segredo123');

    await expect(login.erro).toHaveText('Serviço indisponível. Tente mais tarde.');
  });

  test('sem sessão, a página inicial redireciona para o login', async ({ page }) => {
    await page.goto('/inicio');
    await expect(page).toHaveURL(/\/login$/);
  });
});
