import { test, expect } from '@playwright/test';
// createClient は不要になるため削除
// import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test'; // Page 型をインポート
import type { UserCredentials } from '../../types/index'; // UserCredentials 型をインポート

// --- テスト用ヘルパー関数 (削除テストからコピー＆調整) ---

/**
 * waitForFunction 用: 指定された data-testid を持つ要素が存在し、かつ表示されているか確認
 */
const isElementVisible = (testId: string): boolean => {
  const element = document.querySelector(`[data-testid=\"${testId}\"]`);
  return !!element && window.getComputedStyle(element).display !== 'none';
};

/**
 * waitForFunction 用: 指定された URL に遷移したか確認
 */
const checkCurrentPath = (targetPath: string): boolean => {
  return window.location.pathname === targetPath;
};

/**
 * ランダムな文字列を生成
 */
const generateRandomString = (length: number): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * ランダムなユーザー情報を生成
 */
const generateRandomCredentials = (): UserCredentials => {
  const uniqueSuffix = Date.now().toString(36) + generateRandomString(5);
  const nickname = `User_${generateRandomString(8)}`;
  const accountId = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)}_${uniqueSuffix}`.substring(0, 15);

  return {
    email: `test_user_${uniqueSuffix}@example.com`,
    password: `Pass_${uniqueSuffix}_A1!`,
    nickname: nickname,
    accountId: accountId
  };
};

/**
 * ユーザー登録処理 (UI操作)
 */
const registerUserViaUI = async (page: Page, credentials: UserCredentials): Promise<void> => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 }); // タイムアウト短縮
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
  await page.getByTestId('header-register-link').click();
  await page.waitForFunction(checkCurrentPath, '/register', { timeout: 10000 }); // タイムアウト短縮

  await page.getByTestId('nickname-input').type(credentials.nickname, { delay: 0 });
  await page.getByTestId('account-id-input').type(credentials.accountId, { delay: 0 });
  await page.getByTestId('email-input').type(credentials.email, { delay: 0 });
  await page.getByTestId('password-input').type(credentials.password, { delay: 0 });
  await page.getByTestId('password-confirm-input').type(credentials.password, { delay: 0 });
  await page.getByTestId('register-button').click();

  // ログインページにリダイレクトされるのを待つ
  await page.waitForFunction(checkCurrentPath, '/login', { timeout: 15000 }); // タイムアウト短縮
};

/**
 * ログイン処理 (UI操作)
 */
const loginUserViaUI = async (page: Page, identifier: string, password: string): Promise<void> => {
  if (page.url() !== page.context().browser()?.contexts()[0].pages()[0].url().split('/')[0] + '//' + page.context().browser()?.contexts()[0].pages()[0].url().split('/')[2] + '/login') { // page.goto('/login') を避けるためURL比較で分岐
      const loginLinkVisible = await page.waitForFunction(isElementVisible, 'header-login-link', { timeout: 5000 }).catch(() => false);
      if (loginLinkVisible) {
          await page.getByTestId('header-login-link').click();
      } else {
          // ログインリンクが見つからない場合 (すでに/loginにいる可能性も考慮)
          try {
              await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
          } catch (e) {
              console.warn(`ログインページへの遷移失敗 (無視): ${e}`); // goto失敗は許容
          }
      }
      await page.waitForFunction(checkCurrentPath, '/login', { timeout: 10000 });
  }
  await expect(page.locator('h2:has-text("ログイン")')).toBeVisible({ timeout: 5000 });
  const identifierInput = page.getByTestId('identifier-input');
  await expect(identifierInput).toBeVisible({ timeout: 5000 });
  await identifierInput.fill(''); // fillでクリアしてからtype
  await identifierInput.type(identifier, { delay: 0 });
  const passwordInput = page.getByTestId('password-input');
  await passwordInput.fill(''); // fillでクリアしてからtype
  await passwordInput.type(password, { delay: 0 });
  await page.getByTestId('login-button').click();
  await page.waitForFunction(isElementVisible, 'header-profile-link', { timeout: 15000 }); // ログイン完了待ち
};

/**
 * ユーザー削除処理 (UI操作) - API失敗時にエラーを検知するよう修正
 */
const deleteUserViaUI = async (page: Page): Promise<void> => {
  // プロフィールページが表示されるまで待機
  await page.waitForFunction(isElementVisible, 'header-profile-link', { timeout: 10000 });
  await page.getByTestId('header-profile-link').click();
  await page.waitForFunction(checkCurrentPath, '/profile', { timeout: 10000 });
  await page.waitForFunction(isElementVisible, 'profile-edit-link', { timeout: 5000 });
  await page.getByTestId('profile-edit-link').click();
  await page.waitForFunction(checkCurrentPath, '/profile/edit', { timeout: 10000 });
  await page.waitForFunction(isElementVisible, 'delete-account-button', { timeout: 15000 });

  // ダイアログを承認するリスナーを一度だけ設定
  page.once('dialog', async dialog => {
    console.log(`[deleteUserViaUI] Dialog message: ${dialog.message()}`); // デバッグ用にメッセージを出力
    await dialog.accept();
  });

  // 削除ボタンをクリック
  await page.getByTestId('delete-account-button').click();

  // --- API 失敗検知とリダイレクト確認 ---
  try {
    // 1. まずエラーメッセージが表示されないか短時間待機 (5秒)
    //    表示された場合は API 失敗とみなし、ここでエラーを発生させる
    await page.waitForFunction((selector) => {
      const element = document.querySelector(selector);
      // 要素が存在し、表示されている場合はエラーとみなす (false を返してエラーを発生させる)
      if (element && window.getComputedStyle(element).display !== 'none') {
        console.error('[deleteUserViaUI] エラーメッセージが表示されたため、削除失敗と判断します。');
        return false; // waitForFunction は false を返すとエラーになる
      }
      return true; // エラー要素がない、または非表示なら true (待機継続)
    }, '[data-testid="profile-edit-delete-error"]', { timeout: 5000 });

    // 2. エラーが表示されなければ、ホームページへのリダイレクトを待つ (15秒)
    //    API 失敗時はリダイレクトされないため、ここでタイムアウトが発生するはず
    await page.waitForFunction(checkCurrentPath, '/', { timeout: 15000 });

    // 3. リダイレクト後、ログインリンクが表示されるか確認 (10秒)
    await page.waitForFunction(isElementVisible, 'header-login-link', { timeout: 10000 });

    console.log('[deleteUserViaUI] アカウント削除とリダイレクトが正常に完了しました。');

  } catch (error) {
    // waitForFunction が false を返した場合、またはタイムアウトした場合にここに来る
    console.error('[deleteUserViaUI] アカウント削除処理（クリーンアップ）に失敗したか、タイムアウトしました:', error);
    // ★ エラーを再スローしてテストを失敗させる
    throw new Error(`deleteUserViaUI failed during cleanup: ${error instanceof Error ? error.message : String(error)}`);
  }
};


test.describe('ユーザー登録', () => {
  // テスト用の共通データ (baseURLのみ残す)
  // const timestamp = Date.now(); // 不要
  // const existingAccountId = `test_id_exists_${timestamp}`; // 不要
  // const existingEmail = `exists_${timestamp}@example.com`; // 不要
  // const functionUrl = 'https://qwsbdmkvozkfpznfzjay.supabase.co/functions/v1/register-user'; // 不要
  // const anonKey = process.env.SUPABASE_ANON_KEY; // 不要
  const baseURL = 'http://localhost:3000'; // テスト対象のベースURL

  // --- beforeAll フックと setupDuplicateData 関数を削除 ---
  // // 事前に重複データを登録しておくヘルパー非同期関数
  // const setupDuplicateData = async () => { ... };
  // // 各テストの前に重複データをセットアップ (スイート実行前に一度だけ)
  // test.beforeAll(async () => { ... });

  test.beforeEach(async ({ page }) => { // 各テスト実行前にページ初期化と登録ページへの遷移
    // コンソールログのリスナー設定を削除
    /*
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE: ${msg.type()} ${msg.text()}`);
    });
    */
    // ホームページに移動
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 }); // タイムアウト短縮
    // ページ読み込み完了を待機
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }); // タイムアウト短縮
    // ヘッダーの登録ページへのリンクをクリック (静的要素のため timeout 不要)
    await expect(page.getByTestId('header-register-link')).toBeVisible({ timeout: 5000 }); // timeout追加
    await page.getByTestId('header-register-link').click();
    // 登録ページ読み込み完了を待機（遷移後のページに対しても必要）
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }); // タイムアウト短縮
    // URLが変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction(checkCurrentPath, '/register', { timeout: 10000 }); // タイムアウト短縮、関数化
    // URLの最終確認 (短いタイムアウト)
    await expect(page).toHaveURL(baseURL + '/register', { timeout: 1000 });
  });

  // 必須項目をすべて入力した場合にユーザー登録が成功し、ログインページにリダイレクトされることをテスト
  test('必須項目を入力して登録できること', async ({ page }) => { // 正常系: 必須項目入力時の登録成功テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // テストデータ用にランダムなユーザー情報を生成
    const userData = generateRandomCredentials();
    // ニックネーム入力フィールド (data-testid='nickname-input') にニックネームを入力 (遅延なし)
    await page.locator('[data-testid="nickname-input"]').type(userData.nickname, { delay: 0 });
    // アカウントID入力フィールド (data-testid='account-id-input') に一意なアカウントIDを入力 (遅延なし)
    await page.locator('[data-testid="account-id-input"]').type(userData.accountId, { delay: 0 });
    // メールアドレス入力フィールド (data-testid='email-input') に一意なメールアドレスを入力 (遅延なし)
    await page.locator('[data-testid="email-input"]').type(userData.email, { delay: 0 });
    // パスワード入力フィールド (data-testid='password-input') にパスワードを入力 (遅延なし)
    await page.locator('[data-testid="password-input"]').type(userData.password, { delay: 0 });
    // パスワード確認入力フィールド (data-testid='password-confirm-input') に同じパスワードを入力 (遅延なし)
    await page.locator('[data-testid="password-confirm-input"]').type(userData.password, { delay: 0 });

    // 登録ボタン (data-testid='register-button') をクリックしてフォームを送信
    await page.locator('[data-testid="register-button"]').click();

    // 成功メッセージの確認はコメントアウト (仕様ではリダイレクトを確認)
    // Assert: URLが /login に変更されたことを非同期で確認 (逐語仕様修正)
    await page.waitForFunction(checkCurrentPath, '/login', { timeout: 15000 }); // タイムアウト短縮、関数化
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

    // --- クリーンナップ処理 (登録したユーザーを削除) ---
    // ログイン
    await loginUserViaUI(page, userData.email, userData.password);
    // 削除
    await deleteUserViaUI(page);
  });

  // 必須項目が未入力の状態で登録ボタンを押した場合に、各フィールドでエラーメッセージが表示されることをテスト
  test('必須項目が未入力の場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: 必須項目未入力時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

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
      const selector = `[data-testid=\"${testid}\"]`;
      // waitForFunction で要素が存在し、期待するテキストを持つことを待機 (非同期表示)
      await page.waitForFunction((arg) => {
        // arg を内部で分割 (仕様通り)
        const { sel, expectedText } = arg;
        const element = document.querySelector(sel);
        return element && element.textContent === expectedText;
      }, { sel: selector, expectedText: text }, { timeout: 5000 }); // タイムアウト短縮
      // expect で最終確認 (短いタイムアウト)
      await expect(page.locator(selector)).toHaveText(text, { timeout: 1000 });
    }
    // このテストではユーザーは作成されないため、クリーンナップは不要
  });

  // 既に使用されているアカウントIDを入力した場合に、アカウントIDフィールドでエラーメッセージが表示されることをテスト
  test('アカウントIDが重複する場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: アカウントID重複時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // --- 事前準備: 重複確認用のユーザーをUI経由で登録 ---
    const existingUserData = generateRandomCredentials();
    await registerUserViaUI(page, existingUserData);
    // 登録後に /login にいるので、再度登録ページへ移動
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    await page.getByTestId('header-register-link').click();
    await page.waitForFunction(checkCurrentPath, '/register', { timeout: 10000 });

    // --- 重複テスト実行 ---
    const newUserData = generateRandomCredentials(); // 重複テスト用の新しいユーザー情報

    // フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type(newUserData.nickname, { delay: 0 });
    // アカウントID入力フィールドに、事前に作成した重複するアカウントIDを入力
    await page.locator('[data-testid="account-id-input"]').type(existingUserData.accountId, { delay: 0 }); // ★ ここで重複させる
    await page.locator('[data-testid="email-input"]').type(newUserData.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(newUserData.password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(newUserData.password, { delay: 0 });

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
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 }); // タイムアウト短縮
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

    // --- クリーンナップ: 事前準備で作成したユーザーを削除 ---
    // ログアウト状態かもしれないので、一度ホームに戻ってからログイン・削除
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    await loginUserViaUI(page, existingUserData.email, existingUserData.password);
    await deleteUserViaUI(page);

  });

  test('既に存在するメールアドレスの場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: メールアドレス重複時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // --- 事前準備: 重複確認用のユーザーをUI経由で登録 ---
    const existingUserData = generateRandomCredentials();
    await registerUserViaUI(page, existingUserData);
    // 登録後に /login にいるので、再度登録ページへ移動
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    await page.getByTestId('header-register-link').click();
    await page.waitForFunction(checkCurrentPath, '/register', { timeout: 10000 });

    // --- 重複テスト実行 ---
    const newUserData = generateRandomCredentials(); // 重複テスト用の新しいユーザー情報

    // フォームにデータを入力
    await page.locator('[data-testid="nickname-input"]').type(newUserData.nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(newUserData.accountId, { delay: 0 });
    // メールアドレス入力フィールドに、事前に作成した重複するメールアドレスを入力
    await page.locator('[data-testid="email-input"]').type(existingUserData.email, { delay: 0 }); // ★ ここで重複させる
    await page.locator('[data-testid="password-input"]').type(newUserData.password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(newUserData.password, { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: メールアドレスのエラーメッセージが表示され、期待されるテキストを持つことを非同期で確認
    const selector = '[data-testid="email-error"]';
    const expectedText = 'このメールアドレスは既に使用されています。';
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 15000 }); // タイムアウト短縮
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });

    // 他のエラーメッセージや成功メッセージが表示されていないことを非同期で確認
    const otherErrorSelectors = [
      '[data-testid="account-id-error"]',
      '[data-testid="registration-error"]',
      '[data-testid="registration-success-message"]'
    ];
    for (const sel of otherErrorSelectors) {
      await page.waitForFunction((arg) => {
          const { selectorToCheck } = arg;
          return document.querySelector(selectorToCheck) === null;
      }, { selectorToCheck: sel }, { timeout: 1000 });
    }

    // --- クリーンナップ: 事前準備で作成したユーザーを削除 ---
    // ログアウト状態かもしれないので、一度ホームに戻ってからログイン・削除
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    await loginUserViaUI(page, existingUserData.email, existingUserData.password);
    await deleteUserViaUI(page);
  });

  // パスワードが一致しない場合にエラーメッセージが表示されることをテスト
  test('パスワードが一致しない場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: パスワード不一致時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    const userData = generateRandomCredentials();

    await page.locator('[data-testid="nickname-input"]').type(userData.nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(userData.accountId, { delay: 0 });
    await page.locator('[data-testid="email-input"]').type(userData.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(userData.password, { delay: 0 });
    // 異なるパスワードを入力
    await page.locator('[data-testid="password-confirm-input"]').type('differentPassword', { delay: 0 });

    await page.locator('[data-testid="register-button"]').click();

    const selector = '[data-testid="password-confirm-error"]';
    const expectedText = 'パスワードが一致しません。';
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: selector, expectedText: expectedText }, { timeout: 5000 }); // タイムアウト短縮
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
    // クリーンナップ不要
  });

  // アカウントIDの形式が不正な場合にエラーメッセージが表示されることをテスト
  test('アカウントIDの形式が不正な場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: アカウントID形式不正時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    const userData = generateRandomCredentials();
    const invalidAccountId = 'invalid-account!'; // 不正な文字を含むID

    await page.locator('[data-testid="nickname-input"]').type(userData.nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(invalidAccountId, { delay: 0 });
    await page.locator('[data-testid="email-input"]').type(userData.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(userData.password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(userData.password, { delay: 0 });

    await page.locator('[data-testid="register-button"]').click();

    const selector = '[data-testid="account-id-error"]';
    // バリデーションルールがクライアントサイドに実装されたことを想定したメッセージ
    const expectedText = 'アカウントIDは半角英数字とアンダースコア(_)のみ使用できます。';
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      // 完全一致ではなく、部分一致でチェック（メッセージが変更される可能性を考慮）
      return element && element.textContent?.includes('半角英数字とアンダースコア');
    }, { sel: selector, expectedText: expectedText /* waitForFunction内では未使用だが引数として渡す */ }, { timeout: 5000 }); // タイムアウト短縮
    // expect では完全一致を確認
    await expect(page.locator(selector)).toHaveText(expectedText, { timeout: 1000 });
    // クリーンナップ不要
  });

  // テストケース: 無効な形式のメールアドレスを入力した場合のエラー表示
  test('メールアドレスが無効な形式の場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: 無効メールアドレス形式時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // Arrange: 無効なメールアドレス (例: @がない) を入力
    await page.locator('[data-testid="email-input"]').type('invalid-email-format', { delay: 0 });
    // 他の必須フィールドは有効な値で埋める
    await page.locator('[data-testid="nickname-input"]').type('メール形式テスト', { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(`valid_acc_${Date.now()}`, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type('password123', { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type('password123', { delay: 0 });

    // Act: 登録ボタンをクリックして送信時のバリデーションをトリガー
    await page.locator('[data-testid="register-button"]').click();

    // Assert: メールアドレスのエラーメッセージが表示されることを確認
    const errorSelector = '[data-testid="email-error"]';
    const expectedErrorText = '有効なメールアドレスを入力してください。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
      const { sel, expectedText } = arg;
      const element = document.querySelector(sel);
      return element && element.textContent === expectedText;
    }, { sel: errorSelector, expectedText: expectedErrorText }, { timeout: 5000 }); // タイムアウト短縮
    await expect(page.locator(errorSelector)).toHaveText(expectedErrorText, { timeout: 1000 });
    // クリーンナップ不要
  });

  // テストケース: パスワードが短すぎる場合エラーメッセージが表示されること
  test('パスワードが短すぎる場合エラーメッセージが表示されること', async ({ page }) => { // 異常系: 短すぎるパスワード時のエラー表示テスト
    // ブラウザコンソールログを出力 (仕様に準拠して有効化)
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // Arrange: 短いパスワード (例: '123') を入力
    await page.locator('[data-testid="password-input"]').type('123', { delay: 0 });
    await page.locator('[data-testid="nickname-input"]').type('パスワード長テスト', { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(`valid_acc_${Date.now()}`, { delay: 0 });
    await page.locator('[data-testid="email-input"]').type(`valid_${Date.now()}@example.com`, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type('123', { delay: 0 });

    // Act: 登録ボタンをクリックして送信時のバリデーションをトリガー
    await page.locator('[data-testid="register-button"]').click();

    // Assert: パスワードのエラーメッセージが表示されることを確認
    const errorSelector = '[data-testid="password-error"]';
    const expectedErrorText = 'パスワードは6文字以上である必要があります。';
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
        const { sel, expectedText } = arg;
        const element = document.querySelector(sel);
        return element && element.textContent === expectedText;
    }, { sel: errorSelector, expectedText: expectedErrorText }, { timeout: 5000 }); // タイムアウト短縮
    await expect(page.locator(errorSelector)).toHaveText(expectedErrorText, { timeout: 1000 });
    // クリーンナップ不要
  });

  // --- 削除された「サーバーエラー」テストケースを復元 ---
  test('サーバーエラー時にエラーメッセージが表示されること', async ({ page, context }) => { // ★ context を追加
    page.on('console', msg => console.log(`BROWSER LOG (${test.info().title} - ${msg.type()}): ${msg.text()}`));

    // Arrange: ネットワークリクエストをインターセプトして、登録API呼び出しを失敗させる設定
    const functionUrl = 'https://qwsbdmkvozkfpznfzjay.supabase.co/functions/v1/register-user'; // ★ Edge Function URL をテストケース内に定義
    const mockErrorText = 'サーバー内部で予期せぬエラーが発生しました。'; // 擬似エラーメッセージ
    await context.route(functionUrl, route => {
      console.log(`Intercepted request to ${functionUrl}, fulfilling with 500 error.`); // インターセプトログ
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: mockErrorText,
          errorCode: 'server_error'
        })
      });
    });

    // Arrange: 有効な登録情報を入力
    const userData = generateRandomCredentials();
    await page.locator('[data-testid="nickname-input"]').type(userData.nickname, { delay: 0 });
    await page.locator('[data-testid="account-id-input"]').type(userData.accountId, { delay: 0 });
    await page.locator('[data-testid="email-input"]').type(userData.email, { delay: 0 });
    await page.locator('[data-testid="password-input"]').type(userData.password, { delay: 0 });
    await page.locator('[data-testid="password-confirm-input"]').type(userData.password, { delay: 0 });

    // Act: 登録ボタンをクリック
    await page.locator('[data-testid="register-button"]').click();

    // Assert: フォーム全体のエラーメッセージ (registration-error) が表示されることを確認
    const errorSelector = '[data-testid="registration-error"]';
    const expectedErrorText = mockErrorText; // route.fulfill で設定したエラーメッセージ
    // waitForFunction で要素が存在し、期待するテキストを持つことを待機
    await page.waitForFunction((arg) => {
        const { sel, expectedText } = arg;
        const element = document.querySelector(sel);
        return element && element.textContent === expectedText;
    }, { sel: errorSelector, expectedText: expectedErrorText }, { timeout: 5000 }); // タイムアウト短縮
    await expect(page.locator(errorSelector)).toHaveText(expectedErrorText, { timeout: 1000 });
    // このテストではユーザー登録自体は成功しないため、クリーンナップは不要
  });

}); // describe 終了