# Playwright na prática: Banco Tatu

Dois projetos de exemplo que acompanham a apresentação "Playwright: o robô que clica por você".
Os dois contam a mesma história: o Banco Tatu, um banco fictício com login, saldo, extrato, Pix e cotação do dólar.

| Pasta | Stack | O que ensina |
|---|---|---|
| `tatu-web/` | Angular 22 + Playwright (TypeScript) | Testes de tela, mocks com `page.route`, HAR, fixtures, Page Objects, login reaproveitado, Shadow DOM, locators, tags, API, acessibilidade com axe e regressão visual |
| `tatu-api/` | Spring Boot 3.5 + Playwright Java + WireMock | Testes de API sem navegador, testes de tela em Java, `page.route` em Java, WireMock no lugar de um serviço de terceiro |

Cada projeto roda sozinho:

- O `tatu-web` sobe um BFF de mentira em Node (`mock-bff/server.mjs`), então não precisa do Java.
- O `tatu-api` serve uma página HTML mínima para os testes de tela, então não precisa do Angular.

## Início rápido

### Frontend (tatu-web)

```bash
cd tatu-web
npm install
npx playwright install chromium
npm run e2e
```

### Backend (tatu-api)

```bash
cd tatu-api
mvn verify
```

Detalhes, variações e solução de problemas estão no README de cada pasta.

## Os dois juntos

1. Suba o backend: `cd tatu-api && mvn spring-boot:run` (porta 8080).
2. Em outro terminal: `cd tatu-web && npm run e2e`.

O `playwright.config.ts` do front reaproveita o que já estiver rodando na 8080. Com o Java no ar, os testes que não mockam nada passam a usar o backend real.

## Credenciais da cliente de teste

| Campo | Valor |
|---|---|
| CPF | `123.456.789-09` |
| Senha | `segredo123` |
| Nome | Ana |
| Saldo | R$ 1.520,75 |

## Contrato da API (igual nos dois projetos)

| Método e caminho | Corpo | Respostas |
|---|---|---|
| `POST /api/login` | `{cpf, senha}` | 200 `{token, nome}` ou 401 |
| `GET /api/conta` | | 200 `{nome, saldo}` |
| `GET /api/extrato` | | 200 `[{data, descricao, valor}]` |
| `GET /api/cotacao` | | 200 `{moeda, valor}` ou 503 |
| `POST /api/pix` | `{chave, valor}` | 201 `{id, status}` ou 422 `{mensagem}` |
| `GET /api/health` | | 200 `{status}` |

Tudo, menos `login` e `health`, exige o header `Authorization: Bearer token-ana`.

## Roteiro de estudo sugerido

1. `tatu-web/e2e/01-login.spec.ts`: o primeiro teste, no formato Arrange, Act, Assert.
2. `tatu-web/e2e/02-mock-basico.spec.ts`: as quatro respostas do `page.route`.
3. `tatu-web/e2e/03-mock-avancado.spec.ts`: editar resposta real, conferir o pedido enviado, regex.
4. `tatu-web/e2e/04-har.spec.ts`: gravar e reproduzir respostas reais.
5. `tatu-web/e2e/05-shadow-dom.spec.ts`: o que atravessa e o que não atravessa o Shadow DOM.
6. `tatu-api/src/test/java/.../dominio/PixServiceTest.java`: a base da pirâmide.
7. `tatu-api/src/test/java/.../api/ContasApiIT.java`: Playwright sem navegador.
8. `tatu-api/src/test/java/.../ui/LoginUiIT.java`: teste de tela e `page.route` em Java.
9. `tatu-api/src/test/java/.../mock/CotacaoWireMockIT.java`: mock no backend.

Extras do front, para depois: `06` (contexts, locators e ações), `07` (tags e `test.step`), `08` (API), `09` (acessibilidade com axe), `10` (regressão visual), `11` (microfrontends: shell, remote e fallback), `12` (relatório que conta a história: anotações, passos e anexos), `13` (usos que ninguém pensa: console, privacidade, chamadas duplicadas, relógio, offline e PDF), `scripts/vigia.mjs` (monitoramento sintético), `14` (testar CLI), `15` (dados pela API e limpeza), `16` (vindo do Cypress), `17` (storage, redirecionamento e abas), `18` (performance), `19` (Lighthouse), `20` (prints e vídeo), `21` (arquivos: upload e download), `22` (iframe e código por SMS), `23` (celular), `24` (permissões), `25` (WebSocket), `26` (testes instáveis), `playwright.navegadores.config.ts` (Firefox, WebKit, Android e iPhone), `bdd/` (Gherkin em português), `referencias/msal-azure-ad.setup.ts` (login Azure AD), `Dockerfile.e2e`, `docker-compose.e2e.yml`, `.env.exemplo`, a skill de testes em `.claude/skills/` e o `.mcp.json`, `playwright.ci.config.ts` (relatórios de pipeline), `playwright.local.config.ts` (navegador instalado na máquina) e `ci/github-actions-e2e.yml` (shards com relatório único).

Os clipes de execução estão em `tatu-web/docs/`.
