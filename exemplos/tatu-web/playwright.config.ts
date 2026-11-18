import { defineConfig, devices } from '@playwright/test';

/*
 * Anatomia do playwright.config.ts, em seis perguntas:
 *
 *   1. O que roda?                testDir, fullyParallel, forbidOnly
 *   2. Quanto tempo e quantas vezes?  timeout, expect.timeout, retries, workers
 *   3. Como relata?               reporter
 *   4. Como cada teste nasce?     use (vale para todos os projetos)
 *   5. Em quais variações?        projects (navegador, login, tags)
 *   6. O que sobe antes?          webServer
 *
 * Quem ganha quando o mesmo campo aparece em mais de um lugar:
 *   flag da linha de comando > test.use() no arquivo > use do projeto > use daqui
 */

const FRONT = 'http://localhost:4200';
const BFF = 'http://localhost:8080';
const CI = !!process.env['CI'];

export default defineConfig({
  // 1. O que roda
  testDir: './e2e',
  fullyParallel: true, // testes do mesmo arquivo também rodam em paralelo
  forbidOnly: CI, // um test.only esquecido quebra o pipeline em vez de pular a suíte

  // 2. Quanto tempo e quantas vezes
  timeout: 30_000, // por teste (padrão: 30 s)
  expect: { timeout: 5_000 }, // por expect, esperando a tela chegar no estado (padrão: 5 s)
  retries: CI ? 2 : 0, // no CI repete a falha; na sua máquina, falha logo
  // workers: sem valor, usa metade dos núcleos da máquina

  // 3. Como relata (o playwright.ci.config.ts troca por html + junit + json)
  reporter: [['list'], ['html', { open: 'never' }]],

  // 4. Como cada teste nasce
  use: {
    baseURL: FRONT, // page.goto('/pix') vira http://localhost:4200/pix
    trace: 'on-first-retry', // grava o trace só quando repete uma falha
    screenshot: 'only-on-failure',
    // locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', viewport: { width: 1280, height: 720 }
  },

  // 5. Em quais variações
  projects: [
    // Faz login uma vez e salva a sessão em e2e/.auth/cliente.json
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Todos os outros testes já começam logados
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/cliente.json' },
      dependencies: ['setup'],
      grepInvert: /@visual/,
    },

    // Regressão visual: só roda quando pedido (npm run e2e:visual)
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/cliente.json' },
      dependencies: ['setup'],
      grep: /@visual/,
    },

    // Outros navegadores, quando fizer sentido:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    // { name: 'mobile', use: { ...devices['Pixel 7'] }, dependencies: ['setup'] },
  ],

  // 6. O que sobe antes: o BFF (o mock em Node, ou o Java se já estiver na 8080)
  // e o ng serve. Na sua máquina, reaproveita o que já estiver rodando.
  webServer: [
    {
      command: 'node mock-bff/server.mjs',
      url: `${BFF}/api/health`,
      reuseExistingServer: !CI,
    },
    {
      command: 'npm start',
      url: FRONT,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
