import { Locator, Page } from '@playwright/test';

export class ExtratoPage {
  readonly carregando: Locator;
  readonly erro: Locator;
  readonly tentarNovamente: Locator;
  readonly vazio: Locator;
  readonly tabela: Locator;
  /** Linhas do corpo da tabela (sem o cabeçalho). */
  readonly linhas: Locator;

  constructor(private readonly page: Page) {
    this.carregando = page.getByRole('status');
    this.erro = page.getByRole('alert');
    this.tentarNovamente = page.getByRole('button', { name: 'Tentar novamente' });
    this.vazio = page.getByText('Nenhuma movimentação no período.');
    this.tabela = page.getByRole('table', { name: 'Movimentações' });
    this.linhas = this.tabela.locator('tbody').getByRole('row');
  }

  async abrir() {
    await this.page.goto('/extrato');
  }
}
