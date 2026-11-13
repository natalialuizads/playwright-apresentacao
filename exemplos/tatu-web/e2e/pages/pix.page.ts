import { Locator, Page } from '@playwright/test';

export class PixPage {
  readonly chave: Locator;
  readonly valor: Locator;
  readonly enviar: Locator;
  readonly comprovante: Locator;
  readonly erro: Locator;

  constructor(private readonly page: Page) {
    this.chave = page.getByLabel('Chave Pix');
    this.valor = page.getByLabel('Valor');
    this.enviar = page.getByRole('button', { name: 'Enviar Pix' });
    this.comprovante = page.getByRole('status');
    this.erro = page.getByRole('alert');
  }

  async abrir() {
    await this.page.goto('/pix');
  }

  /** Botão dentro do Web Component <tatu-pix-favoritos> (Shadow DOM). */
  favorito(nome: string): Locator {
    return this.page.getByRole('button', { name: nome });
  }

  async preencherEEnviar(chave: string, valor: number) {
    await this.chave.fill(chave);
    await this.valor.fill(String(valor));
    await this.enviar.click();
  }
}
