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
apresentacao/   os 46 slides (HTML + deck.json), com notas do apresentador e os clipes de execução
exemplos/
  tatu-web/     Angular 22 + Playwright (TypeScript)
  tatu-api/     Spring Boot 3.5 + Playwright Java + WireMock
```

## O que a apresentação cobre

1. **Conceitos:** browser, context e page; locators; assertions e auto-wait; fixtures; comparação com o Cypress.
2. **Frontend em Angular:** setup, primeiro teste, mocks de rede (`page.route`, HAR), Page Objects, login reaproveitado, Shadow DOM.
3. **Backend em Java:** JUnit 5, testes de API sem navegador, testes de tela, WireMock, Spring Boot.
4. **Dia a dia:** o que não fazer, boas práticas, relatórios, acessibilidade com axe, CI e novidades de 2026.

## Como rodar os exemplos

### Frontend (tatu-web)

```bash
cd exemplos/tatu-web
npm install
npx playwright install chromium
npm run e2e
```

A suíte tem 43 testes e sobe sozinha o BFF de mentira em Node (porta 8080) e o `ng serve` (porta 4200). Não precisa do Java.

### Backend (tatu-api)

```bash
cd exemplos/tatu-api
mvn verify
```

Serve uma página mínima própria para os testes de tela. Não precisa do Angular.

Cada pasta tem um README com variações, solução de problemas e o mapa do que cada teste ensina. O README em `exemplos/` descreve a história do banco fictício, o contrato da API e um roteiro de estudo.

## Sobre os slides

Os slides estão no formato de apresentação em HTML e CSS com um subset fixo de elementos, resolução 1920 por 1080. Cada arquivo em `apresentacao/slides/` é um slide; a ordem e as seções estão em `apresentacao/deck.json`. As notas do apresentador ficam dentro de cada slide, na tag `aside`.

Os slides com vídeo referenciam os clipes por identificador do editor de slides. Os mesmos clipes, em MP4, estão em `apresentacao/midia/` e em `exemplos/tatu-web/docs/`:

- `terminal.mp4`: `npm run e2e` rodando os testes (3x mais rápido que o real);
- `login.mp4`: o teste de login no navegador, com a legenda do código;
- `mocks.mp4`: um extrato em cinco situações, todas com `page.route`.

## Versões

Playwright para TypeScript 1.65.0. Playwright para Java 1.59.0 (versão fixada no `pom.xml`; confira se há uma mais nova antes de usar).
