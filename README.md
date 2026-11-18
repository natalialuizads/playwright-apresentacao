# Playwright: o robô que clica por você

Este é o repositório da apresentação **"Playwright: o robô que clica por você"**, sobre testes de ponta a ponta com Playwright para o front em Angular e o back em Java. Aqui estão os slides e os dois projetos de exemplo usados na apresentação, todos prontos para rodar.

Repositório: https://github.com/natalialuizads/playwright-apresentacao

## Como obter

```bash
git clone https://github.com/natalialuizads/playwright-apresentacao.git
cd playwright-apresentacao
```

## O que tem aqui

```text
apresentacao/   os 58 slides, o visualizador (index.html), as notas do apresentador e os clipes
exemplos/
  tatu-web/     Angular 22 + Playwright (TypeScript)
  tatu-api/     Spring Boot 3.5 + Playwright Java + WireMock
```

## O que a apresentação cobre

1. **Conceitos:** browser, context e page; locators; assertions e auto-wait; fixtures; comparação com o Cypress.
2. **Frontend em Angular:** setup, primeiro teste, mocks de rede (`page.route`, HAR), Page Objects, login reaproveitado, Shadow DOM e microfrontends.
3. **Backend em Java:** JUnit 5, testes de API sem navegador, testes de tela, WireMock, Spring Boot.
4. **Dia a dia:** um desafio, o que não fazer, boas práticas, relatórios, acessibilidade com axe, CI, novidades de 2026 e os próximos passos.

## Como rodar os exemplos

### Frontend (tatu-web)

```bash
cd exemplos/tatu-web
npm install
npx playwright install chromium
npm run e2e
```

A suíte tem 55 testes e sobe sozinha o BFF de mentira em Node (porta 8080) e o `ng serve` (porta 4200). Não precisa do Java.

Se a rede bloquear o download do navegador, troque as duas últimas linhas por `npm run e2e:local`, que usa o Google Chrome instalado na máquina.

### Backend (tatu-api)

```bash
cd exemplos/tatu-api
mvn verify
```

Serve uma página mínima própria para os testes de tela. Não precisa do Angular.

Cada pasta tem um README com variações, solução de problemas e o mapa do que cada teste ensina. O README em `exemplos/` descreve a história do banco fictício, o contrato da API e um roteiro de estudo.

## Como abrir a apresentação

O repositório já traz um visualizador pronto, sem dependências. Depois de clonar:

```bash
# opção 1: abrir o arquivo direto no navegador
#   macOS:   open apresentacao/index.html
#   Linux:   xdg-open apresentacao/index.html
#   Windows: start apresentacao\index.html

# opção 2: servir por HTTP (qualquer um dos dois)
cd apresentacao
python3 -m http.server 8000      # depois abra http://localhost:8000
npx serve .                      # alternativa com Node
```

Teclas: setas, espaço e Enter navegam; **F** liga a tela cheia; **N** mostra as notas do apresentador; Home e End vão ao primeiro e ao último slide. Clicar na lateral esquerda volta e no resto avança, e no celular dá para arrastar. O número do slide fica na URL (por exemplo `index.html#18`).

Os slides usam as fontes IBM Plex Sans e JetBrains Mono do Google Fonts. Sem internet, o navegador usa fontes de reserva e a apresentação continua funcionando, só com outra aparência. Os clipes de execução tocam sozinhos nos slides "Ao vivo".

### Editou um slide?

Os slides são os arquivos de `apresentacao/slides/` e a ordem está em `apresentacao/deck.json`. Depois de mexer, gere o visualizador de novo:

```bash
node apresentacao/gerar-visualizador.mjs
```

## Sobre os slides

Os slides estão em HTML e CSS com um subset fixo de elementos, resolução 1920 por 1080. Cada arquivo em `apresentacao/slides/` é um slide, e as notas do apresentador ficam dentro dele, na tag `aside`.

Os clipes, em MP4, estão em `apresentacao/midia/` e em `exemplos/tatu-web/docs/`:

- `terminal.mp4`: `npm run e2e` rodando os testes (3x mais rápido que o real);
- `login.mp4`: o teste de login no navegador, com a legenda do código;
- `mocks.mp4`: um extrato em cinco situações, todas com `page.route`;
- `ui.mp4`: o modo UI filtrando por tag, rodando e voltando no tempo;
- `trace.mp4`: o Trace Viewer investigando uma falha real (o BFF respondeu 422);
- `relatorio.mp4`: o relatório HTML com um teste que falhou, um instável, filtros por tag e anexos.

## Versões

Playwright para TypeScript 1.65.0. Playwright para Java 1.59.0 (versão fixada no `pom.xml`; confira se há uma mais nova antes de usar).
