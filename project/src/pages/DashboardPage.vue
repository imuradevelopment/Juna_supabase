<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold mb-8">ダッシュボード</h1>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card p-8 flex justify-center items-center">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    </div>
    
    <!-- メインコンテンツ -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- サイドナビゲーション -->
      <div class="md:col-span-1">
        <div class="glass-card p-4 sticky top-24">
          <h2 class="text-xl font-bold mb-4">メニュー</h2>
          <nav class="space-y-2">
            <button 
              @click="activeTab = 'posts'" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="activeTab === 'posts' ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                投稿管理
              </div>
            </button>
            <button 
              @click="activeTab = 'drafts'" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="activeTab === 'drafts' ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                下書き
              </div>
            </button>
            <button 
              @click="activeTab = 'comments'" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="activeTab === 'comments' ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                コメント
              </div>
            </button>
            <button 
              @click="activeTab = 'likes'" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="activeTab === 'likes' ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                いいね
              </div>
            </button>
            <button 
              @click="activeTab = 'stats'" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="activeTab === 'stats' ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                統計
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      <!-- メインコンテンツエリア -->
      <div class="md:col-span-2">
        <!-- 投稿管理 -->
        <DashboardPostsList v-if="activeTab === 'posts'" />
        
        <!-- 下書き -->
        <DashboardDraftsList v-else-if="activeTab === 'drafts'" />
        
        <!-- コメント -->
        <DashboardCommentsList v-else-if="activeTab === 'comments'" />
        
        <!-- いいね -->
        <DashboardLikesList v-else-if="activeTab === 'likes'" />
        
        <!-- 統計 -->
        <DashboardStatistics v-else-if="activeTab === 'stats'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import DashboardPostsList from '../components/dashboard/DashboardPostsList.vue';
import DashboardDraftsList from '../components/dashboard/DashboardDraftsList.vue';
import DashboardCommentsList from '../components/dashboard/DashboardCommentsList.vue';
import DashboardLikesList from '../components/dashboard/DashboardLikesList.vue';
import DashboardStatistics from '../components/dashboard/DashboardStatistics.vue';

const router = useRouter();
const authStore = useAuthStore();

// 状態
const activeTab = ref('posts');
const loading = ref(true);

// 認証チェック
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  loading.value = false;
});
</script> 