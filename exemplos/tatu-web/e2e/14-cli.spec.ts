import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';

/*
 * Testar uma CLI com o Playwright Test.
 *
 * O test runner não exige navegador: ele dá paralelismo, timeout, retry,
 * relatório HTML e pasta temporária por teste para qualquer coisa, inclusive
 * um programa de linha de comando. Confira o que importa numa CLI:
 *
 *   código de saída   0 deu certo, outro número é erro
 *   stdout            o resultado (de preferência JSON, fácil de conferir)
 *   stderr            a mensagem de erro
 *   efeitos           arquivos criados, porta aberta, chamada feita
 *
 * Aqui as CLIs testadas são as do próprio projeto: scripts/vigia.mjs e
 * mock-bff/server.mjs.
 */

const execFileP = promisify(execFile);

/** Roda um comando e devolve código, stdout e stderr, sem lançar erro. */
async function rodar(args: string[], opcoes: { env?: Record<string, string>; cwd?: string } = {}) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, args, {
      cwd: opcoes.cwd,
      env: { ...process.env, ...opcoes.env },
    });
    return { codigo: 0, stdout, stderr };
  } catch (erro: any) {
    return { codigo: erro.code as number, stdout: erro.stdout as string, stderr: erro.stderr as string };
  }
}

const VIGIA = `${process.cwd()}/scripts/vigia.mjs`;

test.describe('CLI', { tag: '@cli' }, () => {
  test('vigia: login funcionando sai com 0 e imprime JSON', async ({ baseURL }) => {
    const r = await rodar([VIGIA], { env: { VIGIA_URL: baseURL! } });

    expect(r.codigo).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: true, limite: 5000 });
  });

  test('vigia: senha errada sai com 1, explica no stderr e guarda a captura', async ({ baseURL }, testInfo) => {
    const pasta = testInfo.outputPath(); // pasta só deste teste, apagada a cada execução

    const r = await rodar([VIGIA], {
      cwd: pasta,
      env: { VIGIA_URL: baseURL!, VIGIA_SENHA: 'errada', VIGIA_ESPERA_MS: '2000' },
    });

    expect(r.codigo).toBe(1);
    expect(JSON.parse(r.stderr)).toMatchObject({ ok: false });
    expect(existsSync(`${pasta}/vigia-falha.png`)).toBe(true);
    await testInfo.attach('captura da falha', { path: `${pasta}/vigia-falha.png` });
  });

  test('vigia: lento demais sai com 2', async ({ baseURL }) => {
    const r = await rodar([VIGIA], { env: { VIGIA_URL: baseURL!, VIGIA_LIMITE_MS: '1' } });

    expect(r.codigo).toBe(2);
    expect(JSON.parse(r.stdout)).toMatchObject({ ok: false, limite: 1 });
  });

  test('mock-bff: sobe na porta da variável PORT e responde', async ({ request }) => {
    const porta = 18_000 + test.info().workerIndex;
    const servidor = spawn(process.execPath, ['mock-bff/server.mjs'], {
      env: { ...process.env, PORT: String(porta) },
    });

    try {
      // Espera a CLI avisar que subiu, lendo o stdout
      await new Promise<void>((pronto, falhou) => {
        servidor.stdout.on('data', (d) => String(d).includes(`:${porta}`) && pronto());
        servidor.on('exit', (c) => falhou(new Error(`saiu com ${c}`)));
      });

      const resposta = await request.get(`http://localhost:${porta}/api/health`);
      expect(resposta.ok()).toBe(true);
      expect(await resposta.json()).toMatchObject({ status: expect.any(String) });
    } finally {
      servidor.kill();
    }
  });
});
