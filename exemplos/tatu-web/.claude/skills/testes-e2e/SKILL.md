---
name: testes-e2e
description: Como escrever e consertar testes Playwright neste projeto (tatu-web). Use ao criar, revisar ou corrigir arquivos em e2e/ ou bdd/.
---

# Testes e2e do tatu-web

## Antes de escrever

- Leia `e2e/fixtures.ts`: use as fixtures que já existem (`novoCliente`, `entrarComo`, `bff`, `pix`, `extrato`, `login`) antes de criar código novo.
- Importe `test` e `expect` de `./fixtures`, não de `@playwright/test`.
- Para ver a tela antes de escrever, rode o app (`npm run mock-bff` e `npm start`) e use a CLI do Playwright ou o MCP para ler o snapshot de acessibilidade.

## Regras

1. Locators por papel e rótulo: `getByRole`, `getByLabel`, `getByText`. `getByTestId` só quando não houver papel. Nunca CSS de layout nem XPath.
2. Nunca `waitForTimeout`. Espere por estado com `expect(...)` (web-first).
3. Nada de `force: true`, `if`, `for` ou `try` dentro do teste.
4. Dado de teste pela API (`novoCliente`), nunca clicando várias telas. Cada teste cria o seu.
5. O nome do teste descreve o comportamento: `'Pix acima do saldo mostra aviso'`.
6. Mock só nas bordas, com `page.route` ou a fixture `bff`.
7. Valores em reais: `expect(locator).toMostrarReais(70)`.

## Ao consertar um teste que falhou

- Abra o trace (`npx playwright show-trace`) e descubra a causa antes de mudar o teste.
- Não afrouxe uma asserção nem aumente timeout para o teste passar. Se o app mudou de propósito, atualize o teste; se o app quebrou, diga isso.
- Nunca use `test.skip` para esconder uma falha.

## Rodar

```bash
npx playwright test e2e/<arquivo>.spec.ts --project=chromium
npm run e2e:bdd
```
