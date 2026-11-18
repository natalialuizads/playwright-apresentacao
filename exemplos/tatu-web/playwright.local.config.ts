import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/*
 * Roda a suíte no navegador que JÁ ESTÁ instalado na máquina, sem
 * npx playwright install. Útil quando a rede bloqueia o download dos
 * navegadores do Playwright ou quando você quer ver o teste no Chrome de verdade.
 *
 *   npm run e2e:local                         Google Chrome instalado (channel 'chrome')
 *   PW_CANAL=msedge npm run e2e:local         Microsoft Edge
 *   PW_EXECUTAVEL=/caminho/do/chrome npm run e2e:local
 *                                             um executável específico (Chromium, Chrome portátil)
 *   PW_LENTO=500 npm run e2e:local -- --headed
 *                                             com janela e meio segundo entre as ações
 *
 * No PowerShell: $env:PW_CANAL="msedge"; npm run e2e:local
 *
 * Herda tudo do playwright.config.ts e só muda de onde vem o navegador.
 */

const executavel = process.env['PW_EXECUTAVEL'];
const canal = process.env['PW_CANAL'] ?? 'chrome';
const lento = Number(process.env['PW_LENTO'] ?? 0);

const navegador = executavel
  ? { launchOptions: { executablePath: executavel, slowMo: lento } }
  : { channel: canal, launchOptions: { slowMo: lento } };

export default defineConfig({
  ...base,
  projects: base.projects!.map((projeto) => ({
    ...projeto,
    use: { ...projeto.use, ...navegador },
  })),
});
