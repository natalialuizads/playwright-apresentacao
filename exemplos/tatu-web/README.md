# tatu-web: Angular + Playwright

Front do Banco Tatu em Angular 22, com uma suíte Playwright que cobre login, mocks de rede, HAR, fixtures, Page Objects, login reaproveitado, Shadow DOM, locators e ações, tags, testes de API, acessibilidade (axe), regressão visual, microfrontends, relatórios, dados pela API com limpeza, BDD, testes de CLI, Docker e variáveis de ambiente.

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
| `npm run e2e:lighthouse` | Lighthouse da tela de login, com o relatório anexado (projeto `lighthouse`) |
| `npx playwright test --grep @perf` | Web Vitals, chamadas mais lentas, CPU lenta e trace de CPU |
| `npm run e2e:bdd` | Cenários em Gherkin, em português (`bdd/pix.feature`) |
| `npx playwright test --grep @cli` | Só os testes de CLI (`e2e/14-cli.spec.ts`) |
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

## Dados de teste e limpeza

O mock BFF tem endpoints só de teste para criar uma cliente isolada por teste (`/api/teste/clientes`). A fixture `novoCliente` cria pela API e apaga no fim, mesmo quando o teste falha; a `entrarComo` abre o app já logado como ela. Veja `e2e/15-dados-e-limpeza.spec.ts`:

- prepara pela API e confere na tela;
- age pela tela e confere no backend;
- monta um cenário de borda (saldo zero) sem clicar nada.

Num BFF de verdade, o equivalente é um endpoint ligado só no ambiente de teste ou um script de massa de dados.

## BDD com Gherkin

```bash
npm run e2e:bdd
```

O `playwright-bdd` transforma `bdd/pix.feature` (em português: `Funcionalidade`, `Cenário`, `Dado`, `Quando`, `Então`, `Esquema do Cenário`) em testes do Playwright, usando os passos de `bdd/passos.ts`. Paralelismo, trace e relatório funcionam igual. Os passos recebem as mesmas fixtures dos outros testes.

## Organização numa suíte real

Aqui os arquivos são numerados para seguir a apresentação. Numa suíte de produto, organize por funcionalidade:

```
e2e/
  pix/              pix.spec.ts, pix-agendado.spec.ts
  extrato/          extrato.spec.ts
  login/            login.spec.ts, auth.setup.ts
  pages/            Page Objects (ou components/ para pedaços reaproveitados)
  fixtures/         index.ts com test.extend; uma fixture por assunto
  dados/            fábricas de dados (novoCliente, novoPix) e massas fixas
  apoio/            clientes de API, matchers (expect.extend), utilidades
playwright.config.ts
```

## Login com Azure AD (MSAL)

O `referencias/msal-azure-ad.setup.ts` é um setup completo para apps que entram pelo Azure AD (Entra ID) com MSAL. Ele não roda aqui, porque precisa de um tenant. O ponto principal: o MSAL guarda os tokens no `sessionStorage`, que o `storageState` não salva; o setup grava à parte e o fixture restaura com `addInitScript`. O `e2e/17-storage-e-abas.spec.ts` mostra a mesma técnica rodando.

## IA: skill e MCP

- `.claude/skills/testes-e2e/SKILL.md`: as regras de teste deste projeto para um agente de código seguir (locators, fixtures, dados pela API, como consertar sem afrouxar asserção).
- `.mcp.json` (Claude Code) e `.vscode/mcp.json` (VS Code): ligam o Playwright MCP, para o agente abrir o app e ler a tela.

## Variáveis de ambiente

O `playwright.config.ts` lê o `.env` da pasta, se existir, com o `process.loadEnvFile()` do Node (sem dependência). O que já estiver definido no terminal, no CI ou no Docker ganha do arquivo.

```bash
cp .env.exemplo .env          # ajuste os valores; o .env não vai para o git
```

| Variável | Efeito |
|---|---|
| `TATU_CPF`, `TATU_SENHA` | Credenciais usadas pelo `auth.setup.ts` |
| `BASE_URL` | Testa um ambiente já no ar e desliga o `webServer` |
| `CI` | Liga retries, `forbidOnly` e sobe os servidores do zero |
| `PW_NAVEGADOR_REMOTO` | Usa um navegador num container (veja "Docker") |
| `PW_CANAL`, `PW_EXECUTAVEL`, `PW_LENTO` | Navegador local (`npm run e2e:local`) |

```bash
BASE_URL=https://homologacao.exemplo npm run e2e     # Linux e macOS
$env:BASE_URL="https://homologacao.exemplo"; npm run e2e   # PowerShell
```

No CI, as mesmas variáveis vêm do cofre de segredos da ferramenta, nunca de arquivo versionado.

## Docker

Dois jeitos, os dois em `docker-compose.e2e.yml`:

**A suíte inteira num container.** A imagem oficial já traz os navegadores; o `webServer` sobe o BFF de mentira e o `ng serve` lá dentro.

```bash
docker build -f Dockerfile.e2e -t tatu-e2e .
docker run --rm --init --ipc=host --env-file .env \
  -v "$PWD/playwright-report:/app/playwright-report" tatu-e2e

# ou
docker compose -f docker-compose.e2e.yml run --rm e2e
```

**Só o navegador num container**, os testes na sua máquina. Útil em macOS e Windows para gerar screenshots iguais aos do CI (Linux):

```bash
docker compose -f docker-compose.e2e.yml --profile navegador up -d navegador
PW_NAVEGADOR_REMOTO=ws://127.0.0.1:3000/ npm run e2e:visual
```

O config usa `connectOptions` com `exposeNetwork: '<loopback>'`, que deixa o navegador do container acessar o `localhost` da sua máquina.

Cuidados:

- A tag da imagem (`v1.65.0-noble`) precisa ser a mesma versão do `@playwright/test`. Atualizou um, atualize o outro.
- `--ipc=host` evita que o Chromium fique sem memória; `--init` cuida dos processos filhos.
- A imagem roda como root, o que desliga o sandbox do Chromium. Para sites de terceiros, use `--user pwuser` e o perfil seccomp da documentação.

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
| `e2e/14-cli.spec.ts` | Testar uma CLI: código de saída, stdout em JSON, stderr, arquivo criado em pasta temporária, variáveis de ambiente e uma CLI que sobe servidor |
| `e2e/15-dados-e-limpeza.spec.ts` | Preparar pela API e conferir na tela; agir na tela e conferir no backend; fixture com limpeza garantida |
| `e2e/16-vindo-do-cypress.spec.ts` | Custom commands do Cypress no Playwright: fixture, função, `expect.extend`, `testIdAttribute: 'data-cy'` |
| `e2e/17-storage-e-abas.spec.ts` | `localStorage` e `sessionStorage` (`page.localStorage`, `page.sessionStorage`), o que o `storageState` salva e o que não salva, redirecionamento de rota protegida e nova aba |
| `e2e/18-performance.spec.ts` | Gargalos: LCP e CLS, chamadas mais lentas com `request.timing()`, CPU 4x mais lenta via CDP e trace de CPU para o DevTools |
| `e2e/19-lighthouse.spec.ts` | Lighthouse pela porta de depuração do Chromium, com notas mínimas e o relatório anexado |
| `e2e/20-prints-e-gravacao.spec.ts` | Prints (página inteira, pedaço, `mask`) e vídeo com `page.screencast`, cliques anotados e capítulos |

## Estrutura

```
e2e/
  auth.setup.ts          login uma vez (projeto "setup")
  fixtures.ts            test estendido: bff, login, extrato, pix
  pages/                 Page Objects
  hars/extrato.har       respostas gravadas do /api/extrato
  01..20-*.spec.ts       os testes, em ordem didática
mock-bff/server.mjs      BFF de mentira, sem dependências
playwright.config.ts     baseURL, projetos setup/chromium/visual, webServer
playwright.ci.config.ts  relatórios para pipeline (html, junit, json)
playwright.local.config.ts  navegador instalado na máquina (channel ou executável)
ci/github-actions-e2e.yml   pipeline com shards e relatório único
scripts/vigia.mjs        monitoramento sintético, sem test runner
bdd/                     pix.feature (Gherkin em português) e os passos
playwright.bdd.config.ts config do BDD (playwright-bdd)
Dockerfile.e2e           suíte num container (imagem oficial do Playwright)
docker-compose.e2e.yml   suíte no container ou só o navegador
.env.exemplo             variáveis de ambiente documentadas
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
