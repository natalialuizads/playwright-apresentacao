import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import base from './playwright.config';

/*
 * BDD com Gherkin em português, rodando no Playwright Test (paralelo, trace,
 * relatório HTML, tudo igual). O playwright-bdd lê bdd/*.feature e gera
 * arquivos de teste em .features-gen/ a partir dos passos de bdd/passos.ts.
 * As fixtures do projeto entram pelo bdd/fixtures.ts.
 *
 *   npm run e2e:bdd
 *   PW_CANAL=chrome npm run e2e:bdd     com o Chrome instalado
 */
const testDir = defineBddConfig({
  features: 'bdd/*.feature',
  steps: 'bdd/*.ts',
  language: 'pt',
  outputDir: '.features-gen',
});

const canal = process.env['PW_CANAL'];

export default defineConfig({
  ...base,
  testDir,
  projects: [
    {
      name: 'bdd',
      use: { ...devices['Desktop Chrome'], ...(canal ? { channel: canal } : {}) },
    },
  ],
});
