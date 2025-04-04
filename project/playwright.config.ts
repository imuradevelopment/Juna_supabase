import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// .env ファイルを読み込む
dotenv.config();

// 環境変数からURLを取得
const baseUrl = process.env.BASE_URL;

/**
 * Playwrightテスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // 各テストのタイムアウト
  timeout: 10000,
  // すべてのテストが独立して実行されるようにする
  fullyParallel: true,
  // テスト失敗時のリトライ回数
  retries: 0,
  // テストレポートの設定
  reporter: 'line',
  // テスト実行前の共有グローバル設定
  use: {
    // ベースURL設定
    baseURL: baseUrl,
    // すべてのテストでトレースを取得
    trace: 'on',
    // テスト実行中のスクリーンショットを自動取得
    screenshot: 'only-on-failure',
  },
  // プロジェクトごとの設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 開発サーバーを自動で起動するための設定
  webServer: {
    command: 'npm run dev',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 