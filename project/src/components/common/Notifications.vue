<template>
  <div class="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
    <transition-group name="notification">
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification glass-card p-4 shadow-lg flex"
        :class="{
          'bg-success-500 bg-opacity-10 border-success-500': notification.type === 'success',
          'bg-error-500 bg-opacity-10 border-error-500': notification.type === 'error',
          'bg-info-500 bg-opacity-10 border-info-500': notification.type === 'info',
          'bg-warning-500 bg-opacity-10 border-warning-500': notification.type === 'warning'
        }"
      >
        <!-- アイコン部分 -->
        <div class="mr-3">
          <!-- 成功アイコン -->
          <svg v-if="notification.type === 'success'" class="h-6 w-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <!-- エラーアイコン -->
          <svg v-else-if="notification.type === 'error'" class="h-6 w-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <!-- 情報アイコン -->
          <svg v-else-if="notification.type === 'info'" class="h-6 w-6 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <!-- 警告アイコン -->
          <svg v-else class="h-6 w-6 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <!-- テキスト部分 -->
        <div class="flex-1">
          <h4 class="font-medium text-sm">{{ notification.title }}</h4>
          <p class="text-sm opacity-90">{{ notification.message }}</p>
        </div>
        
        <!-- 閉じるボタン -->
        <button 
          @click="removeNotification(notification.id)" 
          class="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from 'vue';

// 通知の型定義
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timeout?: number;
}

// 通知の表示時間（ミリ秒）
const DEFAULT_TIMEOUT = 5000;

// 通知リスト
const notifications = ref<Notification[]>([]);

// 通知の追加
function addNotification(notification: Omit<Notification, 'id'>) {
  const id = Date.now().toString();
  const newNotification = {
    id,
    ...notification,
    timeout: notification.timeout || DEFAULT_TIMEOUT
  };
  
  notifications.value.push(newNotification);
  
  // タイムアウト後に自動的に閉じる
  setTimeout(() => {
    removeNotification(id);
  }, newNotification.timeout);
}

// 通知の削除
function removeNotification(id: string) {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
}

// すべての通知をクリア
function clearAllNotifications() {
  notifications.value = [];
}

// コンポーネント外部から呼び出せるようにメソッドを公開
defineExpose({
  addNotification,
  removeNotification,
  clearAllNotifications,
  notifications
});
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 