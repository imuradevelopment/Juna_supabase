import { test, expect } from '@playwright/test';

// ユーザーログイン機能に関するテストスイート
test.describe('ユーザーログイン', () => {

  // 各テストケースで使用するテストユーザー情報を格納する変数
  let testUser: { email: string; password: string; accountId: string; };
  const baseURL = 'http://localhost:3000'; // ベースURLを定義

  // 各テストケースの実行前に実行されるフック
  test.beforeEach(async ({ page }) => {
    // タイムスタンプを使用して、各テストで一意のユーザー認証情報を生成します
    const timestamp = Date.now();
    testUser = {
        email: `test_login_${timestamp}@example.com`, // 一意なメールアドレス
        password: `password_${timestamp}`, // 一意なパスワード
        accountId: `test_login_id_${timestamp}`, // 一意なアカウントID
    };
    const nickname = `TestLoginUser_${timestamp}`; // 一意なニックネーム

    // --- 事前準備: テスト用ユーザー登録 ---
    // テスト対象のアプリケーション（ホームページ）にアクセス
    await page.goto('/');
    // ページの読み込み完了を待機
    await page.waitForFunction(() => document.readyState === 'complete');
    // ヘッダーにある登録リンクをクリック (静的要素のため timeout 不要)
    await expect(page.getByTestId('header-register-link')).toBeVisible();
    await page.getByTestId('header-register-link').click();
    // 登録ページへの遷移と読み込み完了を待機
    await page.waitForFunction(() => document.readyState === 'complete');
    // URLが登録ページ (`/register`) であることを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/register' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/register', { timeout: 1000 }); // URLの最終確認

    // 登録フォームに必要な情報を入力 (生成した一意な情報を使用)
    await page.locator('[data-testid="nickname-input"]').type(nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(testUser.accountId, { delay: 0 }); // アカウントIDを入力
    await page.locator('[data-testid="email-input"]').type(testUser.email, { delay: 0 }); // メールアドレスを入力
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 }); // パスワードを入力
    await page.locator('[data-testid="password-confirm-input"]').type(testUser.password, { delay: 0 }); // パスワード（確認用）を入力

    // 登録ボタンをクリックしてユーザー登録を実行
    await page.locator('[data-testid="register-button"]').click();

    // 登録成功後、自動的にログインページにリダイレクトされることを期待
    // URLがログインページ (`/login`) であることを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/login' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/login', { timeout: 1000 }); // URLの最終確認
    // 追加: リダイレクトされたログインページの読み込み完了を待機
    await page.waitForFunction(() => document.readyState === 'complete');

    // 以前のコードにあった不要な待機やページ遷移は削除されました。
  });

  test('必須項目が未入力の場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: 前提条件の設定 (beforeEachでログインページにいる)

    // Act: 操作の実行
    await page.locator('[data-testid="login-button"]').click();

    // Assert: 結果の検証
    // 各必須フィールドに対応するエラーメッセージが表示されていることを非同期で確認
    const errorChecks = [
      { testid: 'identifier-error', text: 'メールアドレスまたはアカウントIDは必須です。' },
      { testid: 'password-error', text: 'パスワードは必須です。' },
    ];

    for (const { testid, text } of errorChecks) {
      const selector = `[data-testid="${testid}"]`;
      // waitForFunction で要素が存在し、期待するテキストを持つことを待機
      await page.waitForFunction((arg) => {
        // arg を内部で分割 (仕様通り)
        const { sel, expectedText } = arg;
        const element = document.querySelector(sel);
        return element && element.textContent === expectedText;
      }, { sel: selector, expectedText: text }, { timeout: 5000 });
      // expect で最終確認 (短いタイムアウト)
      await expect(page.locator(selector)).toHaveText(text, { timeout: 1000 });
    }

    // 一般的なログインエラーメッセージが表示されていないことを非同期で確認
    const generalErrorSelector = '[data-testid="login-general-error"]';
    // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
    await page.waitForFunction((arg) => {
        const { sel } = arg;
        return document.querySelector(sel) === null;
    }, { sel: generalErrorSelector }, { timeout: 1000 });
  });

  // --- テストケース: メールアドレスでのログイン成功 ---
  test('メールアドレスでログイン成功すること', async ({ page }) => {
    // Arrange: 入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: ログイン成功とリダイレクト確認
    // ログイン成功後、ホームページ (`/`) にリダイレクトされることを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/', { timeout: 1000 }); // URLの最終確認

    // ログインフォームのエラーメッセージが表示されていないことを非同期で確認
    const errorSelectors = [
      '[data-testid="identifier-error"]',
      '[data-testid="password-error"]',
      '[data-testid="login-general-error"]'
    ];
    for (const selector of errorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { sel } = arg;
        return document.querySelector(sel) === null;
      }, { sel: selector }, { timeout: 1000 });
    }
  });

  // --- テストケース: アカウントIDでのログイン成功 ---
  test('アカウントIDでログイン成功すること', async ({ page }) => {
    // Arrange: 入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.accountId, { delay: 0 }); // アカウントIDを使用
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: ログイン成功とリダイレクト確認
    // ログイン成功後、ホームページ (`/`) にリダイレクトされることを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/' }, { timeout: 10000 });
    await expect(page).toHaveURL(baseURL + '/', { timeout: 1000 }); // URLの最終確認

     // ログインフォームのエラーメッセージが表示されていないことを非同期で確認
     const errorSelectors = [
      '[data-testid="identifier-error"]',
      '[data-testid="password-error"]',
      '[data-testid="login-general-error"]'
    ];
    for (const selector of errorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { sel } = arg;
        return document.querySelector(sel) === null;
      }, { sel: selector }, { timeout: 1000 });
    }
  });

  // --- テストケース: 不正なメールアドレス形式 ---
  test('不正なメールアドレス形式の場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: 不正な形式で入力
    await page.locator('[data-testid="identifier-input"]').type('invalid-email-format', { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // ID/Emailフィールドにバリデーションエラーメッセージが表示されることを非同期で確認
    const selector = '[data-testid="identifier-error"]';
    const expectedText = 'メールアドレスまたは有効なアカウントIDを入力してください。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 10000 });
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="login-general-error"]',
      '[data-testid="password-error"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { selectorToCheck } = arg; // 変数名を変更して衝突回避
        return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });

  // --- テストケース: 存在しないメールアドレス ---
  test('存在しないメールアドレスの場合エラーメッセージが表示されること', async ({ page }) => {
    const nonExistentEmail = `notexists_${Date.now()}@example.com`;
    // Arrange: 存在しないメールアドレスで入力
    await page.locator('[data-testid="identifier-input"]').type(nonExistentEmail, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // 一般的なログインエラーメッセージが表示されることを非同期で確認
    const selector = '[data-testid="login-general-error"]';
    const expectedText = 'メールアドレスまたはパスワードが正しくありません。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 10000 });
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 個別のフィールドエラーが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="identifier-error"]',
      '[data-testid="password-error"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { selectorToCheck } = arg; // 変数名を変更して衝突回避
        return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });

  // --- テストケース: 存在しないアカウントID ---
  test('存在しないアカウントIDの場合エラーメッセージが表示されること', async ({ page }) => {
    const nonExistentAccountId = `not_exists_id_${Date.now()}`;
    // Arrange: 存在しないアカウントIDで入力
    await page.locator('[data-testid="identifier-input"]').type(nonExistentAccountId, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // ID/Emailフィールドに「アカウントIDが見つからない」旨のエラーメッセージが表示されることを非同期で確認
    const selector = '[data-testid="identifier-error"]';
    const expectedText = '入力されたアカウントIDは見つかりません。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 10000 }); // Edge Function 呼び出しを含む可能性があるため長めのタイムアウト
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

     // 他のエラーメッセージが表示されていないことを非同期で確認
     const otherErrorSelectors = [
      '[data-testid="password-error"]',
      '[data-testid="login-general-error"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { selectorToCheck } = arg; // 変数名を変更して衝突回避
        return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });

  // --- テストケース: パスワード間違い ---
  test('パスワードが間違っている場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: 間違ったパスワードで入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('wrong_password', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // 一般的なログインエラーメッセージが表示されることを非同期で確認
    const selector = '[data-testid="login-general-error"]';
    const expectedText = 'メールアドレスまたはパスワードが正しくありません。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 10000 });
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

     // 個別のフィールドエラーが表示されていないことを非同期で確認
     const otherErrorSelectors = [
      '[data-testid="identifier-error"]',
      '[data-testid="password-error"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction の関数引数を (arg) => {} 形式に修正 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { selectorToCheck } = arg; // 変数名を変更して衝突回避
        return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });
}); 
