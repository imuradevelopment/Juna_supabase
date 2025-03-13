<template>
  <div class="flex flex-col min-h-screen tech-dark-theme relative">
    <!-- 背景装飾 -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl"></div>
    </div>
    
    <Navbar />
    
    <main class="flex-1 container mx-auto px-5 py-8 relative z-10">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <Footer />
    
    <!-- 通知コンポーネント -->
    <Notifications ref="notificationsRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, provide } from 'vue';
import { useAuthStore } from './stores/auth';
import Navbar from './components/App/Navbar.vue';
import Footer from './components/App/Footer.vue';
import Notifications from './components/App/Notifications.vue';

const authStore = useAuthStore();
const notificationsRef = ref<any>(null);

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

// 初期化
onMounted(async () => {
  // ログイン状態の確認
  await authStore.checkSession();
  
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

<style>
/* ページ遷移アニメーション */
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

.tech-dark-theme {
  background-color: rgb(var(--color-background));
  min-height: 100vh;
  position: relative;
}

/* スクロールバー */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-background);
}

::-webkit-scrollbar-thumb {
  background: var(--color-secondary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}
</style> 