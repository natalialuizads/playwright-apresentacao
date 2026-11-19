import { readFile, writeFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

/*
 * Arquivos: upload e download.
 *
 *   setInputFiles      no <input type="file">: arquivo do disco OU criado na hora (buffer)
 *   filechooser        quando um botão abre o seletor de arquivos
 *   drop               área de arrastar e soltar: monta um DataTransfer e dispara o evento
 *   download           espera o evento, salva na pasta do teste e confere o CONTEÚDO
 *
 * O accept do input não vale para o setInputFiles: é por isso que dá para testar
 * a validação de formato do app.
 */

// Um PNG de 1x1 pixel, para não precisar de arquivo no repositório
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Upload', () => {
  test('arquivo criado na hora, sem arquivo no repositório', async ({ page }) => {
    await page.goto('/documentos');

    await page.getByLabel('Arquivo', { exact: true }).setInputFiles({
      name: 'renda.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 comprovante de renda'),
    });
    await expect(page.getByText('Selecionado: renda.pdf')).toBeVisible();

    const envio = page.waitForRequest('**/api/documentos');
    await page.getByRole('button', { name: 'Enviar documento' }).click();
    expect((await envio).headers()['content-type']).toContain('multipart/form-data');

    await expect(page.getByRole('status')).toContainText('Documento recebido: renda.pdf, protocolo DOC-');
  });

  // Título sem acento de propósito: a pasta do teste nasce do título, e num Linux sem
  // locale UTF-8 (comum em agente de CI) o navegador não acha arquivo em caminho com
  // acento. O campo fica vazio, sem erro nenhum.
  test('arquivo do disco, pelo seletor de arquivos', async ({ page }, testInfo) => {
    const caminho = testInfo.outputPath('holerite.png');
    await writeFile(caminho, PNG);
    await page.goto('/documentos');

    const seletor = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Escolher do computador' }).click();
    await (await seletor).setFiles(caminho);

    await expect(page.getByText(/Selecionado: holerite\.png/)).toBeVisible();
  });

  test('arrastar e soltar', async ({ page }) => {
    await page.goto('/documentos');

    const arquivos = await page.evaluateHandle(() => {
      const dados = new DataTransfer();
      dados.items.add(new File(['%PDF-1.4'], 'arrastado.pdf', { type: 'application/pdf' }));
      return dados;
    });
    await page.getByRole('region', { name: 'Área para soltar arquivo' }).dispatchEvent('drop', { dataTransfer: arquivos });

    await expect(page.getByText('Selecionado: arrastado.pdf')).toBeVisible();
  });

  test('validações: formato e tamanho', async ({ page }) => {
    await page.goto('/documentos');
    // exact: sem ele, 'Arquivo' também casa com 'Área para soltar arquivo'
    const campo = page.getByLabel('Arquivo', { exact: true });

    await campo.setInputFiles({ name: 'planilha.xlsx', mimeType: 'application/vnd.ms-excel', buffer: Buffer.from('x') });
    await expect(page.getByRole('alert')).toHaveText('Formato não aceito. Envie PDF, PNG ou JPG.');

    await campo.setInputFiles({ name: 'grande.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(1024 * 1024 + 1) });
    await expect(page.getByRole('alert')).toHaveText('Arquivo maior que 1 MB.');
    await expect(page.getByRole('button', { name: 'Enviar documento' })).toBeDisabled();

    await campo.setInputFiles([]); // limpa o campo
  });
});

test.describe('Download', () => {
  test('exportar CSV: baixa, salva e confere o conteúdo', async ({ page }, testInfo) => {
    await page.goto('/extrato');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const arquivo = await download;

    expect(arquivo.suggestedFilename()).toBe('extrato-tatu.csv');
    const caminho = testInfo.outputPath(arquivo.suggestedFilename());
    await arquivo.saveAs(caminho);
    await testInfo.attach('extrato-tatu.csv', { path: caminho, contentType: 'text/csv' });

    // O app põe um BOM no começo para o Excel abrir os acentos
    const linhas = (await readFile(caminho, 'utf8')).replace(/^﻿/, '').split('\r\n');
    expect(linhas[0]).toBe('data;descricao;valor');
    expect(linhas).toContain('2026-11-09;Mercado do bairro;-312,40');
    expect(linhas).toHaveLength(4);
  });

  test('o arquivo segue os dados da cliente', async ({ page, novoCliente, entrarComo }) => {
    await entrarComo(
      await novoCliente({
        nome: 'Iara',
        extrato: [
          { data: '2026-11-15', descricao: 'Conta de luz', valor: -180 },
          { data: '2026-11-14', descricao: 'Reembolso', valor: 42.5 },
        ],
      }),
    );
    await page.goto('/extrato');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const conteudo = await readFile(await (await download).path(), 'utf8');

    expect(conteudo).toContain('2026-11-15;Conta de luz;-180,00');
    expect(conteudo).toContain('2026-11-14;Reembolso;42,50');
  });
});
