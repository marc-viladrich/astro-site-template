import { defineConfig, devices } from '@playwright/test';

// Tests laufen gegen den gebauten Output (astro preview), nicht gegen den Dev-Server,
// damit genau das geprüft wird, was deployt wird.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:4399', trace: 'retain-on-failure' },
  webServer: { command: 'npx astro preview --ignore-lock --host 127.0.0.1 --port 4399', url: 'http://127.0.0.1:4399/', reuseExistingServer: !process.env.CI, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
