import { test, expect } from '@playwright/test';
// createClient は不要になるため削除
// import { createClient } from '@supabase/supabase-js';

test.describe('ユーザー登録', () => {
  // テスト用の共通データ
  const timestamp = Date.now(); // タイムスタンプを共通化
  const existingAccountId = `test_id_exists_${timestamp}`;
  const existingEmail = `exists_${timestamp}@example.com`;
  const functionUrl = 'https://qwsbdmkvozkfpznfzjay.supabase.co/functions/v1/register-user';
  // 環境変数からAnonキーを取得 (テスト環境でのみ使用)
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const baseURL = 'http://localhost:3000'; // ベースURLを定義

  // 事前に重複データを登録しておくヘルパー関数
  const setupDuplicateData = async () => {
    // Anonキーが設定されているか確認
    if (!anonKey) {
      // エラーをスローしてテストを停止
      throw new Error('SUPABASE_ANON_KEY environment variable is not set.');
    }

    // fetch を使用して Edge Function を呼び出す関数
    const callRegisterFunction = async (payload: any) => {
      try {
        // Edge Function に POST リクエストを送信
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Anonキーを Authorization ヘッダーに設定
            'Authorization': `Bearer ${anonKey}`
          },
          body: JSON.stringify(payload),
        });
        // レスポンスボディを JSON として解析
        const responseData = await response.json();
        // レスポンスが成功でなければエラーをスロー
        if (!response.ok) {
          // エッジ関数呼び出し失敗時のエラーメッセージ
          throw new Error(`Edge function call failed: ${responseData.error || response.statusText}`);
        } else {
          // 成功した場合はレスポンスデータを返す
          return responseData;
        }
      } catch (error) {
        // fetch または JSON 解析中のエラー
        throw error; // エラーを再スローしてセットアップの失敗を明確にする
      }
    };

    try {
        // 1. 重複アカウントIDを持つユーザーを作成
        await callRegisterFunction({
            // 一意のメールアドレスを使用
            email: `dummy_for_accountid_${timestamp}@example.com`,
            password: 'password123',
            nickname: 'existing_account_nick',
            // 重複させたいアカウントIDを指定
            accountId: existingAccountId
        });

        // 2. 重複メールアドレスを持つユーザーを作成
        await callRegisterFunction({
            // 重複させたいメールアドレスを指定
            email: existingEmail,
            password: 'password123',
            nickname: 'existing_email_nick',
            // 一意のアカウントIDを使用
            accountId: `dummy_for_email_${timestamp}`
        });

    } catch (setupError) {
        // 重複データセットアップ中のエラー
        // beforeAll が失敗した場合、テストスイート全体が失敗するはずだが念のため
        // エラーオブジェクトの型を確認し、安全にメッセージを取得する
        const errorMessage = setupError instanceof Error ? setupError.message : String(setupError);
        throw new Error(`Duplicate data setup failed: ${errorMessage}, stopping tests.`);
    }
  };

  // 各テストの前に重複データをセットアップ
  test.beforeAll(async () => {
    // セットアップ関数を実行
    await setupDuplicateData();
  });

  test.beforeEach(async ({ page }) => {
    // コンソールログのリスナー設定を削除
    /*
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE: ${msg.type()} ${msg.text()}`);
    });
    */
    // ホームページに移動
    await page.goto('/');
    // ページ読み込み完了を待機
    await page.waitForFunction(() => document.readyState === 'complete');
    // ヘッダーの登録ページへのリンクをクリック (静的要素のため timeout 不要)
    await expect(page.getByTestId('header-register-link')).toBeVisible();
    await page.getByTestId('header-register-link').click();
    // 登録ページ読み込み完了を待機（遷移後のページに対しても必要）
    await page.waitForFunction(() => document.readyState === 'complete');
    // URLが変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/register' }, { timeout: 10000 });
    // URLの最終確認 (短いタイムアウト)
    await expect(page).toHaveURL(baseURL + '/register', { timeout: 1000 });
  });

  // 必須項目をすべて入力した場合にユーザー登録が成功し、ログインページにリダイレクトされることをテスト
  test('必須項目を入力して登録できること', async ({ page }) => {
    // テストデータ用に現在時刻のタイムスタンプを取得
    const timestamp = Date.now();
    // タイムスタンプを含む一意なニックネームを生成
    const nickname = `テストユーザー${timestamp}`;
    // ニックネーム入力フィールド (data-testid='nickname-input') にニックネームを入力 (遅延なし)
    await page.locator('[data-testid="nickname-input"]').type(nickname, { delay: 0 });
    // アカウントID入力フィールド (data-testid='account-id-input') に一意なアカウントIDを入力 (遅延なし)
    await page.locator('[data-testid="account-id-input"]').type('test_account_id_' + Date.now(), { delay: 0 });
    // メールアドレス入力フィールド (data-testid='email-input') に一意なメールアドレスを入力 (遅延なし)
    await page.locator('[data-testid="email-input"]').type(`test_${Date.now()}@example.com`, { delay: 0 });
    // パスワード入力フィールド (data-testid='password-input') にパスワードを入力 (遅延なし)
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });
    // パスワード確認入力フィールド (data-testid='password-confirm-input') に同じパスワードを入力 (遅延なし)
    await page.locator('[data-testid="password-confirm-input"]').type('password123', { delay: 0 });

    // 登録ボタン (data-testid='register-button') をクリックしてフォームを送信
    await page.locator('[data-testid="register-button"]').click();

    // 成功メッセージの確認はコメントアウト (仕様ではリダイレクトを確認)
    // Assert: URLが /login に変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction((arg) => {
      const { expectedPath } = arg;
      return window.location.pathname === expectedPath;
    }, { expectedPath: '/login' }, { timeout: 30000 });
    await expect(page).toHaveURL(baseURL + '/login', { timeout: 1000 }); // URLの最終確認 (短いタイムアウト)

    // 各入力フィールドに対応するエラーメッセージが表示されていないことを非同期で確認
    const errorSelectors = [
      '[data-testid="nickname-error"]',
      '[data-testid="account-id-error"]',
      '[data-testid="email-error"]',
      '[data-testid="password-error"]',
      '[data-testid="password-confirm-error"]',
      '[data-testid="registration-error"]'
    ];

    for (const selector of errorSelectors) {
      // waitForFunction を使用して、要素が存在しないことを確認 (逐語仕様修正)
      await page.waitForFunction((arg) => {
        const { sel } = arg;
        return document.querySelector(sel) === null;
      }, { sel: selector }, { timeout: 1000 });
      // expect(...).not.toBeVisible() は使用しない
    }
  });

  // 必須項目が未入力の状態で登録ボタンを押した場合に、各フィールドでエラーメッセージが表示されることをテスト
  test('必須項目が未入力の場合エラーメッセージが表示されること', async ({ page }) => {
    // 登録ボタン (data-testid='register-button') をクリック
    await page.click('button[data-testid="register-button"]');

    // 各エラーメッセージの testid と期待されるテキストを定義
    const errorChecks = [
      { testid: 'nickname-error', text: 'ニックネームは必須です。' },
      { testid: 'account-id-error', text: 'アカウントIDは必須です。' },
      { testid: 'email-error', text: 'メールアドレスは必須です。' },
      { testid: 'password-error', text: 'パスワードは必須です。' },
      { testid: 'password-confirm-error', text: 'パスワード確認は必須です。' },
    ];

    for (const { testid, text } of errorChecks) {
      const selector = `[data-testid="${testid}"]`;
      // waitForFunction で要素が存在し、期待するテキストを持つことを待機 (非同期表示)
      await page.waitForFunction((arg) => {
        // arg を内部で分割 (仕様通り)
        const { sel, expectedText } = arg;
        const element = document.querySelector(sel);
        return element && element.textContent === expectedText;
      }, { sel: selector, expectedText: text }, { timeout: 10000 });
      // expect で最終確認 (短いタイムアウト)
      await expect(page.locator(selector)).toHaveText(text, { timeout: 1000 });
    }
  });

  // 既に使用されているアカウントIDを入力した場合に、アカウントIDフィールドでエラーメッセージが表示されることをテスト
  test('アカウントIDが重複する場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: テストに必要なデータを準備
    const nickname = 'anotheruser'; // ニックネーム
    const email = `another_${Date.now()}@example.com`; // 一意なメールアドレス
    const password = 'password123'; // パスワード

    // フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type(nickname, { delay: 0 });
    // アカウントID入力フィールドに、事前に作成した重複するアカウントID (existingAccountId) を入力
    await page.locator('[data-testid="account-id-input"]').type(existingAccountId, { delay: 0 });
    await page.locator('[data-testid="email-input"]').type(email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(password, { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: アカウントIDのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="account-id-error"]';
    const expectedText = 'このアカウントIDは既に使用されています。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機 (Edge Function 応答待ち)
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージや成功メッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="email-error"]',
      '[data-testid="registration-error"]',
      '[data-testid="registration-success-message"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction を使用して、要素が存在しないことを確認 (逐語仕様修正)
      await page.waitForFunction((arg) => {
          const { selectorToCheck } = arg;
          return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });

  test('既に存在するメールアドレスの場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: テストに必要なデータを準備
    const nickname = 'anotheruser2'; // ニックネーム
    const accountId = `another_id_${Date.now()}`; // 一意なアカウントID
    const password = 'password123'; // パスワード

    // フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type(nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(accountId, { delay: 0 });
    // メールアドレス入力フィールドに、事前に作成した重複するメールアドレス (existingEmail) を入力
    await page.locator('[data-testid="email-input"]').type(existingEmail, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(password, { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: メールアドレスのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="email-error"]';
    const expectedText = 'このメールアドレスは既に使用されています。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機 (Edge Function 応答待ち)
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージや成功メッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="account-id-error"]',
      '[data-testid="registration-error"]',
      '[data-testid="registration-success-message"]'
    ];
    for (const sel of otherErrorSelectors) {
      // waitForFunction を使用して、要素が存在しないことを確認 (逐語仕様修正)
      await page.waitForFunction((arg) => {
          const { selectorToCheck } = arg;
          return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }
  });

  // アカウントIDに無効な文字（ハイフンや感嘆符など）を入力した場合にエラーメッセージが表示されることをテスト
  test('アカウントIDが無効な形式の場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: beforeEach で登録ページに移動済み、フォームにデータを入力
    // ニックネーム入力
    await page.locator('[data-testid="nickname-input"]').type('invalidformuser', { delay: 0 });
    // アカウントID入力フィールドに無効な形式 ('invalid-id!') を入力
    await page.locator('[data-testid="account-id-input"]').type('invalid-id!', { delay: 0 });
    // メールアドレス入力 (有効な形式)
    await page.locator('[data-testid="email-input"]').type('valid@example.com', { delay: 0 });
    // パスワード入力
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });
    // パスワード確認入力
    await page.locator('[data-testid="password-confirm-input"]').type('password123', { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: アカウントIDのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="account-id-error"]';
    const expectedText = 'アカウントIDは半角英数字とアンダースコア(_)のみ使用できます。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機 (バリデーションはクライアントサイドのため短い待機時間)
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 5000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
  });

  // メールアドレスが無効な形式（例: @がない）の場合にエラーメッセージが表示されることをテスト
  test('メールアドレスが無効な形式の場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type('invalidemailuser', { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type('valid_account_id', { delay: 0 });
    // メールアドレス入力フィールドに無効な形式 ('invalid-email') を入力
    await page.locator('[data-testid="email-input"]').type('invalid-email', { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type('password123', { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: メールアドレスのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="email-error"]';
    const expectedText = '有効なメールアドレスを入力してください。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 5000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
  });

  // パスワードが短すぎる場合にエラーメッセージが表示されることをテスト
  test('パスワードが短すぎる場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type('shortpassworduser', { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type('valid_id_shortpw', { delay: 0 });
    await page.locator('[data-testid="email-input"]').type('shortpw@example.com', { delay: 0 });
    // パスワード入力フィールドに短いパスワード ('12345') を入力
    await page.locator('[data-testid="password-input"]').type('12345', { delay: 0 });
    // パスワード確認入力フィールドにも同じ短いパスワードを入力
    await page.locator('[data-testid="password-confirm-input"]').type('12345', { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: パスワードのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="password-error"]';
    const expectedText = 'パスワードは6文字以上である必要があります。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 5000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
  });

  // パスワードとパスワード確認が一致しない場合にエラーメッセージが表示されることをテスト
  test('パスワード確認が一致しない場合エラーメッセージが表示されること', async ({ page }) => {
    // Arrange: フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type('mismatchuser', { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type('mismatch_id', { delay: 0 });
    await page.locator('[data-testid="email-input"]').type('mismatch@example.com', { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });
    // パスワード確認入力フィールドに異なるパスワード ('password456') を入力
    await page.locator('[data-testid="password-confirm-input"]').type('password456', { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: パスワード確認のエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="password-confirm-error"]';
    const expectedText = 'パスワードが一致しません。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 5000 });
    // expect で最終確認 (短いタイムアウト)
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
  });
});