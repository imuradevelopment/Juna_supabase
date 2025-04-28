import { expect, test, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

// --- テスト設定 ---
// ベースURL (環境変数 PLAYWRIGHT_TEST_BASE_URL が設定されていればそれを使用、なければローカル開発サーバーの URL)
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
// 各ページのパス定義 (URL構築に使用)
const HOME_PATH = '/'; // ホームページ
const CATEGORIES_PATH = '/categories'; // カテゴリ管理ページ
const POST_NEW_PATH = '/posts/new'; // 新規投稿ページ

// --- ヘルパー関数 ---
/**
 * 固有のテストユーザー情報を生成する関数 (ユーザー登録用)
 * 各テストケースで独立したユーザーを使用するためにUUIDを組み込む
 * @returns {object} テストユーザー情報 (email, password, nickname, accountId)
 */
const createTestUserData = () => {
  const id = uuidv4(); // UUID v4 を生成
  // メールアドレス (一意性を高めるためUUIDの一部を使用)
  const email = `test-pc-${id.substring(0, 12)}@example.com`;
  // 固定パスワード (テスト用)
  const password = 'password123';
  // ニックネーム (テスト種別とUUIDの一部で識別)
  const nickname = `投稿作成-${id.substring(0, 4)}`;
  // アカウントID (一意性を高めるためUUIDの一部を使用)
  const accountId = `test_pc_${id.substring(0, 6)}`;
  return { email, password, nickname, accountId }; // 生成したユーザー情報をオブジェクトで返す
};

/**
 * UI経由でログインを行うヘルパー関数
 * @param page PlaywrightのPageオブジェクト
 * @param user ログインに使用するユーザー情報 (email, password)
 */
const fillAndSubmitLoginForm = async (page: Page, user: { email: string; password: string }) => {
  // [Helper] ログイン試行開始ログ (理由: テスト進行状況の追跡)
  console.log(`[Helper] Logging in as ${user.email}...`);
  // ログインページのタイトルが表示されるまで待機 (タイムアウト15秒)
  await expect(page.locator('[data-testid="login-page-title"]')).toBeVisible({ timeout: 15000 });
  // 識別子（メール/アカウントID）入力欄にメールアドレスを入力
  await page.locator('[data-testid="identifier-input"]').fill(user.email);
  // パスワード入力欄にパスワードを入力
  await page.locator('[data-testid="password-input"]').fill(user.password);
  // ログインボタンをクリック
  await page.locator('[data-testid="login-button"]').click();
  // ホームページへのURL遷移を待機 (タイムアウト30秒)
  await page.waitForURL(`${BASE_URL}${HOME_PATH}`, { timeout: 30000 });
  // ヘッダーが表示されるまで待機 (タイムアウト20秒)
  await expect(page.locator('header')).toBeVisible({ timeout: 20000 });
  // [Helper] ログイン完了ログ (理由: テスト進行状況の追跡)
  console.log(`[Helper] User ${user.email} logged in.`);
};

/**
 * UI経由でカテゴリを作成するヘルパー関数 (カテゴリページにいる必要あり)
 * @param page PlaywrightのPageオブジェクト
 * @param categoryName 作成するカテゴリ名
 * @returns {Promise<{ id: number | null; name: string }>} 作成されたカテゴリの情報 { id: number | null, name: string }
 */
const createCategoryViaUI = async (page: Page, categoryName: string): Promise<{ id: number | null; name: string }> => {
  // [Helper] カテゴリ作成開始ログ (理由: テスト進行状況の追跡)
  console.log(`[Helper] Creating category: ${categoryName}`);
  // カテゴリ管理ページのタイトルが表示されるまで待機 (タイムアウト15秒)
  await expect(page.locator('[data-testid="category-management-page-title"]')).toBeVisible({ timeout: 15000 });
  // カテゴリ名入力フィールドにカテゴリ名を入力
  await page.locator('[data-testid="category-management-create-input"]').fill(categoryName);
  // 作成ボタンをクリック
  await page.locator('[data-testid="category-management-create-button"]').click();
  // 作成成功メッセージが表示されるまで待機 (タイムアウト20秒)
  await expect(page.locator('[data-testid="category-create-success-message"]')).toBeVisible({ timeout: 20000 });
  // 作成されたカテゴリがリストに表示されるのを待機 (名前で検索、タイムアウト20秒)
  const escapedCategoryName = categoryName.replace(/\"/g, '\\"'); // セレクタ用にカテゴリ名のダブルクォートをエスケープ
  const newCategorySelector = `[data-testid^="category-item-"]:has-text("${escapedCategoryName}")`; // 作成されたカテゴリ要素のセレクタ
  await expect(page.locator(newCategorySelector)).toBeVisible({ timeout: 20000 }); // 表示されるまで待機
  // 作成されたカテゴリ要素から data-testid 属性を取得してIDを抽出
  const newCategoryElement = page.locator(newCategorySelector); // カテゴリ要素を取得
  const dataTestId = await newCategoryElement.getAttribute('data-testid'); // data-testid属性値を取得
  const categoryId = dataTestId ? parseInt(dataTestId.replace('category-item-', ''), 10) : null; // "category-item-" を削除して数値に変換
  // IDの抽出に失敗した場合エラーをスロー
  if (categoryId === null || isNaN(categoryId)) {
    // [Helper] ID抽出失敗エラーログ (理由: 潜在的なバグやセレクタの問題特定)
    console.error(`[Helper] Failed to extract category ID from data-testid: ${dataTestId}`);
    throw new Error(`カテゴリIDの抽出に失敗しました: ${categoryName}`);
  }
  // [Helper] カテゴリ作成完了ログ (理由: テスト進行状況の追跡)
  console.log(`[Helper] Category created: ${categoryName} with ID: ${categoryId}`);
  return { id: categoryId, name: categoryName }; // 抽出したIDとカテゴリ名を返す
};

/**
 * UI経由でカテゴリを削除するヘルパー関数 (カテゴリページにいる必要あり)
 * @param page PlaywrightのPageオブジェクト
 * @param categoryId 削除するカテゴリID
 * @param categoryName 削除するカテゴリ名 (ログ用)
 */
const deleteCategoryViaUI = async (page: Page, categoryId: number | null, categoryName: string) => {
  // IDが無効 (null または NaN) な場合は警告ログを出力して処理をスキップ
  if (categoryId === null || isNaN(categoryId)) {
    // [Helper] 無効なカテゴリID警告ログ (理由: 不正なIDでの削除試行を記録)
    console.warn(`[Helper] Invalid category ID (${categoryId}) for deletion of "${categoryName}". Skipping.`);
    return; // 処理を中断
  }
  // [Helper] カテゴリ削除試行開始ログ (理由: テスト進行状況の追跡)
  console.log(`[Helper] Attempting to delete category: ${categoryName} (ID: ${categoryId})`);
  // 削除対象カテゴリのアイテムと削除ボタンのセレクタを定義
  const categoryItemSelector = `[data-testid="category-item-${categoryId}"]`; // カテゴリアイテムのセレクタ
  const deleteButtonSelector = `[data-testid="category-delete-button-${categoryId}"]`; // 削除ボタンのセレクタ

  // カテゴリ管理ページのタイトルが表示されるまで待機 (タイムアウト15秒)
  await expect(page.locator('[data-testid="category-management-page-title"]')).toBeVisible({ timeout: 15000 });

  // 削除ボタンの存在を確認
  const deleteButton = page.locator(deleteButtonSelector); // 削除ボタン要素を取得
  // ボタンが見つからない場合は警告ログを出力して処理をスキップ (タイムアウト15秒)
  if (!await deleteButton.isVisible({ timeout: 15000 })) {
      // [Helper] 削除ボタン未発見警告ログ (理由: 削除対象が見つからない状況を記録)
      console.warn(`[Helper] Delete button for category ${categoryId} ("${categoryName}") not visible. Skipping deletion.`);
      return; // 処理を中断
  }
  // 削除ボタンをクリック
  await deleteButton.click();
  // 削除確認ダイアログが表示されるまで待機 (タイムアウト10秒)
  await expect(page.locator('[data-testid="category-delete-confirm-dialog"]')).toBeVisible({ timeout: 10000 });
  // 確認ダイアログの削除ボタンをクリックして削除を実行
  await page.locator('[data-testid="category-confirm-delete-button"]').click();
  // カテゴリアイテムがDOMから削除されるのを待機 (タイムアウト20秒)
  try {
    // waitForFunction を使用して、指定されたセレクタを持つ要素が存在しなくなるまで待機
    await page.waitForFunction((selector) => !document.querySelector(selector), categoryItemSelector, { timeout: 20000 });
    // [Helper] カテゴリ削除成功ログ (理由: テスト進行状況の追跡)
    console.log(`[Helper] Category ${categoryName} (ID: ${categoryId}) deleted successfully.`);
  } catch (e) {
    // [Helper] 削除待機タイムアウトエラーログ (理由: DOMからの要素削除失敗の記録)
    console.error(`[Helper] Timeout waiting for category ${categoryName} (ID: ${categoryId}) to be deleted from DOM.`);
    throw e; // エラーを再スローしてテストを失敗させる
  }
};

// --- テストスイート: 投稿作成機能群 ---
test.describe.serial('投稿作成', () => {
  // --- テストスイート内で共有する変数 ---
  let currentUser: ReturnType<typeof createTestUserData>; // 現在のテストケースで使用するユーザー情報
  let currentCategory: { id: number | null; name: string }; // 現在のテストケースで作成したカテゴリ情報
  let createdPostId: string | null = null; // テストケース1で作成された投稿のID (クリーンアップ用)
  let page: Page; // PlaywrightのPageオブジェクト (beforeEachでセットアップ)

  // --- 各テスト実行前のセットアップ (共通処理) ---
  test.beforeEach(async ({ page: p }) => { // PlaywrightからPageオブジェクト(p)を受け取る
    page = p; // スコープ変数 `page` に代入して他の場所で使えるようにする
    // [Setup - beforeEach] セットアップ開始ログ (理由: 各テスト開始時の区切り)
    console.log('[Setup - beforeEach] Starting test setup...');

    // --- ブラウザ状態のクリア (クッキーのみ) ---
    // 目的: 前のテストの影響を排除し、クリーンな状態でテストを開始するため
    // [Setup - beforeEach] 状態クリア開始ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Clearing browser state (Cookies only)...');
    try {
      await page.context().clearCookies(); // 現在のブラウザコンテキストのクッキーをすべて削除
      // [Setup - beforeEach] 状態クリア完了ログ (理由: セットアップステップの明示)
      console.log('[Setup - beforeEach] Browser state cleared (Cookies only).');
    } catch (error) {
      // [Setup - beforeEach] 状態クリアエラーログ (理由: セットアップ失敗の記録)
      console.error('[Setup - beforeEach] Error clearing browser state (Cookies):', error);
      // エラーが発生しても処理を続行する（他のセットアップに影響しない可能性もあるため）
    }
    // ---

    // --- コンソールリスナー設定 ---
    // 目的: ブラウザ側のコンソール出力を捕捉し、エラーチェックやデバッグに利用するため
    page.removeAllListeners('console'); // 既存のリスナーを削除 (重複登録防止)
    const currentTestConsoleMessages: string[] = []; // このテストケース用のコンソールメッセージ格納配列を初期化
    // コンソールメッセージが発生するたびに配列に追加するリスナー関数
    const currentConsoleListener = (msg: any) => currentTestConsoleMessages.push(msg.text());
    page.on('console', currentConsoleListener); // pageオブジェクトにリスナーを登録
    // 後でafterEachで参照できるように、pageオブジェクトにカスタムプロパティとして保持
    (page as any).__currentTestConsoleMessages = currentTestConsoleMessages;
    (page as any).__currentConsoleListener = currentConsoleListener;

    // --- Playwrightにブラウザログ転送関数を公開 (`logFromBrowser`) ---
    // 目的: ブラウザ側(Vueコンポーネントなど)からNode.js側のコンソールにログを出力するため (テスト進行状況の把握やデバッグ)
    await page.exposeFunction('logFromBrowser', (...args: any[]) => {
      // Node.js側のコンソールに '[Browser Log]' プレフィックス付きで出力
      console.log('[Browser Log]', ...args);
    });
    // [Setup - beforeEach] 関数公開ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Exposed logFromBrowser function to the browser context.');
    // ---

    // 新しい一意なテストユーザー情報を生成
    currentUser = createTestUserData();

    // --- UI経由でのユーザー登録処理 ---
    // [Setup - beforeEach] ホームページへの遷移ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Navigating to home page for registration...');
    await page.goto(`${BASE_URL}${HOME_PATH}`); // ホームページへ移動 (テストの起点)
    // ページの読み込み完了 (`document.readyState === 'complete') を待機 (タイムアウト15秒)
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    // [Setup - beforeEach] 登録リンククリックログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Clicking register link...');
    const registerLinkSelector = '[data-testid="header-register-link"]'; // ヘッダーの登録リンクのセレクタ
    await expect(page.locator(registerLinkSelector)).toBeVisible({ timeout: 10000 }); // リンクが表示されるまで待機
    await page.locator(registerLinkSelector).click(); // 登録ページへ遷移

    // [Setup - beforeEach] ユーザー登録情報ログ (理由: 使用するテストデータを記録)
    console.log(`[Setup - beforeEach] Registering user: ${currentUser.email}`);
    // 登録ページの読み込み完了とURLが `/register` になることを待機 (タイムアウト15秒, 10秒)
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
    await page.waitForFunction((path: string) => window.location.pathname === path, '/register', { timeout: 10000 });
    // [Setup - beforeEach] 登録ページ読み込み完了ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Register page loaded.');

    // 登録フォームの各入力欄に必要な情報を入力
    await page.locator('[data-testid="nickname-input"]').fill(currentUser.nickname);
    await page.locator('[data-testid="account-id-input"]').fill(currentUser.accountId);
    await page.locator('[data-testid="email-input"]').fill(currentUser.email);
    await page.locator('[data-testid="password-input"]').fill(currentUser.password);
    await page.locator('[data-testid="password-confirm-input"]').fill(currentUser.password); // パスワード確認

    // 登録ボタンを取得し、表示と有効状態を確認 (タイムアウト5秒)
    const registerButton = page.getByTestId('register-button'); // 登録ボタン要素を取得
    await expect(registerButton).toBeVisible({ timeout: 5000 }); // 表示されているか
    await expect(registerButton).toBeEnabled({ timeout: 5000 }); // クリック可能か
    // [Setup - beforeEach] 登録フォーム送信ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Submitting registration form...');
    await registerButton.click(); // 登録ボタンをクリックしてフォームを送信
    // ---

    // --- 登録後のログインページ遷移待機とログイン処理 ---
    // [Setup - beforeEach] ログインページ待機ログ (理由: 状態遷移の追跡)
    console.log('[Setup - beforeEach] Waiting for login page after registration...');
    try {
      // ログインページへのURL遷移 (`/login` で終わるURL) を待機 (タイムアウト10秒)
      await page.waitForURL('**/login', { timeout: 10000 });
      // [Setup - beforeEach] ログインページURL遷移検出ログ (理由: 状態遷移の追跡)
      console.log('[Setup - beforeEach] Login page URL transition detected.');
      // ログインページの読み込み完了 (`document.readyState === 'complete') を待機 (タイムアウト10秒)
      await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
      // [Setup - beforeEach] ログインページ読み込み完了ログ (理由: 状態遷移の追跡)
      console.log('[Setup - beforeEach] Login page readyState is complete.');
    } catch (error) {
       // [Setup - beforeEach] ログインページ待機タイムアウトエラーログ (理由: セットアップ失敗の原因特定)
       console.error('[Setup - beforeEach] Timeout waiting for login page navigation/load after registration.', error);
       // タイムアウト時のスクリーンショットを保存 (デバッグ用)
       await page.screenshot({ path: `playwright-report/login-page-wait-timeout-url-state-${Date.now()}.png` });
       throw error; // エラーを再スローしてテストを失敗させる
    }
    // [Setup - beforeEach] ログイン実行ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Now logging in...');
    // ヘルパー関数 `fillAndSubmitLoginForm` を使ってログインを実行
    await fillAndSubmitLoginForm(page, { email: currentUser.email, password: currentUser.password });
    // [Setup - beforeEach] ログイン成功ログ (理由: セットアップ完了の確認)
    console.log(`[Setup - beforeEach] Logged in successfully.`);
    // ---

    // --- UI経由でのカテゴリ作成処理 ---
    // [Setup - beforeEach] カテゴリ作成開始ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Creating category...');
    // ナビゲーションからカテゴリページへのリンクをクリック
    const categoriesLinkSelector = '[data-testid="nav-categories-link"]'; // カテゴリページへのリンクのセレクタ
    await expect(page.locator(categoriesLinkSelector)).toBeVisible({ timeout: 10000 }); // 表示されるまで待機
    await page.locator(categoriesLinkSelector).click(); // クリックしてカテゴリページへ
    // カテゴリページへのURL遷移と読み込み完了を待機 (タイムアウト15秒, 10秒)
    await page.waitForURL(`${BASE_URL}${CATEGORIES_PATH}`, { timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
    // [Setup - beforeEach] カテゴリページ遷移完了ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Navigated to categories page.');

    // 新しい一意なカテゴリ名を生成
    const categoryName = `テストカテゴリ-${uuidv4().substring(0, 6)}`;
    // ヘルパー関数 `createCategoryViaUI` を使ってカテゴリを作成
    currentCategory = await createCategoryViaUI(page, categoryName);
    // [Setup - beforeEach] カテゴリ作成完了ログ (理由: セットアップで使用するデータを記録)
    console.log(`[Setup - beforeEach] Category created: ${currentCategory.name} (ID: ${currentCategory.id})`);
    // ---

    // --- 新規投稿ページへの遷移処理 ---
    // [Setup - beforeEach] 新規投稿ページ遷移開始ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Navigating to new post page...');
    // ナビゲーションから新規投稿ページへのリンクをクリック (一旦ホームへ戻ってからクリック)
    const newPostLinkSelector = '[data-testid="nav-post-new-link"]'; // 新規投稿ページへのリンクのセレクタ
    await page.goto(`${BASE_URL}${HOME_PATH}`); // ホームページへ移動 (状態リセットのため)
    await expect(page.locator(newPostLinkSelector)).toBeVisible({ timeout: 10000 }); // 表示されるまで待機
    await page.locator(newPostLinkSelector).click(); // 新規投稿リンクをクリック
    // 新規投稿ページへのURL遷移と読み込み完了を待機 (タイムアウト15秒, 10秒)
    await page.waitForURL(`${BASE_URL}${POST_NEW_PATH}`, { timeout: 15000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 });
    // [Setup - beforeEach] 新規投稿ページ遷移完了ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Navigated to new post page.');

    // 投稿作成フォームの主要要素が表示されるのを待機 (タイムアウト各15秒)
    // 目的: フォーム操作前に必要な要素がすべてロードされていることを保証するため
    // [Setup - beforeEach] フォーム要素待機ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Waiting for post creation form elements...');
    await expect(page.locator('[data-testid="post-create-title-input"]')).toBeVisible({ timeout: 15000 }); // タイトル入力欄
    await expect(page.locator('[data-testid="post-create-content-input"]')).toBeVisible({ timeout: 15000 }); // 内容入力欄
    await expect(page.locator('[data-testid="post-create-category-select"]')).toBeVisible({ timeout: 15000 }); // カテゴリ選択欄
    await expect(page.locator('[data-testid="post-create-submit-button"]')).toBeVisible({ timeout: 15000 }); // 送信ボタン
    // [Setup - beforeEach] フォーム要素表示確認ログ (理由: セットアップステップの明示)
    console.log('[Setup - beforeEach] Post creation form elements are visible.');
    // ---

    // 作成された投稿IDをリセット (各テストケースで値が設定されるため、初期化しておく)
    createdPostId = null;
    // [Setup - beforeEach] セットアップ完了ログ (理由: 各テスト開始前の区切り)
    console.log('[Setup - beforeEach] Completed setup.');
  });

  // --- 各テスト実行後のクリーンアップ (共通処理) ---
  test.afterEach(async () => {
    // [Cleanup - afterEach] クリーンアップ開始ログ (理由: 各テスト終了時の区切り)
    console.log('[Cleanup - afterEach] Starting...');
    // --- コンソールエラーチェック ---
    // 目的: テスト実行中にブラウザコンソールでエラーが発生していないか確認するため
    const messages = (page as any).__currentTestConsoleMessages || []; // beforeEachで記録したコンソールメッセージを取得
    // 特定のエラー(無視対象)を除外して、"error" を含むメッセージをフィルタリング
    const errors = messages.filter((msg: string) =>
      msg.toLowerCase().includes('error') && // "error" を含む (大文字小文字問わず)
      !msg.includes('404') && // 404 エラーはテストと無関係な場合があるので無視
      !msg.includes('Failed to fetch dynamically imported module') && // Vite/HMR関連のエラーは無視
      !msg.includes('supabase-js.js') && // Supabaseクライアントライブラリ内部のエラーは無視
      !msg.includes('[vite] Internal server error:') // Viteの内部サーバーエラーは無視
    );
    // エラーが検出された場合は、エラー内容をメッセージに含めてテストを失敗させる
    expect(errors, `[Cleanup - afterEach] Console errors detected: ${JSON.stringify(errors)}`).toHaveLength(0);
    // 登録したコンソールリスナーを解除 (メモリリーク防止)
    if ((page as any).__currentConsoleListener) {
      page.off('console', (page as any).__currentConsoleListener);
    }
    // ---

    // --- 投稿削除処理 (現在は未実装のため警告表示のみ) ---
    // 目的: テストで作成されたデータを削除し、他のテストへの影響を防ぐため
    if (createdPostId) { // テストケース1で投稿が作成されていた場合
      // [Cleanup - afterEach] 投稿削除未実装警告ログ (理由: クリーンアップ漏れの可能性を示す)
      console.warn(`[Cleanup - afterEach] Post deletion via UI (ID: ${createdPostId}) is not implemented yet. Manual cleanup might be required.`);
      // TODO: 将来的にUI経由での投稿削除処理をここに追加する
      // 例: await deletePostViaUI(page, createdPostId);
    } else {
      // [Cleanup - afterEach] 削除対象投稿なしログ (理由: クリーンアップ状況の明示)
      console.log("[Cleanup - afterEach] No post ID marked for deletion in this test.");
    }
    // ---

    // --- カテゴリ削除処理 ---
    // 目的: beforeEach で作成されたカテゴリを削除するため
    if (currentCategory?.id) { // beforeEach でカテゴリが作成されていた場合
      // [Cleanup - afterEach] カテゴリ削除開始ログ (理由: クリーンアップステップの明示)
      console.log(`[Cleanup - afterEach] Deleting category: ${currentCategory.name} (ID: ${currentCategory.id})`);
      // カテゴリページへ遷移 (削除操作を行うため)
      // [Cleanup - afterEach] カテゴリページ遷移ログ (理由: クリーンアップステップの明示)
      console.log('[Cleanup - afterEach] Navigating to categories page for cleanup...');
      await page.goto(`${BASE_URL}${CATEGORIES_PATH}`); // カテゴリページへ直接遷移
      await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 10000 }); // ページ読み込み完了待機
      // ヘルパー関数 `deleteCategoryViaUI` を使ってカテゴリを削除
      await deleteCategoryViaUI(page, currentCategory.id, currentCategory.name);
    }
    // ---
    // [Cleanup - afterEach] クリーンアップ完了ログ (理由: 各テスト終了時の区切り)
    console.log('[Cleanup - afterEach] Finished.');
  });

  // --- テストケース1: 投稿作成 (成功シナリオ) ---
  test('1. 投稿作成(成功)', async () => {
    // [Test 1 - Success] テスト開始ログ (理由: テストケース開始の明示)
    console.log('[Test 1 - Success] Starting...');
    // 一意な投稿タイトルと内容を生成
    const postTitle = `新規投稿タイトル ${uuidv4().substring(0, 6)}`;
    const postContent = `新規投稿コンテント\\n${uuidv4()}\\n複数行`; // 複数行の内容

    // フォームにタイトル、内容を入力し、カテゴリを選択
    // [Test 1] フォーム入力ログ (理由: テストステップの明示)
    console.log(`[Test 1] Filling form: Title="${postTitle}"`); // タイトル入力ログ
    await page.locator('[data-testid="post-create-title-input"]').fill(postTitle);
    // [Test 1] 内容入力ログ (理由: テストステップの明示)
    console.log('[Test 1] Filling content...'); // 内容入力ログ
    await page.locator('[data-testid="post-create-content-input"]').fill(postContent);
    // [Test 1] カテゴリ選択ログ (理由: テストステップの明示)
    console.log(`[Test 1] Selecting category: ${currentCategory.name}`); // カテゴリ選択ログ
    await page.locator('[data-testid="post-create-category-select"]').selectOption({ value: String(currentCategory.id) }); // カテゴリを選択

    // 送信ボタンが有効(クリック可能)であることを確認 (タイムアウト5秒)
    // [Test 1] 送信ボタン有効確認ログ (理由: フォーム送信前の前提条件確認)
    console.log('[Test 1] Checking if submit button is enabled...');
    const submitButton = page.getByTestId('post-create-submit-button'); // 送信ボタン要素を取得
    await expect(submitButton).toBeEnabled({ timeout: 5000 }); // 有効状態か
    // [Test 1] 送信ボタン有効確認完了ログ (理由: テストステップの明示)
    console.log('[Test 1] Submit button is enabled.');

    // 送信ボタンをクリックして投稿を作成
    // [Test 1] 送信ボタンクリックログ (理由: テストアクションの実行記録)
    console.log('[Test 1] Clicking submit button...');
    await submitButton.click(); // クリック実行

    // 投稿詳細ページへのリダイレクトを待機 (正規表現で投稿ID部分 `/posts/[uuid]` を許容、タイムアウト30秒)
    await page.waitForURL(/^http:\/\/localhost:3000\/posts\/[a-f0-9\-]+$/, { timeout: 30000 });
    // [Test 1] リダイレクト先URLログ (理由: 画面遷移の確認)
    console.log(`[Test 1] Redirected to: ${page.url()}`);

    // 遷移後の投稿詳細ページで、作成したタイトルと内容が表示されていることを確認
    // [Test 1] 表示内容検証ログ (理由: テスト結果の検証ステップ)
    console.log('[Test 1] Verifying title and content on view page...');
    // タイトル要素が表示され、期待したテキストを含むことを確認 (タイムアウト各15秒)
    const viewTitleSelector = '[data-testid="post-view-title"]'; // 投稿表示ページのタイトル要素セレクタ
    await expect(page.locator(viewTitleSelector)).toBeVisible({ timeout: 15000 }); // 表示確認
    await expect(page.locator(viewTitleSelector)).toHaveText(postTitle, { timeout: 15000 }); // 内容確認
    // 内容要素が表示され、期待したテキストを含むことを確認 (タイムアウト各15秒)
    const viewContentSelector = '[data-testid="post-view-content"]'; // 投稿表示ページのコンテント要素セレクタ
    await expect(page.locator(viewContentSelector)).toBeVisible({ timeout: 15000 }); // 表示確認
    await expect(page.locator(viewContentSelector)).toHaveText(postContent, { timeout: 15000 }); // 内容確認

    // 作成された投稿のIDをURLから抽出し、クリーンアップ用に記録
    const urlParts = page.url().split('/'); // URLを'/'で分割
    createdPostId = urlParts[urlParts.length - 1]; // 末尾の要素が投稿ID
    // [Test 1] 作成投稿ID記録ログ (理由: 後続のクリーンアップ処理のため)
    console.log(`[Test 1] Recorded created post ID for cleanup: ${createdPostId}`);

    // [Test 1 - Success] テスト完了ログ (理由: テストケース終了の明示)
    console.log('[Test 1 - Success] Completed.');
  });

  // --- テストケース2: 投稿作成キャンセル ---
  test('2. 投稿作成(キャンセル)', async () => {
    // [Test 2 - Cancel] テスト開始ログ (理由: テストケース開始の明示)
    console.log('[Test 2 - Cancel] Starting...');
    // フォームに適当な値を入力 (キャンセルされるデータ)
    // [Test 2] フォーム入力ログ (理由: テストステップの明示)
    console.log('[Test 2] Filling form...');
    await page.locator('[data-testid="post-create-title-input"]').fill('キャンセル用タイトル');
    await page.locator('[data-testid="post-create-content-input"]').fill('キャンセル用コンテント');
    await page.locator('[data-testid="post-create-category-select"]').selectOption({ value: String(currentCategory.id) });

    // キャンセルボタンをクリック
    // [Test 2] キャンセルボタンクリックログ (理由: テストアクションの実行記録)
    console.log('[Test 2] Clicking cancel button...');
    await page.locator('[data-testid="post-create-cancel-button"]').click();

    // ホームページ (`/`) に遷移することを確認 (キャンセル後の挙動)
    // [Test 2] ページ遷移検証ログ (理由: テスト結果の検証ステップ)
    console.log('[Test 2] Verifying navigation after cancel...');
    // router.back() の挙動は状況によるため、ここではホームへの遷移を期待する
    await page.waitForURL(`${BASE_URL}${HOME_PATH}`, { timeout: 15000 }); // URL遷移待機
    // [Test 2] ページ遷移確認ログ (理由: 画面遷移の確認)
    console.log(`[Test 2] Navigated to ${page.url()} after cancel.`);
    // [Test 2 - Cancel] テスト完了ログ (理由: テストケース終了の明示)
    console.log('[Test 2 - Cancel] Test finished.');
  });

  // --- テストケース3: 入力エラー (タイトル必須) ---
  test('3. 投稿作成(入力エラー - タイトル必須)', async () => {
    // [Test 3 - Validation Title] テスト開始ログ (理由: テストケース開始の明示)
    console.log('[Test 3 - Validation Title] Starting...');
    // 内容とカテゴリのみ入力 (タイトルは空)
    // [Test 3] フォーム入力ログ (理由: テストステップの明示)
    console.log('[Test 3] Entering content and category...');
    await page.locator('[data-testid="post-create-content-input"]').fill('タイトルなしコンテント');
    await page.locator('[data-testid="post-create-category-select"]').selectOption({ value: String(currentCategory.id) });

    // 送信ボタンをクリック (バリデーションエラーを期待)
    // [Test 3] 送信ボタンクリックログ (理由: テストアクションの実行記録)
    console.log('[Test 3] Clicking save button with empty title...');
    await page.locator('[data-testid="post-create-submit-button"]').click();

    // タイトル入力欄の下にエラーメッセージが表示されることを確認
    // [Test 3] エラーメッセージ検証ログ (理由: テスト結果の検証ステップ)
    console.log('[Test 3] Verifying title error message...');
    const titleError = page.locator('[data-testid="post-create-title-input-error"]'); // タイトルエラー要素セレクタ
    await expect(titleError).toBeVisible({ timeout: 10000 }); // 表示確認
    await expect(titleError).toHaveText('タイトルは必須です', { timeout: 5000 }); // メッセージ内容確認
    // [Test 3] エラーメッセージ確認ログ (理由: 検証結果の明示)
    console.log('[Test 3] Title error message confirmed.');

    // URLが変わっていないこと (ページ遷移していないこと) を確認
    // [Test 3] URL確認ログ (理由: 意図しない画面遷移がないことの確認)
    console.log(`[Test 3] URL remains: ${page.url()}`);
    expect(page.url()).toBe(`${BASE_URL}${POST_NEW_PATH}`); // URLが新規投稿ページのままか

    // [Test 3 - Validation Title] テスト完了ログ (理由: テストケース終了の明示)
    console.log('[Test 3 - Validation Title] Completed.');
  });

  // --- テストケース4: 入力エラー (内容必須) ---
  test('4. 投稿作成(入力エラー - 内容必須)', async () => {
    // [Test 4 - Validation Content] テスト開始ログ (理由: テストケース開始の明示)
    console.log('[Test 4 - Validation Content] Starting...');
    // タイトルとカテゴリのみ入力 (内容は空)
    // [Test 4] フォーム入力ログ (理由: テストステップの明示)
    console.log('[Test 4] Entering title and category...');
    await page.locator('[data-testid="post-create-title-input"]').fill('内容なしタイトル');
    await page.locator('[data-testid="post-create-category-select"]').selectOption({ value: String(currentCategory.id) });

    // 送信ボタンをクリック (バリデーションエラーを期待)
    // [Test 4] 送信ボタンクリックログ (理由: テストアクションの実行記録)
    console.log('[Test 4] Clicking save button with empty content...');
    await page.locator('[data-testid="post-create-submit-button"]').click();

    // 内容入力欄の下にエラーメッセージが表示されることを確認
    // [Test 4] エラーメッセージ検証ログ (理由: テスト結果の検証ステップ)
    console.log('[Test 4] Verifying content error message...');
    const contentError = page.locator('[data-testid="post-create-content-input-error"]'); // 内容エラー要素セレクタ
    await expect(contentError).toBeVisible({ timeout: 10000 }); // 表示確認
    await expect(contentError).toHaveText('内容は必須です', { timeout: 5000 }); // メッセージ内容確認
    // [Test 4] エラーメッセージ確認ログ (理由: 検証結果の明示)
    console.log('[Test 4] Content error message confirmed.');

    // URLが変わっていないこと (ページ遷移していないこと) を確認
    // [Test 4] URL確認ログ (理由: 意図しない画面遷移がないことの確認)
    console.log(`[Test 4] URL remains: ${page.url()}`);
    expect(page.url()).toBe(`${BASE_URL}${POST_NEW_PATH}`); // URLが新規投稿ページのままか

    // [Test 4 - Validation Content] テスト完了ログ (理由: テストケース終了の明示)
    console.log('[Test 4 - Validation Content] Completed.');
  });

  // 他のテストケース（例: カテゴリ必須エラーなど）も必要に応じて追加

}); // test.describe.serial 終了 