import { test as base, expect, Page } from '@playwright/test';
import { ExtratoPage } from './pages/extrato.page';
import { LoginPage } from './pages/login.page';
import { PixPage } from './pages/pix.page';

/**
 * Atalhos para mockar o BFF. Por baixo, tudo é page.route:
 * cada método só esconde o detalhe para o teste ficar legível.
 */
export class Bff {
  constructor(private readonly page: Page) {}

  /** Responde com um JSON. */
  async json(url: string, corpo: unknown, status = 200) {
    await this.page.route(url, (route) => route.fulfill({ status, json: corpo }));
  }

  /** Responde com erro HTTP. */
  async falha(url: string, status = 500, mensagem = 'Erro simulado') {
    await this.page.route(url, (route) => route.fulfill({ status, json: { mensagem } }));
  }

  /** Derruba a conexão: simula rede fora do ar. */
  async semRede(url: string) {
    await this.page.route(url, (route) => route.abort('failed'));
  }

  /** Deixa a chamada ir ao servidor de verdade, mas com atraso. */
  async lento(url: string, ms: number) {
    await this.page.route(url, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue().catch(() => {});
    });
  }
}

type Fixtures = {
  bff: Bff;
  login: LoginPage;
  extrato: ExtratoPage;
  pix: PixPage;
};

/** Use este "test" em vez do de @playwright/test para ganhar as fixtures acima. */
export const test = base.extend<Fixtures>({
  bff: async ({ page }, use) => use(new Bff(page)),
  login: async ({ page }, use) => use(new LoginPage(page)),
  extrato: async ({ page }, use) => use(new ExtratoPage(page)),
  pix: async ({ page }, use) => use(new PixPage(page)),
});

export { expect };
