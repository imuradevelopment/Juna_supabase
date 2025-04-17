import { test, expect } from '@playwright/test';
import type { Page, ConsoleMessage } from '@playwright/test';
// import type { UserCredentials } from '~/types'; // 必要に応じて型定義をインポート

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
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  await page.locator('[data-testid="nickname-input"]').type(user.nickname, { delay: 0 });
  await page.locator('[data-testid="account-id-input"]').type(user.accountId, { delay: 0 });
  await page.locator('[data-testid="email-input"]').type(user.email, { delay: 0 });
  await page.locator('[data-testid="password-input"]').type(user.password, { delay: 0 });
  await page.locator('[data-testid="password-confirm-input"]').type(user.password, { delay: 0 });

  await page.getByRole('button', { name: '登録する' }).click();

  await page.waitForURL('**/login', { timeout: 5000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

// ヘルパー関数: 登録済みのテストユーザーでログインする。
// @param page Playwright の Page オブジェクト
// @param user ログインするユーザー情報
async function loginTestUser(page: Page, user: Pick<ReturnType<typeof createTestUser>, 'email' | 'password'>) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

  await page.locator('input[data-testid="identifier-input"]').type(user.email, { delay: 0 });
  await page.locator('input[data-testid="password-input"]').type(user.password, { delay: 0 });

  await page.getByRole('button', { name: 'ログイン' }).click();

  await page.waitForURL('/', { timeout: 5000 });

  await page.waitForFunction(() => {
    const profileLink = document.querySelector('a[data-testid="header-profile-link"]');
    return profileLink && profileLink.checkVisibility();
  }, null, { timeout: 15000 });

  await expect(page).toHaveURL('/', { timeout: 5000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

// ヘルパー関数: ログアウトする
// @param page Playwright の Page オブジェクト
async function logoutUser(page: Page) {
  await page.getByRole('button', { name: 'ログアウト' }).click();
  await page.waitForURL('**/login', { timeout: 10000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
}

test.describe('プロフィール表示・編集', () => {
  test('ニックネーム空欄での保存失敗とエラー表示の確認', async ({ page }) => {
    const user = createTestUser();
    // console.log(`[Test Abnormal] User: ${user.email}`); // デバッグ用ログ削除

    await registerTestUserViaUI(page, user);
    await loginTestUser(page, { email: user.email, password: user.password });

    await page.waitForFunction(() => {
      const profileLink = document.querySelector('a[data-testid="header-profile-link"]');
      return profileLink && profileLink.checkVisibility();
    }, null, { timeout: 15000 });

    await page.getByRole('link', { name: 'プロフィール' }).click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
    await page.getByRole('link', { name: '編集' }).click();
    await page.waitForURL('**/profile/edit', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    await page.locator('[data-testid="profile-edit-nickname"]').fill('');

    await page.getByRole('button', { name: '保存' }).click();

    await expect(page).toHaveURL(/.*\/profile\/edit/, { timeout: 5000 });

    const errorLocator = page.locator('[data-testid="profile-edit-nickname-error"]');
    await page.waitForFunction((args) => {
      const { selector, expectedText } = args;
      const element = document.querySelector(selector);
      return element && element.textContent && element.textContent.trim() === expectedText;
    }, { selector: '[data-testid="profile-edit-nickname-error"]', expectedText: 'ニックネームは必須です。' }, { timeout: 5000 });
    await expect(errorLocator).toBeVisible({ timeout: 1000 });
    await expect(errorLocator).toHaveText('ニックネームは必須です。', { timeout: 1000 });

    const nicknameInputLocator = page.locator('[data-testid="profile-edit-nickname"]');
    await page.waitForFunction((args) => {
      const { selector, className } = args;
      const element = document.querySelector(selector);
      return element && element.classList.contains(className);
    }, { selector: '[data-testid="profile-edit-nickname"]', className: 'border-error-500' }, { timeout: 5000 });
    await expect(nicknameInputLocator).toHaveClass(/border-error-500/, { timeout: 1000 });

    await logoutUser(page);
    // テストで使用したユーザーデータの削除が必要であることを警告 (手動または別プロセスで削除)
    console.warn(`[Test Abnormal] テストユーザー (${user.email}) の削除が必要です。`);
  });

  test('プロフィール初期表示、編集、更新、永続化の確認', async ({ page }) => {
    const user = createTestUser();
    // console.log(`[Test Normal] User: ${user.email}`); // デバッグ用ログ削除

    await registerTestUserViaUI(page, user);
    await loginTestUser(page, { email: user.email, password: user.password });

    await page.waitForFunction(() => {
      const profileLink = document.querySelector('a[data-testid="header-profile-link"]');
      return profileLink && profileLink.checkVisibility();
    }, null, { timeout: 15000 });

    await page.getByRole('link', { name: 'プロフィール' }).click();
    await page.waitForURL('**/profile', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    await page.locator('[data-testid="profile-details"]').waitFor({ state: 'visible', timeout: 15000 });

    const nicknameLocator = page.locator('[data-testid="profile-nickname"]');
    await page.waitForFunction((args) => {
      const { selector, expectedNickname } = args;
      const element = document.querySelector(selector);
      return element && element.textContent?.trim() === expectedNickname;
    }, { selector: '[data-testid="profile-nickname"]', expectedNickname: user.nickname }, { timeout: 10000 });
    await expect(nicknameLocator).toHaveText(user.nickname, { timeout: 1000 });

    const bioLocator = page.locator('[data-testid="profile-bio"]');
    await page.waitForFunction((args) => {
      const { selector, expectedBio } = args;
      const element = document.querySelector(selector);
      return element && element.textContent?.trim() === expectedBio;
    }, { selector: '[data-testid="profile-bio"]', expectedBio: '自己紹介がありません' }, { timeout: 10000 });
    await expect(bioLocator).toHaveText('自己紹介がありません', { timeout: 1000 });

    await page.getByRole('link', { name: '編集' }).click();
    await page.waitForURL('**/profile/edit', { timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    const nicknameEditLocator = page.locator('[data-testid="profile-edit-nickname"]');
    const bioEditLocator = page.locator('[data-testid="profile-edit-bio"]');
    const accountIdLocator = page.locator('[data-testid="profile-edit-account-id"]');

    await page.waitForFunction((args) => {
      const { selector, expectedNickname } = args;
      const input = document.querySelector(selector) as HTMLInputElement;
      return input && input.value === expectedNickname;
    }, { selector: '[data-testid="profile-edit-nickname"]', expectedNickname: user.nickname }, { timeout: 5000 });
    await expect(nicknameEditLocator).toHaveValue(user.nickname, { timeout: 1000 });

    await page.waitForFunction((args) => {
      const { selector, expectedBio } = args;
      const input = document.querySelector(selector) as HTMLInputElement;
      return input && input.value === expectedBio;
    }, { selector: '[data-testid="profile-edit-bio"]', expectedBio: '' }, { timeout: 5000 });
    await expect(bioEditLocator).toHaveValue('', { timeout: 1000 });

    await page.waitForFunction((selector) => {
      const element = document.querySelector(selector) as HTMLInputElement;
      return element && element.disabled;
    }, '[data-testid="profile-edit-account-id"]', { timeout: 5000 });
    await expect(accountIdLocator).toBeDisabled({ timeout: 1000 });

    await nicknameEditLocator.fill(user.updatedNickname);
    await bioEditLocator.fill(user.updatedBio);
    await page.getByRole('button', { name: '保存する' }).click();

    await page.waitForURL('**/profile', { timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });

    await page.locator('[data-testid="profile-details"]').waitFor({ state: 'visible', timeout: 15000 });

    const reloadedNicknameLocator = page.locator('[data-testid="profile-nickname"]');
    await page.waitForFunction((args) => {
      const { selector, updatedNickname } = args;
      const element = document.querySelector(selector);
      return element && element.textContent?.trim() === updatedNickname;
    }, { selector: '[data-testid="profile-nickname"]', updatedNickname: user.updatedNickname }, { timeout: 15000 });
    await expect(reloadedNicknameLocator).toHaveText(user.updatedNickname, { timeout: 1000 });

    const reloadedBioLocator = page.locator('[data-testid="profile-bio"]');
    await page.waitForFunction((args) => {
      const { selector, updatedBio } = args;
      const element = document.querySelector(selector);
      return element && element.textContent?.trim() === updatedBio;
    }, { selector: '[data-testid="profile-bio"]', updatedBio: user.updatedBio }, { timeout: 15000 });
    await expect(reloadedBioLocator).toHaveText(user.updatedBio, { timeout: 1000 });

    await logoutUser(page);
  });
}); 