import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// .envファイルからBASE_URL読み込み（必須）
dotenv.config();

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 10000, // 各テストの最大待機（10秒固定）
  expect: {
    timeout: 10000, // expectのデフォルトtimeoutも10秒
  },
  fullyParallel: false, // ← 並列禁止（Nuxt dev環境では不安定になる）
  retries: 0,
  workers: 1, // ← 並列テスト禁止（サーバー耐性考慮）

  use: {
    baseURL: baseUrl,
    trace: 'on',
    screenshot: 'only-on-failure',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },

  reporter: 'line',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './playwright.global-setup.ts', // ← Nuxtサーバーが立ってることを保証
});
