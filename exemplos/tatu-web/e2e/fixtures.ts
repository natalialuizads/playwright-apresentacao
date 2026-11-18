import { test as base, expect as baseExpect, Locator, Page } from '@playwright/test';
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

/** Cliente de teste criada pela API (só existe no mock BFF; veja mock-bff/server.mjs). */
export type ClienteDeTeste = { token: string; nome: string; saldo: number };
type DadosDoCliente = {
  nome?: string;
  saldo?: number;
  extrato?: { data: string; descricao: string; valor: number }[];
};

type Fixtures = {
  bff: Bff;
  login: LoginPage;
  extrato: ExtratoPage;
  pix: PixPage;
  /** Cria clientes pela API e apaga todas no fim do teste, mesmo se ele falhar. */
  novoCliente: (dados?: DadosDoCliente) => Promise<ClienteDeTeste>;
  /** Abre o app já logado como a cliente indicada, sem passar pela tela de login. */
  entrarComo: (cliente: ClienteDeTeste) => Promise<void>;
};

/** Use este "test" em vez do de @playwright/test para ganhar as fixtures acima. */
export const test = base.extend<Fixtures>({
  bff: async ({ page }, use) => use(new Bff(page)),
  login: async ({ page }, use) => use(new LoginPage(page)),
  extrato: async ({ page }, use) => use(new ExtratoPage(page)),
  pix: async ({ page }, use) => use(new PixPage(page)),

  novoCliente: async ({ request }, use) => {
    const criadas: string[] = [];

    // Antes do use: preparar. O teste roda dentro do use.
    await use(async (dados = {}) => {
      const resposta = await request.post('/api/teste/clientes', { data: dados });
      baseExpect(resposta.status(), 'criar cliente de teste').toBe(201);
      const cliente: ClienteDeTeste = await resposta.json();
      criadas.push(cliente.token);
      return cliente;
    });

    // Depois do use: limpar. Roda mesmo quando o teste falha.
    for (const token of criadas) {
      await request.delete(`/api/teste/clientes/${token}`);
    }
  },

  entrarComo: async ({ page }, use) => {
    await use(async (cliente) => {
      // Grava a sessão antes de qualquer script do app rodar, em toda navegação
      await page.addInitScript(({ token, nome }) => {
        localStorage.setItem('tatu.token', token);
        localStorage.setItem('tatu.nome', nome);
      }, cliente);
    });
  },
});

/**
 * expect com uma asserção própria do domínio, o equivalente a um
 * "custom command" de asserção no Cypress:
 *
 *   await expect(page.getByTestId('saldo')).toMostrarReais(1520.75);
 */
export const expect = baseExpect.extend({
  async toMostrarReais(locator: Locator, valor: number, opcoes?: { timeout?: number }) {
    const esperado = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let pass: boolean;
    let recebido: unknown;
    try {
      const expectativa = this.isNot ? baseExpect(locator).not : baseExpect(locator);
      await expectativa.toContainText(esperado, opcoes);
      pass = true;
    } catch (erro: any) {
      recebido = erro.matcherResult?.actual;
      pass = false;
    }
    if (this.isNot) pass = !pass;

    return {
      name: 'toMostrarReais',
      pass,
      expected: esperado,
      actual: recebido,
      message: () =>
        `${this.isNot ? 'Não esperava' : 'Esperava'} ver R$ ${esperado} em ${locator}` +
        (recebido !== undefined ? `\nNa tela: ${recebido}` : ''),
    };
  },
});
