import { Locator, Page } from '@playwright/test';

/** Page Object da tela de login: o teste fala "entrar", não "preencher #cpf". */
export class LoginPage {
  readonly cpf: Locator;
  readonly senha: Locator;
  readonly botaoEntrar: Locator;
  readonly erro: Locator;

  constructor(private readonly page: Page) {
    this.cpf = page.getByLabel('CPF');
    this.senha = page.getByLabel('Senha');
    this.botaoEntrar = page.getByRole('button', { name: 'Entrar' });
    this.erro = page.getByRole('alert');
  }

  async abrir() {
    await this.page.goto('/login');
  }

  async entrar(cpf: string, senha: string) {
    await this.cpf.fill(cpf);
    await this.senha.fill(senha);
    await this.botaoEntrar.click();
  }
}
