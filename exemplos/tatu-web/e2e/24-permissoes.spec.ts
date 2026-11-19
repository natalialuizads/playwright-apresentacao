import { expect, test } from './fixtures';

/*
 * Recursos que pedem permissão ao navegador.
 *
 *   permissions / grantPermissions   área de transferência, localização, notificações
 *   geolocation / setGeolocation     onde o "celular" está
 *
 * Sem permissão, o navegador do teste nega, como um usuário que clicou em "Bloquear".
 */

test.describe('Área de transferência', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copiar a chave Pix: o que foi copiado é a chave', async ({ page }) => {
    await page.goto('/servicos');
    const chave = page.getByRole('region', { name: 'Minha chave Pix' });

    await chave.getByRole('button', { name: 'Copiar chave' }).click();

    await expect(chave.getByRole('status')).toHaveText('Chave copiada');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ana@tatu.com.br');
  });
});

test.describe('Localização', () => {
  test.use({ permissions: ['geolocation'], geolocation: { latitude: -23.5629, longitude: -46.6544 } });

  test('perto da Paulista, e depois no Rio', async ({ page, context }) => {
    await page.goto('/servicos');
    const agencia = page.getByRole('region', { name: 'Agência mais próxima' });

    await agencia.getByRole('button', { name: 'Encontrar agência mais próxima' }).click();
    await expect(agencia.getByRole('status')).toHaveText(/^Agência Paulista, a 0,\d km$/);

    await context.setGeolocation({ latitude: -22.9068, longitude: -43.1729 });
    await agencia.getByRole('button', { name: 'Encontrar agência mais próxima' }).click();
    await expect(agencia.getByRole('status')).toHaveText(/^Agência Centro Rio/);
  });
});

test('localização negada: a tela pede a permissão', async ({ page }) => {
  await page.goto('/servicos');
  const agencia = page.getByRole('region', { name: 'Agência mais próxima' });

  await agencia.getByRole('button', { name: 'Encontrar agência mais próxima' }).click();

  await expect(agencia.getByRole('status')).toHaveText('Permita a localização para encontrar a agência.');
});

test.describe('Notificações', () => {
  test.use({ permissions: ['notifications'] });

  test('com permissão, os avisos ficam ativos', async ({ page }) => {
    await page.goto('/servicos');
    const avisos = page.getByRole('region', { name: 'Avisos de Pix' });

    await avisos.getByRole('button', { name: 'Avisar quando cair um Pix' }).click();

    await expect(avisos.getByRole('status')).toHaveText('Avisos ativados');
  });
});
