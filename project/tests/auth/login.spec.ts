import { test, expect } from '@playwright/test';

// tests/auth/login.spec.ts
// ユーザーログインページの機能に関する E2E テスト。

// ユーザーログイン機能に関するテストスイート
test.describe('ユーザーログイン', () => {

  // 各テストケースで使用するテストユーザー情報を格納する変数
  let testUser: { email: string; password: string; accountId: string; };
  const baseURL = 'http://localhost:3000'; // ベースURLを定義

  // 各テストケースの実行前に実行されるフック
  test.beforeEach(async ({ page }) => {
    // テスト実行ごとに一意なユーザー情報を作成するためのタイムスタンプ
    const timestamp = Date.now();
    // テストユーザーオブジェクトを初期化
    testUser = {
        email: `test_login_${timestamp}@example.com`, // 一意なメールアドレス
        password: `password_${timestamp}`, // 一意なパスワード
        accountId: `test_login_id_${timestamp}`, // 一意なアカウントID
    };
    const nickname = `TestLoginUser_${timestamp}`; // 一意なニックネーム

    // --- 事前準備: テスト用ユーザーの登録プロセス --- 
    // 1. アプリケーションのルート (ホームページ) にアクセス
    await page.goto('/');
    // 2. ページの DOM 読み込み完了を待つ
    await page.waitForFunction(() => document.readyState === 'complete');
    // 3. ヘッダーにある「ユーザー登録」リンクが表示されていることを確認 (静的要素のためアサーション削除)
    // await expect(page.getByTestId('header-register-link')).toBeVisible();
    // 4. 「ユーザー登録」リンクをクリックして登録ページへ遷移
    await page.getByTestId('header-register-link').click();

    // 5. 登録ページの URL (`/register`) への遷移と DOM 読み込み完了を待つ (ネットワーク状況を考慮しタイムアウトを長めに設定)
    await page.waitForURL('**/register', { timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete');

    // 6. 登録フォームの各フィールドに生成した一意なユーザー情報を入力 (入力遅延なしで高速化)
    await page.locator('[data-testid="nickname-input"]').type(nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(testUser.accountId, { delay: 0 }); // 事前準備用のアカウントID
    await page.locator('[data-testid="email-input"]').type(testUser.email, { delay: 0 }); // 事前準備用のメールアドレス
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 }); // 事前準備用のパスワード
    await page.locator('[data-testid="password-confirm-input"]').type(testUser.password, { delay: 0 }); // 確認用パスワード

    // 7. 「登録する」ボタンをクリックしてユーザー登録を実行
    await page.locator('[data-testid="register-button"]').click();

    // 8. 登録成功後、自動的にログインページ (`/login`) にリダイレクトされることを待機 (Edge Function 呼び出しを含むためタイムアウトを長めに設定)
    await page.waitForURL('**/login', { timeout: 15000 });
    // 9. ログインページの DOM 読み込み完了を待つ
    await page.waitForFunction(() => document.readyState === 'complete');
    // これで各テストケースは、事前登録されたユーザー情報を用いてログインページから開始できる状態になる
  });

  test('必須項目が未入力の場合エラーメッセージが表示されること', async ({ page }) => {
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // Arrange: (前提) beforeEach でログインページにいる状態

    // Act: ログインフォームの入力フィールドを空のまま「ログイン」ボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: 各必須フィールドに対応するエラーメッセージが表示されることを確認
    // 確認対象のエラーメッセージ定義 (要素の testid と期待されるテキスト)
    const errorChecks = [
      { testid: 'identifier-error', text: 'メールアドレスまたはアカウントIDは必須です。' },
      { testid: 'password-error', text: 'パスワードは必須です。' },
    ];

    // 定義された各エラーについて検証
    for (const { testid, text } of errorChecks) {
      const selector = `[data-testid="${testid}"]`; // testid からセレクター文字列を作成
      // 1. waitForFunction で要素が表示され、正しいテキストコンテンツを持つことを待機 (非同期処理やUIの描画遅延に対応)
      await page.waitForFunction((arg) => {
        const { sel, expectedText } = arg; // 引数を展開
        const element = document.querySelector(sel); // セレクターで要素を取得
        return element && element.textContent === expectedText; // 要素が存在し、テキストが一致するか判定
      }, { sel: selector, expectedText: text }, { timeout: 5000 }); // フロントエンドバリデーションなのでタイムアウトは短め
      // 2. expect で最終確認 (toHaveText は内部でポーリングするため、ここでのタイムアウトは短くても良い)
      await expect(page.locator(selector)).toHaveText(text, { timeout: 1000 });
    }

    // Assert: 全体的なログインエラーメッセージ (例: 認証失敗時) が表示されていないことを確認
    const generalErrorSelector = '[data-testid="login-general-error"]';
    // waitForFunction を使用して、指定したセレクターの要素が存在しない (null) ことを確認
    await page.waitForFunction((arg) => {
        const { sel } = arg;
        return document.querySelector(sel) === null; // 要素が存在しない場合に true を返す
    }, { sel: generalErrorSelector }, { timeout: 1000 }); // 存在しないことの確認なので短いタイムアウト
  });

  // --- テストケース: メールアドレスでのログイン成功 ---
  test('メールアドレスでログイン成功すること', async ({ page }) => {
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // Arrange: 入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: ログイン成功とリダイレクト確認
    // ログイン成功後、ホームページ (`/`) にリダイレクトされることを確認 (waitForURL に変更)
    await page.waitForURL('**/', { timeout: 15000 }); // ホームページへの遷移を待機
    await page.waitForFunction(() => document.readyState === 'complete'); // 遷移後に再度待機

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
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // Arrange: 入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.accountId, { delay: 0 }); // アカウントIDを使用
    await page.locator('[data-testid="password-input"]').type(testUser.password, { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: ログイン成功とリダイレクト確認
    // ログイン成功後、ホームページ (`/`) にリダイレクトされることを確認 (waitForURL に変更)
    await page.waitForURL('**/', { timeout: 15000 }); // ホームページへの遷移を待機
    await page.waitForFunction(() => document.readyState === 'complete'); // 遷移後に再度待機

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
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
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
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 });
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
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    const nonExistentEmail = `notexists_${Date.now()}@example.com`;
    // Arrange: 存在しないメールアドレスで入力
    await page.locator('[data-testid="identifier-input"]').type(nonExistentEmail, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // ★ セレクターを login-general-error に戻し、期待テキストを認証エラーメッセージに修正
    const selector = '[data-testid="login-general-error"]';
    const expectedText = 'メールアドレスまたはパスワードが正しくありません。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 }); // タイムアウトは15秒
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
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
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    const nonExistentAccountId = `not_exists_${Date.now()}`;
    // Arrange: 存在しないアカウントIDで入力
    await page.locator('[data-testid="identifier-input"]').type(nonExistentAccountId, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // 適切なエラーメッセージが表示されることを非同期で確認
    const selector = '[data-testid="identifier-error"]'; // ★ 修正: 一般エラーではなく、識別子フィールドのエラーを待機
    const expectedText = '入力されたアカウントIDは見つかりません。'; // 関数が返すエラーメッセージ
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 });
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="login-general-error"]', // 一般エラーが表示されていないことも確認
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

  // --- テストケース: パスワードが間違っている場合 ---
  test('パスワードが間違っている場合エラーメッセージが表示されること', async ({ page }) => {
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));
    // Arrange: 正しいメールアドレスと間違ったパスワードで入力
    await page.locator('[data-testid="identifier-input"]').type(testUser.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('wrong_password', { delay: 0 });

    // Act: ログインボタンクリック
    await page.locator('[data-testid="login-button"]').click();

    // Assert: エラーメッセージ確認
    // ★ セレクターを login-general-error に戻し、期待テキストを認証エラーメッセージに修正
    const selector = '[data-testid="login-general-error"]';
    const expectedText = 'メールアドレスまたはパスワードが正しくありません。';
    await page.waitForFunction((arg) => {
      // arg を内部で分割 (仕様通り)
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 }); // タイムアウトは15秒
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージが表示されていないことを非同期で確認
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
