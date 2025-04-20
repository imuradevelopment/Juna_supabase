import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error('[playwright.config.ts] BASE_URL is not defined. テスト実行は許可されません。');
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000, // 修正: 各テスト最大30秒に変更
  expect: {
    timeout: 30_000, // 修正: expectのタイムアウトも30秒に変更
  },
  fullyParallel: false, // ページ逐次生成の制約に対応
  forbidOnly: true,     // 本番CI向け制約強化
  retries: 0,           // テスト再実行による逃げを禁止
  workers: 1,           // 並列性禁止（逐次進行制約の一環）
  reporter: 'line',     // プロンプトで明示されたreporter指定
  use: {
    baseURL: baseUrl, // CI環境では process.env.CI ? process.env.NGROK_BASE_URL : baseUrl のような切り替えを検討
    trace: 'retain-on-failure', // テスト失敗時にトレースを保持
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  globalSetup: './playwright.global-setup.ts',
});
