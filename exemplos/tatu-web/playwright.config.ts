import { defineConfig, devices } from '@playwright/test';

const FRONT = 'http://localhost:4200';
const BFF = 'http://localhost:8080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: FRONT,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1. Faz login uma vez e salva a sessão em e2e/.auth/cliente.json
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // 2. Todos os outros testes já começam logados
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/cliente.json' },
      dependencies: ['setup'],
      grepInvert: /@visual/,
    },

    // 3. Regressão visual: só roda quando pedido (npm run e2e:visual)
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/cliente.json' },
      dependencies: ['setup'],
      grep: /@visual/,
    },
  ],

  // Sobe o BFF (o mock em Node, ou reaproveita o Java se já estiver na 8080)
  // e o ng serve antes dos testes.
  webServer: [
    {
      command: 'node mock-bff/server.mjs',
      url: `${BFF}/api/health`,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'npm start',
      url: FRONT,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
