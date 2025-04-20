import { test, expect } from '@playwright/test';
import type { Page, ConsoleMessage } from '@playwright/test';
// import type { UserCredentials } from '~/types'; // 必要に応じて型定義をインポート

// 補助関数: 特定のパスになっているか確認する waitForFunction 用関数
const checkPath = (targetPath: string): boolean => window.location.pathname === targetPath;
// 補助関数: 要素が表示されているか確認する waitForFunction 用関数
const isVisible = (selector: string): boolean => {
  const element = document.querySelector(selector);
  return !!element && element.checkVisibility(); // checkVisibility() を使用
};
// 補助関数: data-testid を持つ要素が表示されているか確認する waitForFunction 用関数
const isTestIdVisible = (testId: string): boolean => {
    const element = document.querySelector(`[data-testid="${testId}"]`);
    return !!element && element.checkVisibility();
};


// ヘルパー関数: ユニークなテストユーザー情報を生成
const createTestUser = () => ({
  email: `test-profile-${Date.now()}@example.com`,
  password: 'password123',
  nickname: `TestProfile${Date.now()}`,
  accountId: `test_account_${Date.now()}`,
  updatedNickname: `UpdatedProfile${Date.now()+1}`,
  bio: 'This is my initial bio.',
  updatedBio: 'This is my updated bio.',
});

// ヘルパー関数: UI操作を通じてテストユーザーを新規登録する。
// @param page Playwright の Page オブジェクト
// @param user 登録するユーザー情報
async function registerTestUserViaUI(page: Page, user: ReturnType<typeof createTestUser>) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  // 修正: getByTestId を使用
  await page.getByTestId('header-register-link').click();
  // 修正: waitForFunction でパスを確認 -> waitForURL に変更
  await page.waitForURL('**/register', { timeout: 10000 }); // タイムアウトも少し延長
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  // 修正: getByTestId を使用
  await page.getByTestId('nickname-input').type(user.nickname, { delay: 0 });
  await page.getByTestId('account-id-input').type(user.accountId, { delay: 0 });
  await page.getByTestId('email-input').type(user.email, { delay: 0 });
  await page.getByTestId('password-input').type(user.password, { delay: 0 });
  await page.getByTestId('password-confirm-input').type(user.password, { delay: 0 });

  // 修正: getByTestId を使用
  await page.getByTestId('register-button').click();

  // 修正: waitForFunction でパスを確認 -> waitForURL に変更
  await page.waitForURL('**/login', { timeout: 10000 }); // タイムアウトも少し延長
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

// ヘルパー関数: 登録済みのテストユーザーでログインする。
// @param page Playwright の Page オブジェクト
// @param user ログインするユーザー情報
async function loginTestUser(page: Page, user: Pick<ReturnType<typeof createTestUser>, 'email' | 'password'>) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  // 修正: getByTestId を使用
  await page.getByTestId('header-login-link').click();
  // 修正: waitForFunction でパスを確認 -> waitForURL に変更
  await page.waitForURL('**/login', { timeout: 10000 }); // タイムアウトも少し延長
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  // 修正: getByTestId を使用
  await page.getByTestId('identifier-input').type(user.email, { delay: 0 });
  await page.getByTestId('password-input').type(user.password, { delay: 0 });

  // 修正: getByTestId を使用
  await page.getByTestId('login-button').click();

  // 修正: waitForFunction でパスを確認 -> waitForURL に変更
  await page.waitForURL('**/', { timeout: 10000 }); // タイムアウトも少し延長

  // 修正: getByTestId を使用して visibility を確認
  await page.waitForFunction(isTestIdVisible, 'header-profile-link', { timeout: 15000 });

  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

// ヘルパー関数: ログアウトする
// @param page Playwright の Page オブジェクト
async function logoutUser(page: Page) {
  const logoutButtonTestId = 'header-logout-button';
  // 修正: page.click と getByTestId を使用
  await page.click(`[data-testid="${logoutButtonTestId}"]`, { timeout: 15000 }); // セレクタ形式は維持

  // 修正: waitForFunction でパスを確認 -> waitForURL に変更
  await page.waitForURL('**/login', { timeout: 15000 }); // タイムアウトも少し延長
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

/**
 * ユーザー削除処理 (UI操作) - delete.spec.ts からコピー
 */
const deleteUserViaUI = async (page: Page): Promise<void> => {
  // ログイン状態であることを前提とする

  // プロフィール編集ページにいるか確認、いなければ遷移
  if (!page.url().endsWith('/profile/edit')) {
    // ヘッダーのプロフィールリンクが表示されるまで待機
    await page.waitForFunction(isTestIdVisible, 'header-profile-link', { timeout: 10000 });
    await page.getByTestId('header-profile-link').click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
    await page.waitForFunction(isTestIdVisible, 'profile-edit-link', { timeout: 5000 });
    await page.getByTestId('profile-edit-link').click();
    await page.waitForURL('**/profile/edit', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
  }

  // 削除ボタンが表示されるのを待つ
  await page.waitForFunction(isTestIdVisible, 'delete-account-button', { timeout: 15000 });

  // ダイアログを承認するリスナーを一度だけ設定
  page.once('dialog', async dialog => {
    console.log(`[deleteUserViaUI] Dialog message: ${dialog.message()}`); // デバッグ用にメッセージを出力
    await dialog.accept();
  });

  // 削除ボタンをクリック
  await page.getByTestId('delete-account-button').click();

  // ホームページにリダイレクトされるのを待つ (削除処理完了待ち)
  await page.waitForURL('**/', { timeout: 15000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  // ログインリンクが表示されるかで削除完了を確認
  await page.waitForFunction(isTestIdVisible, 'header-login-link', { timeout: 10000 });
};

test.describe('プロフィール表示・編集', () => {
  test('ニックネーム空欄での保存失敗とエラー表示の確認', async ({ page }) => {
    // Add console logging
    page.on('console', msg => {
      console.log(`[Browser Console][${msg.type()}] ${msg.text()}`);
    });

    const user = createTestUser();

    await registerTestUserViaUI(page, user);
    await loginTestUser(page, { email: user.email, password: user.password });

    // 修正: getByTestId を使用して visibility を確認
    await page.waitForFunction(isTestIdVisible, 'header-profile-link', { timeout: 15000 });

    // 修正: getByTestId を使用
    await page.getByTestId('header-profile-link').click();
    // 修正: waitForFunction でパスを確認 -> waitForURL に変更
    await page.waitForURL('**/profile', { timeout: 15000 }); // タイムアウトも少し延長
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
    // 修正: getByTestId を使用
    await page.getByTestId('profile-edit-link').click();
    // 修正: waitForFunction でパスを確認 -> waitForURL に変更
    await page.waitForURL('**/profile/edit', { timeout: 15000 }); // タイムアウトも少し延長
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    // ニックネームを空にする
    // 修正: getByTestId を使用
    const nicknameInput = page.getByTestId('profile-edit-nickname');
    // 修正: waitForFunction で可視性を確認
    await page.waitForFunction(isTestIdVisible, 'profile-edit-nickname', { timeout: 5000 });
    // 修正: fill に変更 (typeでも良いが、空にする意図を明確化)
    await nicknameInput.fill('');
    // 保存ボタンをクリック (修正: getByTestId を使用)
    await page.getByTestId('profile-edit-save-button').click();
    // エラーメッセージが表示されることを確認 (修正: getByTestId を使用)
    const nicknameError = page.getByTestId('profile-edit-nickname-error');
    // 修正: 2段階検証
    await page.waitForFunction(isTestIdVisible, 'profile-edit-nickname-error', { timeout: 5000 });
    await expect(nicknameError).toHaveText('ニックネームは必須です。', { timeout: 5000 });

    await deleteUserViaUI(page);
  });

  test('プロフィール初期表示、編集、更新、永続化の確認', async ({ page }) => {
    page.on('console', msg => {
      console.log(`[Browser Console][${msg.type()}] ${msg.text()}`);
    });

    const user = createTestUser();

    await registerTestUserViaUI(page, user);
    await loginTestUser(page, { email: user.email, password: user.password });

    // 修正: getByTestId を使用して visibility を確認
    await page.waitForFunction(isTestIdVisible, 'header-profile-link', { timeout: 15000 });

    // 修正: getByTestId を使用
    await page.getByTestId('header-profile-link').click();
    // 修正: waitForFunction でパスを確認 -> waitForURL に変更
    await page.waitForURL('**/profile', { timeout: 15000 }); // タイムアウトも少し延長
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    // 修正: waitForFunction で可視性を確認
    await page.waitForFunction(isTestIdVisible, 'profile-details', { timeout: 15000 });

    // 修正: getByTestId を使用し、2段階検証
    const nicknameLocator = page.getByTestId('profile-nickname');
    await page.waitForFunction(isTestIdVisible, 'profile-nickname', { timeout: 10000 });
    await expect(nicknameLocator).toHaveText(user.nickname, { timeout: 1000 });

    // 修正: getByTestId を使用し、2段階検証
    const bioLocator = page.getByTestId('profile-bio');
    await page.waitForFunction(isTestIdVisible, 'profile-bio', { timeout: 10000 });
    await expect(bioLocator).toHaveText('自己紹介がありません', { timeout: 1000 });

    // 修正: getByTestId を使用
    await page.getByTestId('profile-edit-link').click();
    // 修正: waitForFunction でパスを確認 -> waitForURL に変更
    await page.waitForURL('**/profile/edit', { timeout: 15000 }); // タイムアウトも少し延長
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    // 修正: getByTestId を使用
    const nicknameEditLocator = page.getByTestId('profile-edit-nickname');
    const bioEditLocator = page.getByTestId('profile-edit-bio');
    const accountIdLocator = page.getByTestId('profile-edit-account-id');

    // 修正: 2段階検証
    await page.waitForFunction(isTestIdVisible, 'profile-edit-nickname', { timeout: 10000 });
    await expect(nicknameEditLocator).toHaveValue(user.nickname, { timeout: 15000 });

    // 修正: 2段階検証
    await page.waitForFunction(isTestIdVisible, 'profile-edit-bio', { timeout: 5000 });
    await expect(bioEditLocator).toHaveValue('', { timeout: 10000 });

    // 修正: waitForFunction で disabled 属性を確認
    await page.waitForFunction((testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        return element && element.checkVisibility() && element.hasAttribute('disabled');
    }, 'profile-edit-account-id', { timeout: 5000 });

    // 修正: fill に変更
    await nicknameEditLocator.fill(user.updatedNickname);
    await bioEditLocator.fill(user.updatedBio);
    // 修正: getByTestId を使用
    await page.getByTestId('profile-edit-save-button').click();

    // 修正: waitForFunction でパスを確認 (networkidle は削除) -> waitForURL に変更
    await page.waitForURL('**/profile', { timeout: 15000 });
    // await page.waitForURL('**/profile', { timeout: 15000, waitUntil: 'networkidle' }); // 削除

    // 修正: waitForFunction で可視性を確認
    await page.waitForFunction(isTestIdVisible, 'profile-details', { timeout: 15000 });

    // 修正: getByTestId を使用し、2段階検証
    const reloadedNicknameLocator = page.getByTestId('profile-nickname');
    await page.waitForFunction(isTestIdVisible, 'profile-nickname', { timeout: 10000 });
    await expect(reloadedNicknameLocator).toHaveText(user.updatedNickname, { timeout: 15000 });

    // 修正: getByTestId を使用し、2段階検証
    const reloadedBioLocator = page.getByTestId('profile-bio');
    await page.waitForFunction(isTestIdVisible, 'profile-bio', { timeout: 10000 });
    await expect(reloadedBioLocator).toHaveText(user.updatedBio, { timeout: 15000 });

    await deleteUserViaUI(page);
  });
}); 