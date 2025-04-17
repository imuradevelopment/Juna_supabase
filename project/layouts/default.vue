<template>
  <div class="flex flex-col min-h-screen bg-primary-100 text-gray-700" data-testid="default-layout">
    <header class="bg-primary-300 text-secondary-500 shadow-md p-4 flex justify-between items-center" data-testid="header">
      <!-- ヘッダーコンテンツ（例：ロゴ、ナビゲーション） -->
      <NuxtLink to="/" class="text-xl font-bold hover:text-secondary-700" data-testid="header-home-link">
        Blog
      </NuxtLink>
      <nav data-testid="header-nav">
        <ul class="flex space-x-4 items-center">
          <!-- ログイン状態に応じて表示を切り替え (v-else-if を v-if に変更) -->
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
          <!-- ローディング中は何も表示しないか、別のシンプルな表示をしても良い -->
          <li v-else></li>
        </ul>
      </nav>
    </header>

    <!-- ★ メインコンテンツの表示を isAuthCheckLoading で制御 -->
    <main v-if="!isAuthCheckLoading" class="flex-grow container mx-auto p-6" data-testid="main-content">
      <slot />
    </main>
    <!-- ★ ローディング中の表示を追加 -->
    <div v-else class="flex-grow container mx-auto p-6 flex justify-center items-center" data-testid="main-loading">
      <NuxtIcon name="svg-spinners:180-ring" class="w-10 h-10 text-secondary-500 animate-spin" />
    </div>

    <footer class="bg-primary-300 text-gray-500 p-4 text-center mt-auto" data-testid="footer">
      <!-- フッターコンテンツ -->
      <p>&copy; {{ new Date().getFullYear() }} Blog. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'; // ref, onMounted, watch をインポート
import type { Database } from '~/types/database';

// @ts-ignore Nuxtの自動インポート
const user = useSupabaseUser();
// @ts-ignore Nuxtの自動インポート
const supabase = useSupabaseClient<Database>();
// @ts-ignore Nuxtの自動インポート
const router = useRouter();

const isAuthCheckLoading = ref(true);

onMounted(() => {
  if (user.value !== undefined || !supabase) {
    isAuthCheckLoading.value = false;
    console.log('[Layout] Auth check loading finished on mount. User exists or supabase not ready.', user.value?.id);
  } else {
    console.log('[Layout] Waiting for initial auth check...');
  }
});

watch(user, (currentUser) => {
  if (isAuthCheckLoading.value && currentUser !== undefined) {
    isAuthCheckLoading.value = false;
    console.log('[Layout] Auth check loading finished via watch. User state determined.', currentUser?.id);
  }
}, { immediate: false });

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('ログアウトエラー:', error.stack || error);
    // エラーUI表示（例: トースト通知など）をここに追加
  } else {
    // ログアウト成功後、ログインページにリダイレクト
    // ログアウト時は isAuthCheckLoading は関係なく、すぐにログイン画面へのリンクが表示されるはず
    router.push('/login');
  }
};
</script>

<style scoped>
/* スコープ付きスタイルは Tailwind でカバーされるため基本不要 */
</style> 