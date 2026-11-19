import { expect, test } from './fixtures';

/*
 * iframe de outra origem e código por SMS (OTP), no mesmo fluxo: compra no
 * cartão com verificação 3DS. O banco emissor abre o desafio num iframe e
 * manda um código por SMS.
 *
 *   contentFrame / frameLocator   entra no iframe, mesmo de outra origem
 *   caixa de SMS de teste         o ambiente de teste guarda as mensagens; o teste lê pela API,
 *                                 filtrando pela referência, para não pegar o SMS de outro teste
 *   expect.poll                   espera a mensagem chegar (o envio pode demorar)
 *
 * Para autenticador (TOTP, Google Authenticator), o teste gera o código a partir
 * do segredo da conta de teste com uma biblioteca como otpauth.
 */

test.describe('Cartão com 3DS', () => {
  test('código lido da caixa de SMS e digitado dentro do iframe do emissor', async ({ page, request }) => {
    await page.goto('/cartao');

    const resposta = page.waitForResponse('**/api/cartao/compras');
    await page.getByRole('button', { name: /^Pagar/ }).click();
    const { id } = await (await resposta).json();

    // 1. O SMS chegou? Espera e lê o código
    let texto = '';
    await expect
      .poll(async () => {
        const sms = await request.get(`/api/teste/sms?referencia=${id}`);
        texto = sms.ok() ? (await sms.json()).texto : '';
        return texto;
      })
      .toMatch(/\d{6}/);
    const codigo = /(\d{6})/.exec(texto)![1];

    // 2. Entra no iframe (de outra origem) e confirma
    const emissor = page.getByTitle('Verificação do banco emissor').contentFrame();
    await emissor.getByLabel('Código recebido por SMS').fill(codigo);
    await emissor.getByRole('button', { name: 'Confirmar' }).click();

    // 3. A loja recebe o aviso do iframe
    await expect(page.getByRole('status')).toHaveText('Compra aprovada');
  });

  test('código errado: compra recusada', async ({ page }) => {
    await page.goto('/cartao');
    await page.getByRole('button', { name: /^Pagar/ }).click();

    const emissor = page.frameLocator('iframe[title="Verificação do banco emissor"]');
    await emissor.getByLabel('Código recebido por SMS').fill('000000');
    await emissor.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Compra recusada: código inválido');
  });
});
