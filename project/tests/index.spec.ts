import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  const baseURL = 'http://localhost:3000'; // ベースURLを定義

  test.beforeEach(async ({ page }) => {
    // コンソールログのリスナー
    // page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()} ${msg.text()}`));
    // ホームページに移動
    await page.goto('/');
    // ページが完全にロードされるまで待機 (仕様に合わせて修正)
    await page.waitForFunction(() => document.readyState === 'complete');
  });

  test('ページタイトルが表示されること', async ({ page }) => {
    // Assert: ページタイトルを確認 (静的要素のため timeout 不要)
    await expect(page).toHaveTitle('ホームページ');
  });

  // レイアウト確認テストを追加
  test('デフォルトレイアウトが表示されること', async ({ page }) => {
    // Assert: ヘッダー、メインコンテンツ、フッターが data-testid で特定でき、表示されていることを確認 (静的要素のため timeout 不要)
    await expect(page.getByTestId('default-layout')).toBeVisible();
    await expect(page.getByTestId('header-placeholder')).toBeVisible();
    await expect(page.getByTestId('main-content')).toBeVisible();
    await expect(page.getByTestId('footer-placeholder')).toBeVisible();

    // Assert: ヘッダー内に期待されるリンクが表示されていることを確認 (静的要素のため timeout 不要)
    await expect(page.getByTestId('header-home-link')).toBeVisible();
    await expect(page.getByTestId('header-register-link')).toBeVisible();
    await expect(page.getByTestId('header-login-link')).toBeVisible();
  });

  test('ログインページへ遷移できること', async ({ page }) => {
    // Act: ヘッダーの「ログイン」リンクをクリック
    const loginLink = page.getByTestId('header-login-link');
    await expect(loginLink).toBeVisible(); // 静的なリンクなのでtimeout不要
    await loginLink.click();

    // Assert: URLが /login に変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
        const { expectedPath } = arg;
        return window.location.pathname === expectedPath;
    }, { expectedPath: '/login' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/login', { timeout: 1000 }); // URLの最終確認 (短いタイムアウト)

    // Assert: ログインフォームの見出しが表示されることを非同期で確認 (新逐語仕様: 暗黙role禁止)
    await page.waitForFunction((arg) => {
      const { tagName, name } = arg;
      // h2タグ名とtextContentで要素を検索 (暗黙role回避)
      const element = Array.from(document.querySelectorAll(tagName))
                          .find(el => el.textContent?.trim() === name);
      return element; // 要素が見つかればtruthyな値を返す
    }, { tagName: 'h2', name: 'ログイン' }, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible({ timeout: 1000 }); // expect側はgetByRoleを許容 (Playwright API)
  });

  // 新規テストケース: 登録ページへの遷移
  test('登録ページへ遷移できること', async ({ page }) => {
    // Act: ヘッダーの「新規登録」リンクをクリック
    const registerLink = page.getByTestId('header-register-link');
    await expect(registerLink).toBeVisible(); // 静的なリンクなのでtimeout不要
    await registerLink.click();

    // Assert: URLが /register に変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/register' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/register', { timeout: 1000 }); // URLの最終確認 (短いタイムアウト)

    // Assert: 登録フォームの見出しが表示されることを非同期で確認 (新逐語仕様: 暗黙role禁止)
    await page.waitForFunction((arg) => {
      const { tagName, name } = arg;
      // h2タグ名とtextContentで要素を検索 (暗黙role回避)
      const element = Array.from(document.querySelectorAll(tagName))
                          .find(el => el.textContent?.trim() === name);
      return element; // 要素が見つかればtruthyな値を返す
    }, { tagName: 'h2', name: 'ユーザー登録' }, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'ユーザー登録' })).toBeVisible({ timeout: 1000 }); // expect側はgetByRoleを許容 (Playwright API)
  });
}); 