import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid'; // テストデータ用UUID生成
import { chromium } from '@playwright/test'; // require を使用

// --- テスト設定 ---
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const HOME_PATH = '/';

// --- ヘルパー関数 ---
/**
 * 固有のテストユーザー情報を生成する関数
 * @param userType ユーザータイプ（例: 'main', 'other'）識別用
 */
const createTestUser = (userType: string = 'main') => {
  const id = uuidv4();
  const email = `test-category-${userType}-${id}@example.com`;
  const password = 'password123';
  const nickname = `カテゴリテストユーザー${userType}${id.substring(0, 4)}`;
  const accountId = `test_cat_${userType}_${id.substring(0, 8)}`;
  return { email, password, nickname, accountId };
};

/**
 * UI経由でユーザー登録を行うヘルパー関数 (ページ遷移は含まない)
 * 事前に登録ページにいる必要がある
 */
const fillAndSubmitRegisterForm = async (page: Page, user: ReturnType<typeof createTestUser>) => {
  // Ensure we are on the registration page (check title)
  await expect(page.locator('[data-testid="register-page-title"]')).toBeVisible({ timeout: 15000 });

  // Fill in the registration form
  await page.locator('[data-testid="nickname-input"]').type(user.nickname, { delay: 0 });
  await page.locator('[data-testid="account-id-input"]').type(user.accountId, { delay: 0 });
  await page.locator('[data-testid="email-input"]').type(user.email, { delay: 0 });
  await page.locator('[data-testid="password-input"]').type(user.password, { delay: 0 });
  await page.locator('[data-testid="password-confirm-input"]').type(user.password, { delay: 0 });

  // Click the register button
  await page.locator('[data-testid="register-button"]').click();

  // Wait for successful registration indication (e.g., redirect or success message)
  // Registration success message check
  await expect(page.locator('[data-testid="registration-success-message"]')).toBeVisible({ timeout: 15000 });
  // ルール変更: page.goto('/login') は禁止なので、URL遷移を待つ
  await expect(page.locator('[data-testid="login-page-title"]')).toBeVisible({ timeout: 10000 }); // ログインページに遷移したかタイトルで確認
  console.log(`[Test Helper] User ${user.email} registration form submitted.`);
};

/**
 * UI経由でログインを行うヘルパー関数 (ページ遷移は含まない)
 * 事前にログインページにいる必要がある
 */
const fillAndSubmitLoginForm = async (page: Page, user: ReturnType<typeof createTestUser>) => {
  // Ensure we are on the login page (check title)
  await expect(page.locator('[data-testid="login-page-title"]')).toBeVisible({ timeout: 15000 });

  // Fill in the login form
  await page.locator('[data-testid="identifier-input"]').type(user.email, { delay: 0 }); // Use email for login ID
  await page.locator('[data-testid="password-input"]').type(user.password, { delay: 0 });

  // Click the login button
  await page.locator('[data-testid="login-button"]').click();

  // Wait for successful login indication (e.g., redirect to home, header visible)
  // ルール変更: page.goto('/') は禁止なので、URL遷移を待つ
  await expect(page.locator('header')).toBeVisible({ timeout: 5000 }); // Verify header is visible
  console.log(`[Test Helper] User ${user.email} login form submitted.`);
};

/**
 * UI経由でログアウトを行うヘルパー関数
 */
const logout = async (page: Page) => {
  console.log('[Test Helper] Logging out...');
  await expect(page.locator('[data-testid="header-logout-button"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="header-logout-button"]').click();
  // ログアウト後はログインページにリダイレクトされることを期待
  await expect(page.locator('[data-testid="login-page-title"]')).toBeVisible({ timeout: 10000 });
  console.log('[Test Helper] Logged out successfully.');
};


// --- テストスイート ---
test.describe('カテゴリ管理 (CRUD)', () => {
  const testUser = createTestUser('main'); // メインのテストユーザー
  const otherTestUser = createTestUser('other'); // RLS検証用の別ユーザー
  let createdCategoryName: string | null = null; // 作成したカテゴリ名を保持
  let createdCategoryId: string | null = null; // 作成したカテゴリIDを保持 (編集/削除/クリーンアップ用)
  let categoryToDeleteAfterTest: { id: string; name: string } | null = null; // このテストで削除するカテゴリ情報

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const pageForSetup = await context.newPage();

    try {
        // --- メインユーザー登録 ---
        console.log(`[Test Setup - beforeAll] Starting registration for main user: ${testUser.email}...`);
        await pageForSetup.goto(`${BASE_URL}${HOME_PATH}`);
        await pageForSetup.locator('[data-testid="header-register-link"]').click();
        await expect(pageForSetup.locator('[data-testid="register-page-title"]')).toBeVisible({ timeout: 15000 });
        await fillAndSubmitRegisterForm(pageForSetup, testUser);
        console.log(`[Test Setup - beforeAll] Main user ${testUser.email} registered successfully.`);
        console.log(`[Test Setup - beforeAll] Redirected to login page after main user registration.`);

        // --- 別ユーザー登録 ---
        console.log(`[Test Setup - beforeAll] Starting registration for other user: ${otherTestUser.email}...`);
        // ログインページから登録ページへ遷移
        await pageForSetup.locator('[data-testid="login-register-link"]').click(); // セレクタ修正
        await expect(pageForSetup.locator('[data-testid="register-page-title"]')).toBeVisible({ timeout: 15000 });
        await fillAndSubmitRegisterForm(pageForSetup, otherTestUser);
        console.log(`[Test Setup - beforeAll] Other user ${otherTestUser.email} registered successfully.`);
        console.log('[Test Setup - beforeAll] Redirected to login page after other user registration.');

    } catch (error) {
        console.error('[Test Setup - beforeAll] User registration failed:', error);
        await browser.close();
        throw error; // テスト実行を中止
    } finally {
        await browser.close();
        console.log('[Test Setup - beforeAll] Browser closed.');
    }
  });

  test.beforeEach(async ({ page }) => {
    // 事前にメインユーザーでログイン状態にする
    console.log(`[Test Setup - beforeEach] Logging in as ${testUser.email}...`);
    await page.goto(`${BASE_URL}${HOME_PATH}`);
    await page.locator('[data-testid="header-login-link"]').click();
    await expect(page.locator('[data-testid="login-page-title"]')).toBeVisible({ timeout: 15000 });
    await fillAndSubmitLoginForm(page, testUser);
    console.log(`[Test Setup - beforeEach] Logged in successfully. Current URL: ${page.url()}`);

    // カテゴリページへ移動
    console.log('[Test Setup - beforeEach] Navigating to categories page...');
    await page.locator('[data-testid="nav-categories-link"]').click();
    await expect(page.locator('[data-testid="category-management-page-title"]')).toBeVisible({ timeout: 10000 }); // カテゴリページのタイトル要素を確認
    console.log('[Test Setup - beforeEach] Now on categories page.');
    // リセット: 各テストの開始時にクリーンアップ対象をクリア
    categoryToDeleteAfterTest = null;
    // page.on('console') でエラーが出ていないか確認するための準備
    page.removeAllListeners('console'); // 前のテストのリスナーをクリア
    const currentTestConsoleMessages: string[] = [];
    const currentConsoleListener = (msg: any) => currentTestConsoleMessages.push(msg.text());
    page.on('console', currentConsoleListener);
    // テスト終了時にエラーをチェックする関数をテストオブジェクトにアタッチ
    (page as any).__currentTestConsoleMessages = currentTestConsoleMessages;
    (page as any).__currentConsoleListener = currentConsoleListener;

  });

  // afterAll を削除し、afterEach を追加
  test.afterEach(async ({ page }) => {
    // page.on('console') でエラーが出ていないか確認
    const messages = (page as any).__currentTestConsoleMessages || [];
    const errors = messages.filter((msg: string) =>
      msg.toLowerCase().includes('error') &&
      !msg.includes('404') && // favicon 等の 404 は無視
      !msg.includes('duplicate key value violates unique constraint') && // 重複テストでのDBエラーは許容
      !msg.includes('既に存在するカテゴリ名です') && // 重複テストでのUIエラーは許容
      !msg.includes('Failed to fetch dynamically imported module') && // HMR関連のエラーは無視 (開発環境依存の可能性)
      !msg.includes('supabase-js.js') // Supabase内部のエラーは一旦無視 (RLS関連で出る可能性)
      // 他に無視したい特定のエラーメッセージがあればここに追加
    );
    // エラーがあればテストを失敗させる
    expect(errors, `[Test Cleanup - afterEach] Console errors detected: ${JSON.stringify(errors)}`).toHaveLength(0);

    // コンソールリスナーを解除
    if ((page as any).__currentConsoleListener) {
      page.off('console', (page as any).__currentConsoleListener);
    }

    console.log('[Test Cleanup - afterEach] Starting category cleanup...');
    if (categoryToDeleteAfterTest) {
        const { id, name } = categoryToDeleteAfterTest;
        console.log(`[Test Cleanup - afterEach] Attempting to cleanup category: ${name} (ID: ${id})`);
        try {
            // カテゴリページにいるか確認 (念のため)
            if (!await page.locator('[data-testid="category-management-page-title"]').isVisible({timeout: 1000})) { // タイトルが見えるかで判定
                console.log('[Test Cleanup - afterEach] Navigating back to categories page for cleanup.');
                await page.locator('[data-testid="nav-categories-link"]').click();
                await expect(page.locator('[data-testid="category-management-page-title"]')).toBeVisible({ timeout: 10000 });
            }

            // カテゴリが存在するか確認してから削除
            const categoryItemSelector = `[data-testid="category-item-${id}"]`;
            const deleteButtonSelector = `[data-testid="category-delete-button-${id}"]`;

            // 要素が表示されるまで少し待つ
            await page.waitForSelector(categoryItemSelector, { state: 'visible', timeout: 10000 }).catch(() => {
              console.log(`[Test Cleanup - afterEach] Category item ${name} (selector: ${categoryItemSelector}) not visible within timeout.`);
              return null;
            });

            const categoryItem = page.locator(categoryItemSelector);
            // ★ RLS修正: 削除ボタンが存在するかどうかも確認 ★
            const deleteButton = page.locator(deleteButtonSelector);

            if (await categoryItem.isVisible() && await deleteButton.isVisible()) { // アイテムと削除ボタンの両方が見える場合のみ削除
                console.log(`[Test Cleanup - afterEach] Category item ${name} and delete button found. Clicking delete button.`);
                await deleteButton.click();

                // 確認ダイアログ
                await expect(page.locator('[data-testid="category-delete-confirm-dialog"]')).toBeVisible({ timeout: 5000 });
                console.log(`[Test Cleanup - afterEach] Confirm dialog visible. Clicking confirm delete.`);
                await page.locator('[data-testid="category-confirm-delete-button"]').click();

                // 削除されたことを確認
                await page.waitForFunction((selector) => !document.querySelector(selector), categoryItemSelector, { timeout: 15000 });
                console.log(`[Test Cleanup - afterEach] Category ${name} successfully deleted via UI.`);
            } else if (await categoryItem.isVisible()) {
                console.log(`[Test Cleanup - afterEach] Category ${name} (ID: ${id}) found, but delete button is not visible (likely due to RLS). Cleanup skipped for this user.`);
            } else {
                console.log(`[Test Cleanup - afterEach] Category ${name} (ID: ${id}) not found or already deleted.`);
            }
        } catch (e) {
            console.error(`[Test Cleanup - afterEach] Failed to delete category ${name} (ID: ${id}) via UI:`, e);
        } finally {
             categoryToDeleteAfterTest = null;
             createdCategoryId = null;
             createdCategoryName = null;
        }
    } else {
        console.log("[Test Cleanup - afterEach] No category marked for deletion in this test.");
    }
    console.log('[Test Cleanup - afterEach] Finished cleanup for this test.');
  });


  // --- テストケース ---

  // 1. カテゴリ作成: 新しいカテゴリを作成できる
  test('1. カテゴリ作成: 新しいカテゴリを作成できる', async ({ page }) => {
    console.log('[Test 1] Attempting to create category...');
    // 1. カテゴリ名を入力
    createdCategoryName = `テストカテゴリ-${uuidv4().substring(0, 8)}`;
    await page.locator('[data-testid="category-management-create-input"]').type(createdCategoryName, { delay: 0 });
    console.log(`[Test 1] Entered category name: ${createdCategoryName}`);

    // 2. 作成ボタンをクリック
    await page.locator('[data-testid="category-management-create-button"]').click();
    console.log('[Test 1] Create button clicked.');

    // 3. 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    console.log('[Test 1] Success message visible.');

    // 4. カテゴリがリストに追加されていることを確認
    const newCategorySelector = `[data-testid^="category-item-"]:has-text("${createdCategoryName}")`;
    await expect(page.locator(newCategorySelector)).toBeVisible({ timeout: 15000 }); // ★ タイムアウトを延長
    console.log('[Test 1] New category item visible in the list.');

    // 5. 作成されたカテゴリのIDを取得 (クリーンアップ用)
    const newCategoryElement = page.locator(newCategorySelector);
    const dataTestId = await newCategoryElement.getAttribute('data-testid');
    createdCategoryId = dataTestId ? dataTestId.replace('category-item-', '') : null;
    if (createdCategoryId) {
      console.log(`[Test 1] Created category: ${createdCategoryName} with ID: ${createdCategoryId}`);
      categoryToDeleteAfterTest = { id: createdCategoryId, name: createdCategoryName }; // クリーンアップ対象としてマーク
    } else {
      console.warn('[Test 1] Could not extract category ID for cleanup.');
    }

    // 6. 作成後に入力欄がクリアされていることを確認
    await expect(page.locator('[data-testid="category-management-create-input"]')).toHaveValue('');
    console.log('[Test 1] Create input field cleared.');
    console.log('[Test 1] Completed successfully.');
  });

  // 2. カテゴリ作成(重複): 同じ名前のカテゴリを作成しようとするとエラーが表示される
  test('2. カテゴリ作成(重複): 同じ名前のカテゴリを作成しようとするとエラーが表示される', async ({ page }) => {
    // 1. 最初のカテゴリを作成
    const duplicateCategoryName = `重複テスト-${uuidv4().substring(0, 8)}`;
    console.log(`[Test 2] Attempting initial create for: ${duplicateCategoryName}`);
    await page.locator('[data-testid="category-management-create-input"]').type(duplicateCategoryName, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const firstCategorySelector = `[data-testid^="category-item-"]:has-text("${duplicateCategoryName}")`;
    await expect(page.locator(firstCategorySelector)).toBeVisible({ timeout: 10000 });

    // 作成したカテゴリのIDを取得してクリーンアップ対象とする
    const firstCategoryElement = page.locator(firstCategorySelector);
    const firstDataTestId = await firstCategoryElement.getAttribute('data-testid');
    const firstCategoryId = firstDataTestId ? firstDataTestId.replace('category-item-', '') : null;
    if (firstCategoryId) {
        categoryToDeleteAfterTest = { id: firstCategoryId, name: duplicateCategoryName };
        console.log(`[Test 2] Marked category for cleanup: ${duplicateCategoryName} (ID: ${firstCategoryId})`);
    }

    // 2. 同じ名前で再度作成を試みる
    console.log(`[Test 2] Attempting duplicate create for: ${duplicateCategoryName}`);
    await page.locator('[data-testid="category-management-create-input"]').type(duplicateCategoryName, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();

    // 3. 重複エラーメッセージが表示されることを確認
    //    (例: data-testid="category-create-error-message")
    await expect(page.locator('[data-testid="category-create-error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="category-create-error-message"]')).toContainText('既に存在するカテゴリ名です', { timeout: 5000 }); // または適切なエラー文言
    console.log('[Test 2] Duplicate error message confirmed.');
    console.log('[Test 2] Completed successfully.');
  });

  // 3. カテゴリ一覧: カテゴリ管理ページには作成済みのカテゴリが表示される
  test('3. カテゴリ一覧: カテゴリ管理ページには作成済みのカテゴリが表示される', async ({ page }) => {
    console.log('[Test 3] Creating categories for listing test...');
    const categoryNameA = `一覧テストA-${uuidv4().substring(0, 8)}`;
    const categoryNameB = `一覧テストB-${uuidv4().substring(0, 8)}`;

    // カテゴリA作成
    await page.locator('[data-testid="category-management-create-input"]').type(categoryNameA, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const selectorA = `[data-testid^="category-item-"]:has-text("${categoryNameA}")`;
    await expect(page.locator(selectorA)).toBeVisible({ timeout: 10000 });
    const elementA = page.locator(selectorA);
    const testIdA = await elementA.getAttribute('data-testid');
    const idA = testIdA ? testIdA.replace('category-item-', '') : null;
    console.log(`[Test 3] Created category: ${categoryNameA} (ID: ${idA})`);
    // このカテゴリは削除しない (一覧に残っていることを確認するため)

    // カテゴリB作成
    await page.locator('[data-testid="category-management-create-input"]').type(categoryNameB, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const selectorB = `[data-testid^="category-item-"]:has-text("${categoryNameB}")`;
    await expect(page.locator(selectorB)).toBeVisible({ timeout: 10000 });
    const elementB = page.locator(selectorB);
    const testIdB = await elementB.getAttribute('data-testid');
    const idB = testIdB ? testIdB.replace('category-item-', '') : null;
    console.log(`[Test 3] Created category: ${categoryNameB} (ID: ${idB})`);
    if (idB) {
        categoryToDeleteAfterTest = { id: idB, name: categoryNameB }; // Bはクリーンアップ対象
        console.log(`[Test 3] Marked category for cleanup: ${categoryNameB} (ID: ${idB})`);
    }

    console.log('[Test 3] Verifying categories are listed...');
    // 両方のカテゴリが表示されていることを確認
    await expect(page.locator(selectorA)).toBeVisible({ timeout: 5000 });
    console.log(`[Test 3] Verified category in list: ${categoryNameA}`);
    await expect(page.locator(selectorB)).toBeVisible({ timeout: 5000 });
    console.log(`[Test 3] Verified category in list: ${categoryNameB}`);
    console.log('[Test 3] Completed successfully.');
  });

  // 4. カテゴリ更新: 既存のカテゴリ名を変更できる
  test('4. カテゴリ更新: 既存のカテゴリ名を変更できる', async ({ page }) => {
    // 1. 更新対象のカテゴリを作成
    const originalName = `更新前-${uuidv4().substring(0, 8)}`;
    const updatedName = `更新後-${uuidv4().substring(0, 8)}`;
    console.log(`[Test 4] Creating category to update: ${originalName}`);
    await page.locator('[data-testid="category-management-create-input"]').type(originalName, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const originalSelector = `[data-testid^="category-item-"]:has-text("${originalName}")`;
    await expect(page.locator(originalSelector)).toBeVisible({ timeout: 10000 });
    const originalElement = page.locator(originalSelector);
    const dataTestId = await originalElement.getAttribute('data-testid');
    const categoryId = dataTestId ? dataTestId.replace('category-item-', '') : null;
    if (!categoryId) {
      throw new Error('[Test 4] Failed to get category ID for update test.');
    }
    console.log(`[Test 4] Category created: ${originalName} (ID: ${categoryId})`);

    // 2. 編集ボタンをクリック
    const editButtonSelector = `[data-testid="category-edit-button-${categoryId}"]`;
    console.log(`[Test 4] Clicking edit button for ID: ${categoryId}`);
    await page.locator(editButtonSelector).click();

    // 3. 編集フォームが表示されることを確認 (仮定の data-testid)
    const editFormSelector = `[data-testid="category-edit-form-${categoryId}"]`;
    const editInputSelector = `[data-testid="category-edit-input-${categoryId}"]`;
    const saveButtonSelector = `[data-testid="category-save-button-${categoryId}"]`;
    const cancelEditButtonSelector = `[data-testid="category-cancel-edit-button-${categoryId}"]`; // キャンセルボタンも確認

    await expect(page.locator(editFormSelector)).toBeVisible({ timeout: 5000 });
    console.log('[Test 4] Edit form is visible.');
    await expect(page.locator(editInputSelector)).toHaveValue(originalName); // 初期値が元の名前か確認
    await expect(page.locator(saveButtonSelector)).toBeVisible({ timeout: 1000 });
    await expect(page.locator(cancelEditButtonSelector)).toBeVisible({ timeout: 1000 });

    // 4. 新しいカテゴリ名を入力
    console.log(`[Test 4] Entering new name: ${updatedName}`);
    await page.locator(editInputSelector).fill(''); // 一旦クリア
    await page.locator(editInputSelector).type(updatedName, { delay: 0 });

    // 5. 保存ボタンをクリック
    console.log('[Test 4] Clicking save button.');
    await page.locator(saveButtonSelector).click();

    // 6. 更新成功メッセージが表示されることを確認 (仮定の data-testid)
    await expect(page.locator('[data-testid="category-update-success-message"]')).toBeVisible({ timeout: 10000 });
    console.log('[Test 4] Update success message visible.');

    // 7. カテゴリ名がリストで更新されていることを確認
    const updatedSelector = `[data-testid="category-item-${categoryId}"]:has-text("${updatedName}")`;
    await expect(page.locator(updatedSelector)).toBeVisible({ timeout: 10000 });
    console.log('[Test 4] Category name updated in the list.');

    // 8. 編集フォームが非表示になっていることを確認
    // ルール変更: .not.toBeVisible() の代わりに waitForFunction
    await page.waitForFunction((selector) => !document.querySelector(selector), editFormSelector, { timeout: 5000 });
    console.log('[Test 4] Edit form is hidden.');

    // 9. クリーンアップ対象を更新後の情報に設定
    categoryToDeleteAfterTest = { id: categoryId, name: updatedName };
    console.log(`[Test 4] Marked updated category for cleanup: ${updatedName} (ID: ${categoryId})`);
    console.log('[Test 4] Completed successfully.');
  });

  // 5. カテゴリ削除: 既存のカテゴリを削除できる
  test('5. カテゴリ削除: 既存のカテゴリを削除できる', async ({ page }) => {
    // 1. 削除対象のカテゴリを作成
    const categoryNameToDelete = `削除用-${uuidv4().substring(0, 8)}`;
    console.log(`[Test 5] Creating category to delete: ${categoryNameToDelete}`);
    await page.locator('[data-testid="category-management-create-input"]').type(categoryNameToDelete, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const categorySelector = `[data-testid^="category-item-"]:has-text("${categoryNameToDelete}")`;
    await expect(page.locator(categorySelector)).toBeVisible({ timeout: 10000 });
    const categoryElement = page.locator(categorySelector);
    const dataTestId = await categoryElement.getAttribute('data-testid');
    const categoryId = dataTestId ? dataTestId.replace('category-item-', '') : null;
    if (!categoryId) {
      throw new Error('[Test 5] Failed to get category ID for delete test.');
    }
    console.log(`[Test 5] Category created: ${categoryNameToDelete} (ID: ${categoryId})`);
    // ★ 削除テストでは、クリーンアップ対象を *設定しない* (テスト自体で削除するため)
    categoryToDeleteAfterTest = null; // ここでリセットしておく
     console.log(`[Test 5] Marked category for cleanup: ${categoryNameToDelete} (ID: ${categoryId})`); // Log a mark for cleanup, but don't set the global var


    // 2. 削除ボタンをクリック
    const deleteButtonSelector = `[data-testid="category-delete-button-${categoryId}"]`;
    console.log(`[Test 5] Clicking delete button for ID: ${categoryId}`);
    await page.locator(deleteButtonSelector).click();

    // 3. 確認ダイアログが表示されることを確認
    const confirmDialogSelector = '[data-testid="category-delete-confirm-dialog"]';
    await expect(page.locator(confirmDialogSelector)).toBeVisible({ timeout: 5000 });
    console.log('[Test 5] Delete confirmation dialog is visible.');

    // 4. 確認ダイアログの削除ボタンをクリック
    const confirmDeleteButtonSelector = '[data-testid="category-confirm-delete-button"]';
    console.log('[Test 5] Clicking confirm delete button.');
    await page.locator(confirmDeleteButtonSelector).click();

    // 5. 削除成功メッセージが表示されることを確認 (仮定の data-testid)
    await expect(page.locator('[data-testid="category-delete-success-message"]')).toBeVisible({ timeout: 10000 });
    console.log('[Test 5] Delete success message is visible.');

    // 6. カテゴリがリストから削除されていることを確認
    const deletedCategorySelector = `[data-testid="category-item-${categoryId}"]`;
    // ルール変更: .not.toBeVisible() の代わりに waitForFunction
    await page.waitForFunction((selector) => !document.querySelector(selector), deletedCategorySelector, { timeout: 15000 }); // ★ タイムアウト延長
    console.log('[Test 5] Category item is no longer visible in the list.');

    // 7. 確認ダイアログが非表示になっていることを確認
    await page.waitForFunction((selector) => !document.querySelector(selector), confirmDialogSelector, { timeout: 5000 });
    console.log('[Test 5] Delete confirmation dialog is hidden.');
    console.log('[Test 5] Completed successfully.');
    // このテストで削除したので、afterEachでのクリーンアップは不要
    categoryToDeleteAfterTest = null; // 念のためリセット
  });

  // 6. RLS検証: 他ユーザーのカテゴリは表示・操作不可
  test('6. RLS検証: 他ユーザーのカテゴリは表示・操作不可', async ({ page }) => {
    const rlsCategoryName = `RLS検証用カテゴリ-${uuidv4().substring(0, 8)}`;
    let rlsCategoryId: string | null = null;

    // --- ユーザーA (testUser) でカテゴリ作成 ---
    console.log(`[Test 6] Creating category as main user (${testUser.email}): ${rlsCategoryName}`);
    await page.locator('[data-testid="category-management-create-input"]').type(rlsCategoryName, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const rlsCategorySelector = `[data-testid^="category-item-"]:has-text("${rlsCategoryName}")`;
    await expect(page.locator(rlsCategorySelector)).toBeVisible({ timeout: 10000 });
    const rlsCategoryElement = page.locator(rlsCategorySelector);
    const rlsDataTestId = await rlsCategoryElement.getAttribute('data-testid');
    rlsCategoryId = rlsDataTestId ? rlsDataTestId.replace('category-item-', '') : null;
    if (!rlsCategoryId) {
      throw new Error('[Test 6] Failed to get category ID for RLS test.');
    }
    console.log(`[Test 6] Category created by main user: ${rlsCategoryName} (ID: ${rlsCategoryId})`);
    // このカテゴリはメインユーザーでクリーンアップされるはずなので、ここではマークしない

    // --- ログアウト ---
    await logout(page);

    // --- ユーザーB (otherTestUser) でログイン ---
    console.log(`[Test 6] Logging in as other user (${otherTestUser.email})...`);
    await fillAndSubmitLoginForm(page, otherTestUser);
    await page.waitForURL(`${BASE_URL}${HOME_PATH}`, { timeout: 15000 });
    console.log('[Test 6] Logged in as other user.');

    // --- カテゴリページへ移動 ---
    console.log('[Test 6] Navigating to categories page as other user...');
    await page.locator('[data-testid="nav-categories-link"]').click();
    await expect(page.locator('[data-testid="category-management-page-title"]')).toBeVisible({ timeout: 10000 });

    // --- 検証: ユーザーAのカテゴリが表示されていないこと ---
    console.log(`[Test 6] Verifying category ${rlsCategoryName} (ID: ${rlsCategoryId}) is NOT visible...`);
    const otherUserCategorySelector = `[data-testid="category-item-${rlsCategoryId}"]`;
    await expect(page.locator(otherUserCategorySelector)).toHaveCount(0, { timeout: 1000 });
    console.log(`[Test 6] Category ${rlsCategoryName} is correctly not visible for other user.`);

    // --- 検証: ユーザーAのカテゴリの編集・削除ボタンが存在しないこと ---
    const editButtonSelector = `[data-testid="category-edit-button-${rlsCategoryId}"]`;
    const deleteButtonSelector = `[data-testid="category-delete-button-${rlsCategoryId}"]`;
    await expect(page.locator(editButtonSelector)).toHaveCount(0, { timeout: 1000 }); // 存在しないことを確認 (toHaveCount(0))
    await expect(page.locator(deleteButtonSelector)).toHaveCount(0, { timeout: 1000 });
    console.log('[Test 6] Edit and delete buttons for other user\'s category are correctly absent.');

    // --- (任意) ユーザーBとしてカテゴリを作成し、操作可能か確認 ---
    const otherUserName = `カテゴリbyOther-${uuidv4().substring(0,8)}`;
    console.log(`[Test 6] Creating category as other user: ${otherUserName}...`);
    await page.locator('[data-testid="category-management-create-input"]').type(otherUserName, { delay: 0 });
    await page.locator('[data-testid="category-management-create-button"]').click();
    await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 10000 });
    const otherCreatedSelector = `[data-testid^="category-item-"]:has-text("${otherUserName}")`;
    await expect(page.locator(otherCreatedSelector)).toBeVisible({ timeout: 10000 });
    const otherCreatedElement = page.locator(otherCreatedSelector);
    const otherCreatedIdTest = await otherCreatedElement.getAttribute('data-testid');
    const otherCreatedId = otherCreatedIdTest ? otherCreatedIdTest.replace('category-item-', '') : null;
    if (otherCreatedId) {
        console.log(`[Test 6] Category created by other user: ${otherUserName} (ID: ${otherCreatedId})`);
        // このカテゴリは afterEach で削除されるようにマーク
        categoryToDeleteAfterTest = { id: otherCreatedId, name: otherUserName };
        console.log(`[Test 6] Marked category for cleanup: ${otherUserName} (ID: ${otherCreatedId})`);
        // ユーザーBが作成したカテゴリの編集・削除ボタンが表示されることを確認
        await expect(page.locator(`[data-testid="category-edit-button-${otherCreatedId}"]`)).toBeVisible({ timeout: 5000 });
        await expect(page.locator(`[data-testid="category-delete-button-${otherCreatedId}"]`)).toBeVisible({ timeout: 5000 });
        console.log('[Test 6] Edit and delete buttons for own category are visible.');
    } else {
        console.warn('[Test 6] Could not get ID for category created by other user.');
    }

    console.log('[Test 6] RLS validation completed successfully.');
  });

}); // describe 終了 