// tests/index.spec.ts
// ホームページ (/) の表示と基本的なナビゲーションをテストする。

import { test, expect } from '@playwright/test';

// テストスイート: ホームページ
test.describe('ホームページ', () => {
  // テストで使用するベースURL
  const baseURL = 'http://localhost:3000';

  // 各テストの前に実行されるフック
  test.beforeEach(async ({ page }) => { // 各テスト実行前にページ初期化
    // テスト対象のホームページ (ルートパス '/') にアクセス
    // 注意: page.goto はプロンプト仕様により原則禁止だが、初期パス '/' のみ許可
    await page.goto('/');

    // ページが完全に読み込まれるのを待つ (プロンプト仕様: document.readyState)
    // これにより、DOMの準備が完了し、インタラクションが可能になることを保証する
    await page.waitForFunction(() => document.readyState === 'complete');
  });

  // テストケース: ページタイトルが表示されること
  test('ページタイトルが表示されること', async ({ page }) => { // タイトル確認テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // アサーション: ページのタイトルが期待通り 'ホーム' であることを確認
    // 静的要素なので timeout は指定しない
    await expect(page).toHaveTitle('ホーム');
  });

  // テストケース: デフォルトレイアウトが表示されること
  test('デフォルトレイアウトが表示されること', async ({ page }) => { // レイアウト表示確認テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // アサーション: レイアウトの主要要素 (全体、ヘッダー、メイン、フッター) が
    // data-testid を使って特定でき、表示されていることを確認
    // 静的要素なので timeout は指定しない
    await expect(page.getByTestId('default-layout')).toBeVisible();
    await expect(page.getByTestId('header-placeholder')).toBeVisible();
    await expect(page.getByTestId('main-content')).toBeVisible(); // ローディング完了後に表示されることを想定
    await expect(page.getByTestId('footer-placeholder')).toBeVisible();

    // アサーション: ヘッダー内に未ログイン状態で期待されるリンクが表示されていることを確認
    // 静的要素なので timeout は指定しない
    await expect(page.getByTestId('header-home-link')).toBeVisible(); // ホームへのリンク
    await expect(page.getByTestId('header-register-link')).toBeVisible(); // 新規登録へのリンク
    await expect(page.getByTestId('header-login-link')).toBeVisible(); // ログインへのリンク
  });

  // テストケース: ログインページへ遷移できること
  test('ログインページへ遷移できること', async ({ page }) => { // ログインページ遷移テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // 操作: ヘッダーの「ログイン」リンクを取得
    const loginLink = page.getByTestId('header-login-link');
    // アサーション: リンクが表示されていることを確認 (静的要素)
    await expect(loginLink).toBeVisible();
    // 操作: リンクをクリックしてログインページへ遷移
    await loginLink.click();

    // アサーション (1段階目): URL が `/login` に変更されたことを非同期で確認
    // waitForFunction で location.pathname をポーリング (プロンプト仕様)
    await page.waitForFunction((arg) => {
        const { expectedPath } = arg;
        return window.location.pathname === expectedPath; // 現在のパスが期待値と一致するか
    }, { expectedPath: '/login' }, { timeout: 10000 }); // タイムアウト設定

    // アサーション (2段階目): URL の最終確認 (プロンプト仕様: toHaveURL)
    // toHaveURL は内部でポーリングするため、ここでは短いタイムアウトで最終確認
    await expect(page).toHaveURL(baseURL + '/login', { timeout: 1000 });

    // アサーション (1段階目): ログインフォームの見出し (h2タグ、テキスト 'ログイン') が表示されることを非同期で確認
    // waitForFunction で DOM をポーリング (プロンプト仕様: 暗黙role禁止)
    await page.waitForFunction((arg) => {
      const { tagName, name } = arg;
      // 指定されたタグ名とテキスト内容で要素を検索
      const element = Array.from(document.querySelectorAll(tagName))
                          .find(el => el.textContent?.trim() === name);
      return element; // 要素が見つかれば truthy な値を返す (ポーリング成功)
    }, { tagName: 'h2', name: 'ログイン' }, { timeout: 10000 }); // タイムアウト設定

    // アサーション (2段階目): 見出しの最終確認と可視性確認 (getByRole -> テキストセレクタ)
    // await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible({ timeout: 1000 });
    await expect(page.locator('h2:has-text("ログイン")')).toBeVisible({ timeout: 1000 });
  });

  // テストケース: 登録ページへ遷移できること
  test('登録ページへ遷移できること', async ({ page }) => { // 登録ページ遷移テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // 操作: ヘッダーの「新規登録」リンクを取得
    const registerLink = page.getByTestId('header-register-link');
    // アサーション: リンクが表示されていることを確認 (静的要素)
    await expect(registerLink).toBeVisible();
    // 操作: リンクをクリックして登録ページへ遷移
    await registerLink.click();

    // アサーション (1段階目): URL が `/register` に変更されたことを非同期で確認
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/register' }, { timeout: 10000 });

    // アサーション (2段階目): URL の最終確認
    await expect(page).toHaveURL(baseURL + '/register', { timeout: 1000 });

    // アサーション (1段階目): 登録フォームの見出し (h2タグ、テキスト 'ユーザー登録') が表示されることを非同期で確認
    await page.waitForFunction((arg) => {
      const { tagName, name } = arg;
      const element = Array.from(document.querySelectorAll(tagName))
                          .find(el => el.textContent?.trim() === name);
      return element;
    }, { tagName: 'h2', name: 'ユーザー登録' }, { timeout: 10000 });

    // アサーション (2段階目): 見出しの最終確認と可視性確認 (getByRole -> テキストセレクタ)
    // await expect(page.getByRole('heading', { name: 'ユーザー登録' })).toBeVisible({ timeout: 1000 });
    await expect(page.locator('h2:has-text("ユーザー登録")')).toBeVisible({ timeout: 1000 });
  });
}); 