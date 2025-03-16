<template>
  <div class="flex flex-col min-h-screen relative bg-background">
    <!-- 背景装飾 -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl bg-primary/5 shadow-primary/20"></div>
      <div class="absolute bottom-0 left-0 w-1/2 h-1/2 rounded-full blur-3xl bg-primary/5 shadow-primary/20"></div>
    </div>
    
    <Navbar />
    
    <main class="flex-1 relative z-10 mx-auto px-5 py-8 container">
      <div v-if="initialAuthCheckComplete">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <div v-else class="flex justify-center items-center h-full">
        <!-- 認証初期化中のローディング表示 -->
        <div class="flex flex-col items-center">
          <PhSpinner class="w-12 h-12 mb-4 text-primary animate-spin" />
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
import { ref, onMounted, nextTick, provide, onBeforeMount } from 'vue';
import { useAuthStore } from './stores/auth';
import Navbar from './components/App/Navbar.vue';
import Footer from './components/App/Footer.vue';
import Notifications from './components/App/Notifications.vue';
import { PhSpinner } from '@phosphor-icons/vue';

const authStore = useAuthStore();
const notificationsRef = ref<any>(null);
const initialAuthCheckComplete = ref(false);

// 通知を表示する機能
function showNotification(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) {
  if (notificationsRef.value) {
    notificationsRef.value.addNotification({
      type,
      title,
      message
    });
  }
}

// この関数をコンポーネントから使用できるようにする
provide('showNotification', showNotification);

// アプリケーション初期化前に認証状態をチェック
onBeforeMount(async () => {
  // ログイン状態の確認
  await authStore.checkSession();
  initialAuthCheckComplete.value = true;
});

// 初期化
onMounted(async () => {
  // 通知コンポーネントの参照が解決されるまで待機
  await nextTick();
  
  // 既存の通知をクリアする
  if (notificationsRef.value) {
    // clearAllNotificationsを直接使用
    if (typeof notificationsRef.value.clearAllNotifications === 'function') {
      notificationsRef.value.clearAllNotifications();
    } 
    else {
      console.warn('clearAllNotifications method not available');
    }
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