<template>
  <div class="flex flex-col min-h-screen tech-dark-theme relative">
    <!-- 背景装飾 -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full filter blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full filter blur-3xl"></div>
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
    
    <!-- デバッグビューを追加 -->
    <!-- <div v-if="isDevMode" class="fixed bottom-20 left-4 bg-gray-800 text-white p-2 z-50 rounded">
      <button @click="clearAllNotifications">通知をクリア</button>
    </div> -->
    
    <!-- 通知コンポーネントの disabled フラグを追加 -->
    <Notifications ref="notificationsRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, provide } from 'vue';
import { useAuthStore } from './stores/auth';
import Navbar from './components/layout/Navbar.vue';
import Footer from './components/layout/Footer.vue';
import Notifications from './components/common/Notifications.vue';
// 使用していないようなので削除
// import Toast from './components/ui/Toast.vue';

const authStore = useAuthStore();
const notificationsRef = ref<any>(null);
// const isDevMode = ref(process.env.NODE_ENV === 'development');

// 削除: 不要なトースト関連の変数
// const showToast = ref(false);
// const toastMessage = ref('');
// const toastType = ref<'success' | 'error' | 'info'>('info');

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

// デバッグ用関数
/*
function clearAllNotifications() {
  if (notificationsRef.value) {
    const notifications = notificationsRef.value.notifications;
    for (const notification of notifications) {
      notificationsRef.value.removeNotification(notification.id);
    }
  }
}
*/

// 修正: トースト表示関数もコメントアウト
/*
provide('showToast', (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
});
*/

// 初期化
onMounted(async () => {
  // ログイン状態の確認
  await authStore.checkSession();
  
  // 通知コンポーネントの参照が解決されるまで待機
  await nextTick();
  
  // 既存の通知をクリアする - より直接的なアプローチ
  if (notificationsRef.value) {
    // clearAllNotificationsを直接使用
    if (typeof notificationsRef.value.clearAllNotifications === 'function') {
      notificationsRef.value.clearAllNotifications();
    } 
    // 互換性コードは削除 - 旧バージョンのことは考慮不要とのこと
    else {
      console.warn('clearAllNotifications method not available');
    }
  }
});
</script>

<style>
/* 既存のスタイルに加えて、ページ遷移アニメーションを強化 */
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
  background-color: var(--bg-color);
  min-height: 100vh;
  position: relative;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* スクロールバーのカスタマイズ */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--bg-color);
}

::-webkit-scrollbar-thumb {
  background: var(--primary-dark);
  border-radius: 6px;
  border: 3px solid var(--bg-color);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --secondary-color: #64748b;
  --background-color: #f8fafc;
  --content-background: #ffffff;
  --text-color: #1e293b;
  --heading-color: #0f172a;
  --border-color: #e2e8f0;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.5;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}

.content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--heading-color);
  margin-bottom: 1rem;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
}
</style> 