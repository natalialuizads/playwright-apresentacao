# tatu-web: Angular + Playwright

Front do Banco Tatu em Angular 22, com uma suíte Playwright que cobre login, mocks de rede, HAR, fixtures, Page Objects, login reaproveitado, Shadow DOM, locators e ações, tags, testes de API, acessibilidade (axe) e regressão visual.

## Requisitos

- Node.js 22 ou 24 (LTS)
- npm 10 ou mais novo

## Rodar os testes

```bash
npm install
npx playwright install chromium     # baixa o navegador de teste (uma vez)
npm run e2e                         # roda tudo, sem janela
```

O Playwright sobe sozinho, antes dos testes:

1. o BFF de mentira em Node na porta 8080 (`mock-bff/server.mjs`);
2. o `ng serve` na porta 4200.

Se algum dos dois já estiver rodando, ele reaproveita.

### Outras formas de rodar

| Comando | Para quê |
|---|---|
| `npm run e2e:ui` | Modo UI: escolhe testes, vê cada passo, volta no tempo |
| `npm run e2e:headed` | Roda com a janela do navegador aberta |
| `npm run e2e:report` | Abre o relatório HTML da última execução |
| `npm run e2e:smoke` | Só os testes marcados com `@smoke` |
| `npm run e2e:visual` | Só a regressão visual (veja a seção abaixo) |
| `npm run e2e:debug` | Roda com o Inspector, passo a passo |
| `npm run e2e:ci` | Configuração de pipeline: relatórios html, junit e json |
| `npm run e2e:relatorio` | Abre o relatório gerado pelo `e2e:ci` (pasta `relatorio/`) |
| `npm run e2e:codegen` | Grava seus cliques e gera código (com o app no ar) |
| `npx playwright test e2e/05-shadow-dom.spec.ts` | Um arquivo só |
| `npx playwright test -g "XPath"` | Só os testes cujo nome contém "XPath" |
| `npx playwright test --debug` | Pausa no primeiro passo, com o Inspector |
| `npx playwright show-trace test-results/<pasta>/trace.zip` | Abre o trace de uma falha |

No Linux, se faltar biblioteca do sistema: `npx playwright install --with-deps chromium`.

## Relatórios

O `playwright.config.ts` já gera o relatório HTML (`playwright-report/`). Para a configuração de pipeline, use:

```bash
npm run e2e:ci          # list + html (relatorio/) + junit (resultados/junit.xml) + json
npm run e2e:relatorio   # abre o HTML
```

A configuração está em `playwright.ci.config.ts`: ela herda o config principal e só troca os `reporter`. Com a suíte dividida em shards (`--shard=1/4`), use o reporter `blob` em cada máquina e junte no fim com `npx playwright merge-reports`.

## Acessibilidade com axe

```bash
npx playwright test e2e/09-acessibilidade.spec.ts
```

O axe encontra uma parte dos problemas (rótulos, alt, contraste, papéis ARIA). Não substitui teste manual com teclado e leitor de tela. O JSON das violações é anexado a cada teste no relatório HTML.

## Regressão visual

As imagens de referência dependem do sistema operacional (fontes), então não vão no zip. Gere as suas na primeira vez:

```bash
npm run e2e:visual -- --update-snapshots
npm run e2e:visual
```

## Clipes de execução

A pasta `docs/` tem gravações reais da suíte rodando: `terminal.mp4` (`npm run e2e`), `login.mp4` e `mocks.mp4` (navegador visível, com legenda do código).

## Rodar o app na mão

```bash
npm run mock-bff     # terminal 1: BFF de mentira na 8080
npm start            # terminal 2: ng serve na 4200, com proxy /api -> 8080
```

Abra http://localhost:4200 e entre com CPF `123.456.789-09` e senha `segredo123`.

Para usar o backend Java no lugar do mock, suba o `tatu-api` (`mvn spring-boot:run`) em vez do `npm run mock-bff`.

## Mapa dos testes

| Arquivo | O que ensina |
|---|---|
| `e2e/auth.setup.ts` | Faz login uma vez e salva a sessão em `e2e/.auth/cliente.json` |
| `e2e/01-login.spec.ts` | Primeiro teste (Arrange, Act, Assert); como começar deslogado; mock de 503 no login |
| `e2e/02-mock-basico.spec.ts` | `route.fulfill`, `route.abort`, `route.continue` com atraso; falhar a primeira chamada e passar a segunda |
| `e2e/03-mock-avancado.spec.ts` | `route.fetch` para editar a resposta real; `waitForRequest` para conferir corpo e headers enviados; erro 422; terceiro fora do ar; regex; fixture `bff` |
| `e2e/04-har.spec.ts` | `routeFromHAR`: gravar respostas reais e reproduzir sem o BFF |
| `e2e/05-shadow-dom.spec.ts` | Locators dentro de Shadow DOM (componente Angular e Web Component nativo); CSS atravessa, XPath não |
| `e2e/06-contexto-locators-acoes.spec.ts` | Dois contexts isolados no mesmo navegador; `filter`, `has`, `hasText`, `hasNotText`; `fill`, `selectOption`, `check`, `press`, `clear` |
| `e2e/07-debug-e-tags.spec.ts` | Tags (`@smoke`, `--grep`), `test.step`, `test.slow` |
| `e2e/08-api.spec.ts` | Testes de API sem navegador, com a fixture `request` |
| `e2e/09-acessibilidade.spec.ts` | axe-core: violações WCAG A e AA por tela, escopo com `include`, `disableRules`, anexo do JSON no relatório |
| `e2e/10-visual.spec.ts` | `toHaveScreenshot`, `mask`, `maxDiffPixelRatio` |

## Estrutura

```
e2e/
  auth.setup.ts          login uma vez (projeto "setup")
  fixtures.ts            test estendido: bff, login, extrato, pix
  pages/                 Page Objects
  hars/extrato.har       respostas gravadas do /api/extrato
  01..10-*.spec.ts       os testes, em ordem didática
mock-bff/server.mjs      BFF de mentira, sem dependências
playwright.config.ts     baseURL, projetos setup/chromium/visual, webServer
playwright.ci.config.ts  relatórios para pipeline (html, junit, json)
docs/                    clipes de execução (mp4)
proxy.conf.json          /api -> http://localhost:8080 no ng serve
src/app/
  componentes/
    cartao-saldo.ts            componente Angular com ViewEncapsulation.ShadowDom
    pix-favoritos.element.ts   Web Component nativo com Shadow DOM aberto
  core/                  serviços, interceptor e guard
  paginas/               login, início, extrato, Pix
```

## Regravar o HAR

Com o BFF real no ar (o mock em Node ou o Java):

```bash
# Linux e macOS
HAR_UPDATE=1 npx playwright test e2e/04-har.spec.ts

# PowerShell
$env:HAR_UPDATE=1; npx playwright test e2e/04-har.spec.ts; Remove-Item Env:HAR_UPDATE
```

## Em rede corporativa

- **npm atrás de proxy:** configure `HTTPS_PROXY` ou o registry interno (`npm config set registry <url>`).
- **Download do navegador bloqueado:** use o Google Chrome já instalado na máquina. No `playwright.config.ts`, troque o `use` do projeto `chromium` por `{ ...devices['Desktop Chrome'], channel: 'chrome', storageState: 'e2e/.auth/cliente.json' }` e pule o `npx playwright install`.
- **Mirror interno de binários:** a variável `PLAYWRIGHT_DOWNLOAD_HOST` aponta o download para outro host.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `Executable doesn't exist` | Faltou `npx playwright install chromium` |
| `Timed out waiting ... from config.webServer` | Porta 4200 ou 8080 ocupada por outro processo |
| Testes logados caindo no `/login` | Apague `e2e/.auth/` e rode de novo |
| Teste de HAR falhando | O HAR não tem a URL pedida; regrave com `HAR_UPDATE=1` |
