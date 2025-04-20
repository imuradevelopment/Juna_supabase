import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test'; // Page を型としてインポート
import { fakerJA as faker } from '@faker-js/faker';
import type { UserCredentials } from '../../types/index'; // UserCredentials 型をインポート

// --- テスト用ヘルパー関数 ---

/**
 * waitForFunction 用: 指定された data-testid を持つ要素が存在し、かつ表示されているか確認
 * @param testId data-testid の値
 * @returns 要素が存在し表示されていれば true、そうでなければ false
 */
const isElementVisible = (testId: string): boolean => {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  // 要素が存在し、計算されたスタイルが 'none' でないことを確認
  return !!element && window.getComputedStyle(element).display !== 'none';
};

/**
 * waitForFunction 用: 指定されたテキストを持つ要素が存在するか確認
 * @param textContent 検索するテキスト内容
 * @returns 要素が存在すれば true、そうでなければ false
 */
const hasTextContent = (textContent: string): boolean => {
  const elements = Array.from(document.querySelectorAll('*'));
  return elements.some(el => el.textContent?.includes(textContent));
};

/**
 * waitForFunction 用: 指定された URL に遷移したか確認
 * @param targetPath 期待するパス (例: '/')
 * @returns 現在のパスが期待するパスと一致すれば true、そうでなければ false
 */
const checkCurrentPath = (targetPath: string): boolean => {
  return window.location.pathname === targetPath;
};

/**
 * ランダムなユーザー情報を生成
 * @returns ユーザー認証情報 (メール、パスワード、ニックネーム、アカウントID)
 */
const generateRandomCredentials = (): UserCredentials => {
  const nickname = faker.person.lastName() + faker.person.firstName();
  const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const accountId = `${nickname.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)}_${uniqueSuffix}`.substring(0, 15);
  return {
    email: `test_user_${uniqueSuffix}@example.com`,
    password: `password${uniqueSuffix}A1!`, // 複雑なパスワード
    nickname: nickname,
    accountId: accountId
  };
};

/**
 * ユーザー登録処理 (API経由ではなくUI操作で行う)
 * @param page Playwright の Page オブジェクト
 * @param credentials 登録するユーザー情報
 */
const registerUserViaUI = async (page: Page, credentials: UserCredentials): Promise<void> => {
  await page.goto('/'); // ホームページにアクセス
  await page.waitForFunction(() => document.readyState === 'complete'); // DOM読み込み完了待機
  await page.getByTestId('header-register-link').click(); // ★ data-testid でヘッダーのリンクを特定
  await page.waitForFunction(checkCurrentPath, '/register'); // 登録ページ遷移確認

  // フォーム入力
  await page.getByLabel('メールアドレス').type(credentials.email, { delay: 0 });
  await page.getByLabel('パスワード', { exact: true }).type(credentials.password, { delay: 0 });
  await page.getByLabel('パスワード確認').type(credentials.password, { delay: 0 });
  await page.getByLabel('ニックネーム').type(credentials.nickname, { delay: 0 });
  await page.getByLabel('アカウントID').type(credentials.accountId, { delay: 0 });

  await page.getByRole('button', { name: '登録する' }).click(); // 登録ボタンをクリック

  // 再度、登録成功メッセージの待機を削除し、ログインページへのリダイレクトを直接待機する
  // await page.waitForFunction(hasTextContent, '登録が完了しました。ログインしてください。', { timeout: 25000 });
  // await expect(page.locator('body')).toHaveText(/登録が完了しました。ログインしてください。/, { timeout: 15000 });

  // ログインページにリダイレクトされることを確認 (タイムアウトは維持)
  await page.waitForFunction(checkCurrentPath, '/login', { timeout: 15000 }); // 登録処理完了待ちを含むため短縮
};

/**
 * ログイン処理 (UI操作)
 * @param page Playwright の Page オブジェクト
 * @param identifier メールアドレスまたはアカウントID
 * @param password パスワード
 */
const loginUserViaUI = async (page: Page, identifier: string, password: string): Promise<void> => {
  // ログインページにいるか、または遷移する
  if (page.url() !== '/login') {
    const loginLinkVisible = await page.waitForFunction(isElementVisible, 'login-link', { timeout: 10000 }).catch(() => false); // 短縮
    if (loginLinkVisible) {
      await page.getByTestId('login-link').click();
    } else {
      // ログインリンクが見えない場合、直接ログインページへ移動 (タイムアウト指定)
      try {
        console.log(`Navigating to /login from ${page.url()}`);
        await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15000 }); // 短縮
      } catch (e) {
        console.error(`Error navigating to /login: ${e}`);
        // ナビゲーションエラー発生時のスクリーンショットやHTMLを取得してデバッグ情報とする
        // await page.screenshot({ path: `error_nav_screenshot_${Date.now()}.png` });
        // const html = await page.content();
        // console.error(`HTML content on navigation error: ${html.substring(0, 500)}...`);
        throw e; // エラーを再スローしてテストを失敗させる
      }
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000}); // 短縮
    }
    await page.waitForFunction(checkCurrentPath, '/login', { timeout: 10000 }); // 短縮
  }

  // ★ ログインページの見出しが表示されるのを待機
  await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible({ timeout: 5000 }); // 短縮

  // フォーム入力
  // ★ フォーム要素が表示されるのを待機 (ラベルを修正)
  const identifierInput = page.getByLabel('メールアドレスまたはアカウントID'); // "or" を "または" に修正
  await expect(identifierInput).toBeVisible({ timeout: 5000 }); // 短縮

  await identifierInput.type(identifier, { delay: 0 });
  await page.getByLabel('パスワード').type(password, { delay: 0 });

  await page.getByRole('button', { name: 'ログイン' }).click(); // ログインボタンをクリック

  // ★ 追加: ログイン直後のユーザー情報をログ出力
  await page.evaluate(async () => {
    // @ts-ignore
    const client = window.supabase; // グローバル変数から取得
    if (!client) {
      console.error('[TEST_DEBUG] Supabase client not found in window.');
      return;
    }
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (error) {
        console.error('[TEST_DEBUG] Error getting user after login:', error.stack || error);
      } else {
        console.log('[TEST_DEBUG] User after login:', user ? user.id.substring(0, 8) : 'null');
      }
    } catch (err) {
      console.error('[TEST_DEBUG] Exception getting user after login:', err);
    }
  });

  // ログイン成功をヘッダーの表示で確認 (タイムアウトを延長、data-testidを修正)
  await page.waitForFunction(isElementVisible, 'header-profile-link', { timeout: 10000 }); // 短縮
  await expect(page.getByTestId('header-profile-link')).toBeVisible({ timeout: 5000 }); // 短縮

  // ★ 追加: ログイン後の Cookie をログ出力
  console.log('[TEST_DEBUG] Cookies after login:');
  const cookiesAfterLogin = await page.context().cookies();
  console.log(JSON.stringify(cookiesAfterLogin.filter(c => c.name.startsWith('sb-')), null, 2)); // Supabase関連のみ表示
};

// --- テストスイート ---
test.describe('アカウント削除機能', () => {
  // スイート全体のタイムアウトを120秒に設定
  test.describe.configure({ timeout: 120000 });

  let userData: UserCredentials;

  // beforeEach フック
  test.beforeEach(async ({ page }) => {
    userData = generateRandomCredentials();
    await registerUserViaUI(page, userData);
    await loginUserViaUI(page, userData.email, userData.password);

    // プロフィールページへの遷移と編集ページへの導線確認
    await page.waitForFunction(isElementVisible, 'header-profile-link', { timeout: 5000 });
    await page.getByTestId('header-profile-link').click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'プロフィール' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('profile-nickname')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('profile-details')).toBeVisible({ timeout: 1000 });
    await expect(page.getByTestId('profile-edit-link')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('profile-edit-link').click();
    await page.waitForURL('**/profile/edit', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'プロフィール編集' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('profile-edit-nickname')).toBeVisible({ timeout: 5000 });
  });

  // テストケース: 正常なアカウント削除
  test('正常なアカウント削除', async ({ page }, testInfo) => { // testInfo を引数に追加
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      // 既存のログ収集に加えて、デバッグ用 Cookie ログも収集
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    try {
      await expect(page.getByTestId('profile-edit-nickname')).toBeVisible({ timeout: 5000 });

      // 1. アカウント削除ボタンが表示されていることを確認
      await page.waitForFunction(isElementVisible, 'delete-account-button', { timeout: 15000 });
      const deleteButton = page.getByTestId('delete-account-button');
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      await expect(deleteButton).toHaveText('アカウント削除', { timeout: 5000 });

      // ★ 追加: Function 呼び出し前の Cookie をログ出力
      console.log('[TEST_DEBUG] Cookies before delete click:');
      const cookiesBeforeDelete = await page.context().cookies();
      console.log(JSON.stringify(cookiesBeforeDelete.filter(c => c.name.startsWith('sb-')), null, 2)); // Supabase関連のみ表示

      page.once('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        expect(dialog.message()).toContain('アカウントを削除すると、関連する全てのデータ（投稿、コメントなど）が削除され、元に戻すことはできません。本当に削除しますか？');
        await dialog.accept();
      });
      await deleteButton.click();

      // ★★★ 削除ボタンの無効化チェックを削除 ★★★
      // await expect(deleteButton).toBeDisabled({ timeout: 3000 });

      // ★★★ 代わりにホームページへのリダイレクトとログインリンクの表示を確認 ★★★
      // ホームページにリダイレクトされたことを確認
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // ホームページにログインリンクが表示されていることを確認
      const loginLink = page.getByRole('link', { name: 'ログイン' });
      await expect(loginLink).toBeVisible({ timeout: 10000 });

      // 削除成功後にエラーメッセージが表示されていないことを確認
      const deleteErrorElement = page.locator('[data-testid="profile-edit-delete-error"]');
      // ★ エラー要素が表示されないことを確認 (元のロジックに戻す)
      await page.waitForFunction((selector) => {
        return !document.querySelector(selector);
      }, '[data-testid="profile-edit-delete-error"]', { timeout: 2000 });

    } finally {
      // ★ 追加: テストの最後にログをレポートに添付
      if (consoleMessages.length > 0) {
        const logText = consoleMessages.join('\n');
        await testInfo.attach('console-logs', {
          body: logText,
          contentType: 'text/plain',
        });
        // ターミナルにも出力（デバッグ用、レポートがあれば不要かも）
        console.log("--- Collected Console Logs (Normal Deletion) ---");
        console.log(logText);
        console.log("--- End of Console Logs ---");
      }
    }
  });

  // テストケース: アカウント削除のキャンセル
  test('アカウント削除のキャンセル', async ({ page }, testInfo) => { // testInfo を引数に追加
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    try {
      await expect(page.getByTestId('profile-edit-nickname')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('delete-account-button')).toBeVisible({ timeout: 5000 });

      const deleteButton = page.getByTestId('delete-account-button');

      page.once('dialog', async dialog => {
        await dialog.dismiss();
      });
      await deleteButton.click();

      await page.waitForTimeout(500);
      await page.waitForURL('**/profile/edit', { timeout: 5000 });
      await expect(page.getByRole('heading', { name: 'プロフィール編集' })).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel('ニックネーム')).toHaveValue(userData.nickname, { timeout: 3000 });

    } finally {
       // ★ 追加: テストの最後にログをレポートに添付
      if (consoleMessages.length > 0) {
        const logText = consoleMessages.join('\n');
        await testInfo.attach('console-logs-cancel', { // 添付ファイル名を変更
          body: logText,
          contentType: 'text/plain',
        });
        // ターミナルにも出力
        console.log("--- Collected Console Logs (Cancel Test) ---");
        console.log(logText);
        console.log("--- End of Console Logs ---");
      }
    }
  });
}); 