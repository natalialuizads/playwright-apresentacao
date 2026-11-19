import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

/*
 * A suíte inteira em vários navegadores e no celular.
 *
 *   npx playwright install chromium firefox webkit   (uma vez)
 *   npm run e2e:navegadores
 *   npm run e2e:navegadores -- --project=iphone      só um deles
 *
 * WebKit é o motor do Safari: é o mais perto do iPhone que dá para rodar no CI.
 * Firefox e WebKit não rodam com channel (Chrome e Edge instalados): usam
 * sempre o navegador baixado pelo Playwright.
 */
const sessao = { storageState: 'e2e/.auth/cliente.json' };
const comum = { dependencies: ['setup'], grepInvert: /@visual|@lighthouse/ };

export default defineConfig({
  ...base,
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...sessao }, ...comum },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], ...sessao }, ...comum },
    { name: 'webkit', use: { ...devices['Desktop Safari'], ...sessao }, ...comum },
    { name: 'android', use: { ...devices['Pixel 7'], ...sessao }, ...comum },
    { name: 'iphone', use: { ...devices['iPhone 15'], ...sessao }, ...comum },
  ],
});
