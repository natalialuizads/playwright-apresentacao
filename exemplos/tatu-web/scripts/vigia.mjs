#!/usr/bin/env node
/*
 * Vigia: monitoramento sintético com Playwright, sem test runner.
 *
 * Faz o caminho que importa (entrar e ver o saldo), mede o tempo e, se falhar,
 * guarda uma captura da tela. Agende num pipeline (de hora em hora, por exemplo)
 * e mande o resultado para o alerta que o time já usa.
 *
 *   npm run vigia                                   contra o app local
 *   VIGIA_URL=https://homologacao.exemplo npm run vigia
 *   PW_CANAL=chrome npm run vigia                   com o Chrome instalado
 *
 * Variáveis: VIGIA_URL, VIGIA_CPF, VIGIA_SENHA, VIGIA_LIMITE_MS (tempo aceitável),
 * VIGIA_ESPERA_MS (quanto esperar o saldo) e PW_CANAL.
 *
 * Use um usuário de teste próprio para isso, nunca uma conta real.
 */
import { chromium } from '@playwright/test';

const URL_APP = process.env.VIGIA_URL ?? 'http://localhost:4200';
const CPF = process.env.VIGIA_CPF ?? '123.456.789-09';
const SENHA = process.env.VIGIA_SENHA ?? 'segredo123';
const LIMITE_MS = Number(process.env.VIGIA_LIMITE_MS ?? 5000);
const ESPERA_MS = Number(process.env.VIGIA_ESPERA_MS ?? 15_000);

const navegador = await chromium.launch({ channel: process.env.PW_CANAL });
const page = await navegador.newPage();
const inicio = Date.now();

try {
  await page.goto(`${URL_APP}/login`);
  await page.getByLabel('CPF').fill(CPF);
  await page.getByLabel('Senha').fill(SENHA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByTestId('saldo').waitFor({ timeout: ESPERA_MS });

  const ms = Date.now() - inicio;
  const lento = ms > LIMITE_MS;
  console.log(JSON.stringify({ ok: !lento, ms, limite: LIMITE_MS, quando: new Date().toISOString() }));
  if (lento) process.exitCode = 2;
} catch (erro) {
  await page.screenshot({ path: 'vigia-falha.png', fullPage: true }).catch(() => {});
  console.error(JSON.stringify({ ok: false, ms: Date.now() - inicio, erro: String(erro.message).split('\n')[0] }));
  process.exitCode = 1;
} finally {
  await navegador.close();
}
