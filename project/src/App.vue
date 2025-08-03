<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <!-- 背景装飾 -->
    <div class="pointer-events-none fixed inset-0 z-0">
      <div class="absolute top-0 right-0 h-1/3 w-1/3 rounded-full bg-primary/5 blur-3xl shadow-primary/20"></div>
      <div class="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-primary/5 blur-3xl shadow-primary/20"></div>
    </div>
    
    <Navbar />
    
    <main class="container relative z-10 mx-auto flex-1 px-5 py-8">
      <div v-if="initialAuthCheckComplete">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <div v-else class="flex h-full items-center justify-center">
        <!-- 認証初期化中のローディング表示 -->
        <div class="flex flex-col items-center">
          <PhSpinner class="mb-4 h-12 w-12 animate-spin text-primary" />
          <div class="text-text-muted">読み込み中...</div>
        </div>
      </div>
    </main>
    
    <Footer />
    
    <!-- 通知コンポーネント -->
    <Notifications ref="notificationsRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeMount, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import { useSettingsStore } from './stores/settings';
import { useNotification } from './composables/useNotification';
import Navbar from './components/App/Navbar.vue';
import Footer from './components/App/Footer.vue';
import Notifications from './components/App/Notifications.vue';
import { PhSpinner } from '@phosphor-icons/vue';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const notificationsRef = ref<any>(null);
const initialAuthCheckComplete = ref(false);
const { setNotificationsRef, clearAllNotifications } = useNotification();

// アプリケーション初期化前に認証状態をチェック
onBeforeMount(async () => {
  // 設定はmain.tsで既に取得済みなので、ここでは再取得しない
  // ストアの状態のみ同期
  await settingsStore.fetchSettings();
  
  // ログイン状態の確認
  await authStore.checkSession();
  initialAuthCheckComplete.value = true;
});

// サイト名の変更を監視してタイトルを更新
watch(() => settingsStore.siteName, (newSiteName) => {
  if (newSiteName) {
    document.title = newSiteName;
  }
});

// ファビコンの変更を監視して更新
watch(() => settingsStore.siteMetadata?.faviconBase64, (newFavicon) => {
  if (newFavicon) {
    // 既存のファビコンリンクを取得または作成
    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    
    // Base64データをファビコンとして設定
    faviconLink.href = newFavicon;
    faviconLink.type = 'image/x-icon';
  }
});

// 初期化
onMounted(async () => {
  // 通知コンポーネントの参照が解決されるまで待機
  await nextTick();
  
  // 通知コンポーネントの参照を設定
  setNotificationsRef(notificationsRef.value);
  
  // 既存の通知をクリアする
  clearAllNotifications();
  
  // リアルタイム設定更新の購読
  settingsStore.subscribeToSettings();
  
  // 初期タイトルを設定
  if (settingsStore.siteName) {
    document.title = settingsStore.siteName;
  }
  
  // 初期ファビコンを設定
  if (settingsStore.siteMetadata?.faviconBase64) {
    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = settingsStore.siteMetadata.faviconBase64;
    faviconLink.type = 'image/x-icon';
  }
});
</script>

<style lang="postcss">
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-background;
}

::-webkit-scrollbar-thumb {
  @apply bg-secondary;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-primary;
}
</style> 