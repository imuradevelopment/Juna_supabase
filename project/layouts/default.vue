<template>
  <!-- デフォルトレイアウトのルート要素 -->
  <div class="flex flex-col min-h-screen bg-primary-100 text-gray-700" data-testid="default-layout">
    <!-- ヘッダー部分 -->
    <header class="bg-primary-300 text-secondary-500 shadow-md p-4 flex justify-between items-center" data-testid="header-placeholder">
      <!-- サイトロゴ（ホームへのリンク） -->
      <NuxtLink to="/" class="text-xl font-bold hover:text-secondary-700" data-testid="header-home-link">
        Blog
      </NuxtLink>
      <!-- ナビゲーションメニュー -->
      <nav data-testid="header-nav">
        <ul class="flex space-x-4 items-center">
          <!-- 認証状態のチェックが完了し、かつユーザーが存在する場合 (ログイン済み) -->
          <template v-if="!isAuthCheckLoading && user">
            <li>
              <NuxtLink
                to="/profile"
                class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium"
                data-testid="header-profile-link"
              >
                プロフィール
              </NuxtLink>
            </li>
            <li>
              <button
                @click="handleLogout"
                class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium bg-transparent border-none cursor-pointer"
                data-testid="header-logout-button"
              >
                ログアウト
              </button>
            </li>
          </template>
          <!-- 認証状態のチェックが完了し、かつユーザーが存在しない場合 (未ログイン) -->
          <template v-else-if="!isAuthCheckLoading">
            <li>
              <NuxtLink
                to="/register"
                class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium"
                data-testid="header-register-link"
              >
                新規登録
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/login"
                class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium"
                data-testid="header-login-link"
              >
                ログイン
              </NuxtLink>
            </li>
          </template>
          <!-- 認証状態のチェック中は何も表示しない -->
          <li v-else></li>
        </ul>
      </nav>
    </header>

    <!-- メインコンテンツエリア -->
    <!-- 認証状態のチェックが完了するまで表示しない -->
    <main v-show="!isAuthCheckLoading" class="flex-grow container mx-auto p-6" data-testid="main-content">
      <slot />
    </main>
    <!-- 認証状態のチェック中に表示するローディングインジケーター -->
    <div v-show="isAuthCheckLoading" class="flex-grow container mx-auto p-6 flex justify-center items-center" data-testid="main-loading">
      <!-- NuxtIcon コンポーネントでスピナーを表示 -->
      <NuxtIcon name="svg-spinners:180-ring" class="w-10 h-10 text-secondary-500 animate-spin" />
    </div>

    <!-- フッター部分 -->
    <footer class="bg-primary-300 text-gray-500 p-4 text-center mt-auto" data-testid="footer-placeholder">
      <!-- コピーライト表示 -->
      <p>&copy; {{ new Date().getFullYear() }} Blog. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'; // Vue リアクティビティ関連の関数をインポート
import { useRouter } from 'vue-router' // Vue Router から useRouter フックをインポート

// Nuxt の useSupabaseUser Composable を使用してユーザー情報を取得 (リアクティブ)
// @ts-ignore Nuxtの自動インポート
const user = useSupabaseUser(); // ユーザー情報 (リアクティブな参照)
// Nuxt の useSupabaseClient Composable を使用して Supabase クライアントを取得
// @ts-ignore Nuxtの自動インポート
const { auth } = useSupabaseClient(); // Supabase クライアントの auth オブジェクトを取得
// Nuxt の useRouter Composable を使用してルーターインスタンスを取得
// @ts-ignore Nuxtの自動インポート
const router = useRouter(); // ルーターインスタンスを取得

// 初期認証状態のチェックが完了したかどうかを示すフラグ (リアクティブ)
// 初期値は true (ローディング中)
const isAuthCheckLoading = ref(true); // 認証チェックローディング状態フラグ (リアクティブな参照)

// コンポーネントがマウントされた後の処理を定義
onMounted(() => { // コンポーネントマウント時のライフサイクルフック
  // マウント時点でユーザー情報が既に存在する (確定している) か、
  // または Supabase クライアントが利用不可 (初期化失敗など) の場合
  if (user.value !== undefined || !auth) { // ユーザー情報の値が undefined でない、または auth クライアントが存在しない場合
    // すでに認証状態が判明しているのでローディングを終了
    isAuthCheckLoading.value = false; // ローディング状態フラグを false に設定
  } else { // それ以外の場合 (ユーザー情報がまだ undefined)
    // まだユーザー情報が undefined (初期状態) の場合、watch での変更を待つ
    // watch コールバックが isAuthCheckLoading を false に設定する
  }
});

// user 状態の変化を監視するウォッチャーを設定
watch(user, (currentUser) => { // ユーザーオブジェクト (user) の変更を監視
  // ローディング中 (isAuthCheckLoading が true) で、
  // かつ user の値が undefined 以外 (null または User オブジェクト) になった場合
  if (isAuthCheckLoading.value && currentUser !== undefined) { // ローディング中で、かつ currentUser が undefined でない場合
    // 認証状態が確定したのでローディングを終了
    isAuthCheckLoading.value = false; // ローディング状態フラグを false に設定
  }
}, { immediate: false }); // immediate: false で初期値での発火を防ぎ、マウント後の変更のみを監視

// ログアウトボタンがクリックされたときの処理を定義する非同期関数
const handleLogout = async () => { // ログアウト処理を実行する非同期関数
  // Supabase クライアントが利用可能かチェック
  if (!auth) { // auth クライアントが存在しない場合
    // ★理由: Supabase クライアントが初期化されていないなどの異常系デバッグのため
    console.error('ログアウトエラー: Supabase client is not available.'); // エラーログ: Supabaseクライアントが見つからない (デバッグ用)
    // UIにエラーを表示する処理 (例: トースト通知) - 現在はコメントアウト
    // useToast().add({ title: 'エラー', description: 'ログアウトに失敗しました。', color: 'red' });
    return; // 処理を中断
  }
  // Supabase のログアウト処理を実行
  const { error } = await auth.signOut(); // Supabase Auth の signOut メソッドを呼び出し、結果を分割代入で取得
  // ログアウト処理中にエラーが発生した場合
  if (error) { // signOut でエラーが発生した場合
    // ★理由: Supabase API から返されたログアウトエラーの詳細をデバッグするため
    console.error('ログアウトエラー:', error.stack || error); // エラーログ: ログアウト処理失敗 (デバッグ用、スタックトレースまたはエラーメッセージ)
    // UIにエラーを表示する処理 (例: トースト通知) - 現在はコメントアウト
    // useToast().add({ title: 'エラー', description: `ログアウトに失敗しました: ${error.message}`, color: 'red' });
  } else { // ログアウトが成功した場合
    // ログアウト成功後、ログインページにリダイレクト
    // 未ログイン状態のナビゲーションが即座に表示されるはず
    router.push('/login'); // ログインページへ画面遷移
  }
};
</script>

<style scoped>
/* スコープ付きスタイル定義開始 */
/* Tailwind CSS を使用しているため、スコープ付きスタイルは通常不要 */
/* 必要に応じて、特定の要素に対する微調整などをここに追加 */
/* スタイル定義終了 */
</style> 