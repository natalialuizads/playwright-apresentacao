import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/*
 * Configuração "de pipeline": herda tudo do playwright.config.ts e só troca
 * os relatórios. Uso:  npm run e2e:ci
 *
 *  - list   : saída legível no log do CI
 *  - html   : relatório navegável (npx playwright show-report relatorio)
 *  - junit  : XML que Jenkins, GitLab e Azure DevOps entendem
 *  - json   : dados crus, bom para dashboards e scripts próprios
 */
export default defineConfig(base, {
  workers: process.env['CI'] ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'relatorio' }],
    ['junit', { outputFile: 'resultados/junit.xml' }],
    ['json', { outputFile: 'resultados/resultado.json' }],
  ],
});
