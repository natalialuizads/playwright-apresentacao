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
| `npm run vigia` | Monitoramento sintético: entra, espera o saldo e mede o tempo (com o app no ar) |
| `npm run e2e:local` | Usa o Google Chrome instalado na máquina, sem `playwright install` (veja abaixo) |
| `npm run e2e:ci` | Configuração de pipeline: relatórios html, junit e json |
| `npm run e2e:relatorio` | Abre o relatório gerado pelo `e2e:ci` (pasta `relatorio/`) |
| `npm run e2e:codegen` | Grava seus cliques e gera código (com o app no ar) |
| `npx playwright test e2e/05-shadow-dom.spec.ts` | Um arquivo só |
| `npx playwright test -g "XPath"` | Só os testes cujo nome contém "XPath" |
| `npx playwright test --debug` | Pausa no primeiro passo, com o Inspector |
| `npx playwright show-trace test-results/<pasta>/trace.zip` | Abre o trace de uma falha |

No Linux, se faltar biblioteca do sistema: `npx playwright install --with-deps chromium`.

## Configuração

São três arquivos, e os dois últimos herdam do primeiro:

| Arquivo | Para quê |
|---|---|
| `playwright.config.ts` | O principal. Comentado em seis blocos: o que roda, tempo e repetições, relatório, `use`, `projects` e `webServer` |
| `playwright.ci.config.ts` | Pipeline: troca só os relatórios (html, junit, json) |
| `playwright.local.config.ts` | Sua máquina: troca só de onde vem o navegador |

Quando o mesmo campo aparece em mais de um lugar, ganha o mais específico: flag da linha de comando, depois `test.use()` no arquivo de teste, depois o `use` do projeto, depois o `use` geral do config.

## Navegador local

O padrão é o Chromium que o Playwright baixa (`npx playwright install chromium`): a versão casa com a do Playwright. Quando o download é bloqueado, ou quando você quer ver o teste no Chrome de verdade, use o navegador da máquina:

```bash
npm run e2e:local                              # Google Chrome instalado
PW_CANAL=msedge npm run e2e:local              # Microsoft Edge
PW_EXECUTAVEL=/caminho/do/chrome npm run e2e:local
PW_LENTO=500 npm run e2e:local -- --headed     # com janela, meio segundo entre ações
```

No PowerShell: `$env:PW_CANAL="msedge"; npm run e2e:local`.

O `channel` do Playwright aceita `chrome`, `msedge` e as versões beta, dev e canary. O Chrome e o Edge corporativos seguem as políticas da empresa, que às vezes bloqueiam automação; nesse caso, peça o Chromium do Playwright num mirror interno (veja "Em rede corporativa").

## Usos que ninguém pensa

O `e2e/13-usos-inesperados.spec.ts` reúne testes que pegam o que nenhum teste funcional olha: erro de JavaScript que não aparece na tela, CPF vazando em URL, chamada duplicada ao BFF, rede caindo no meio do uso e telas que dependem da hora. O `scripts/vigia.mjs` usa o Playwright sem o test runner, como monitoramento sintético:

```bash
npm run vigia                                        # contra o app local
VIGIA_URL=https://homologacao.exemplo npm run vigia  # contra outro ambiente
```

Ele imprime uma linha JSON (`ok`, `ms`, `limite`) e sai com código 1 se falhar ou 2 se passar do limite de tempo, guardando `vigia-falha.png`. Use um usuário de teste, nunca uma conta real.

## Relatórios

O `playwright.config.ts` já gera o relatório HTML (`playwright-report/`):

```bash
npm run e2e             # roda e gera o relatório
npm run e2e:report      # abre o HTML no navegador
```

O relatório mostra os testes por status (passou, falhou, instável, pulado), filtra por tag e por projeto e, em cada teste, traz o erro com o trecho do código, os passos, as capturas, o trace e os anexos. O `e2e/12-relatorio.spec.ts` mostra como deixar o teste contar a própria história: `annotation` (link do chamado), `tag`, `test.step` e `testInfo.attach`.

Para o pipeline:

```bash
npm run e2e:ci          # list + html (relatorio/) + junit (resultados/junit.xml) + json
npm run e2e:relatorio   # abre o HTML
```

A configuração está em `playwright.ci.config.ts`: ela herda o config principal e só troca os `reporter`.

Com a suíte dividida em shards, cada máquina gera um `blob` e um passo final junta todos num HTML só:

```bash
npx playwright test --shard=1/4 --reporter=blob     # em cada máquina
npx playwright merge-reports --reporter html ./todos-os-blobs
```

O `ci/github-actions-e2e.yml` é um pipeline completo nesse formato (quatro shards, publicação mesmo com falha e relatório único).

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

A pasta `docs/` tem gravações reais: `terminal.mp4` (`npm run e2e`), `login.mp4` e `mocks.mp4` (navegador visível, com legenda do código), `ui.mp4` (modo UI) e `trace.mp4` (Trace Viewer investigando uma falha).

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
| `e2e/11-microfrontends.spec.ts` | Shell e remote simulados com `page.route`: remote fora do ar (fallback), contrato do Web Component, Shadow DOM do componente de outro time e BFF na borda. Roda sem servidor |
| `e2e/12-relatorio.spec.ts` | Relatório que conta a história: `annotation`, `tag`, `test.step`, `testInfo.attach` (JSON e imagem) |
| `e2e/13-usos-inesperados.spec.ts` | Usos que ninguém pensa: zero erro no console, CPF fora da URL e domínios permitidos, chamadas duplicadas à API, `toMatchAriaSnapshot`, `setOffline`, `page.clock` (sessão expirando e horário de corte) e `page.pdf` com capturas para o manual |

## Estrutura

```
e2e/
  auth.setup.ts          login uma vez (projeto "setup")
  fixtures.ts            test estendido: bff, login, extrato, pix
  pages/                 Page Objects
  hars/extrato.har       respostas gravadas do /api/extrato
  01..13-*.spec.ts       os testes, em ordem didática
mock-bff/server.mjs      BFF de mentira, sem dependências
playwright.config.ts     baseURL, projetos setup/chromium/visual, webServer
playwright.ci.config.ts  relatórios para pipeline (html, junit, json)
playwright.local.config.ts  navegador instalado na máquina (channel ou executável)
ci/github-actions-e2e.yml   pipeline com shards e relatório único
scripts/vigia.mjs        monitoramento sintético, sem test runner
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
- **Download do navegador bloqueado:** use o Google Chrome já instalado (`npm run e2e:local`) e pule o `npx playwright install`.
- **Mirror interno de binários:** `PLAYWRIGHT_DOWNLOAD_HOST=https://mirror.interno npx playwright install chromium` baixa de outro host.
- **Proxy com certificado próprio:** `HTTPS_PROXY=<proxy>` e `NODE_EXTRA_CA_CERTS=/caminho/ca.pem` antes do `npx playwright install`.
- **Pasta compartilhada de navegadores:** `PLAYWRIGHT_BROWSERS_PATH=<pasta>` instala e procura os navegadores ali (útil em agentes de CI com cache).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `Executable doesn't exist` | Faltou `npx playwright install chromium` |
| `Timed out waiting ... from config.webServer` | Porta 4200 ou 8080 ocupada por outro processo |
| Testes logados caindo no `/login` | Apague `e2e/.auth/` e rode de novo |
| Teste de HAR falhando | O HAR não tem a URL pedida; regrave com `HAR_UPDATE=1` |
