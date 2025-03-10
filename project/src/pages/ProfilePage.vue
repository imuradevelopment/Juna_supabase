<template>
  <div class="max-w-4xl mx-auto py-8">
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card p-8 flex justify-center items-center">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-400">読み込み中...</p>
      </div>
    </div>
    
    <!-- エラー表示 -->
    <div v-else-if="error" class="glass-card p-8 text-center">
      <svg class="h-16 w-16 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-2xl font-bold mb-2">エラーが発生しました</h2>
      <p class="text-gray-400 mb-4">{{ error }}</p>
      <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
    </div>
    
    <!-- プロフィール表示 -->
    <div v-else>
      <!-- プロフィールヘッダー - 視覚的改善 -->
      <div class="glass-card p-8 mb-8 relative overflow-hidden">
        <!-- 装飾的な背景要素 -->
        <div class="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/10 filter blur-3xl"></div>
        
        <div class="flex flex-col md:flex-row items-center md:items-start relative z-10">
          <!-- アバター - サイズ拡大と効果追加 -->
          <div class="w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary-light flex items-center justify-center text-white text-4xl overflow-hidden mb-6 md:mb-0 md:mr-8 ring-4 ring-primary-light/30 shadow-lg">
            <img 
              v-if="profile.avatar_data" 
              :src="getAvatarUrl(profile.avatar_data)" 
              :alt="profile.nickname"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ getInitials(profile.nickname) }}</span>
          </div>
          
          <!-- ユーザー情報 - レイアウト改善 -->
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-3xl font-bold mb-2 text-white">{{ profile.nickname }}</h1>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-400 mb-4 space-x-3">
              <p class="flex items-center">
                <span class="inline-block">@{{ profile.account_id }}</span>
              </p>
              <span class="hidden md:inline-block">•</span>
              <p>登録日: {{ formatDate(profile.created_at) }}</p>
            </div>
            
            <!-- 障害タイプ情報 - 表示形式を調整 -->
            <div v-if="profile.disability_types" class="mb-4">
              <span class="px-3 py-1 rounded-full bg-primary/20 text-primary-light text-sm">
                {{ profile.disability_types.name }}
              </span>
            </div>
            
            <!-- 自己紹介 -->
            <div v-if="profile.bio" class="mb-6">
              <h3 class="text-sm uppercase tracking-wide text-gray-400 mb-2">自己紹介</h3>
              <p class="text-gray-300 leading-relaxed">
                {{ profile.bio }}
              </p>
            </div>
            
            <!-- 障害に関する説明 -->
            <div v-if="profile.disability_description" class="mb-6">
              <h3 class="text-sm uppercase tracking-wide text-gray-400 mb-2">障害について</h3>
              <p class="text-gray-300 leading-relaxed">
                {{ profile.disability_description }}
              </p>
            </div>
            
            <!-- シェアボタン - 横並びの改善 -->
            <div class="flex flex-wrap gap-3 justify-center md:justify-start mt-6">
              <button 
                @click="shareProfile('twitter')" 
                class="btn-social bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
                X(Twitter)でシェア
              </button>
              
              <button 
                @click="shareProfile('facebook')" 
                class="btn-social bg-[#4267B2]/20 hover:bg-[#4267B2]/30 text-[#4267B2]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
                Facebookでシェア
              </button>
              
              <button 
                @click="copyProfileLink" 
                class="btn-social bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                リンクをコピー
              </button>
            </div>
            
            <!-- 編集/ダッシュボードボタン - 自分のプロフィールのみ -->
            <div v-if="isOwnProfile" class="flex gap-3 justify-center md:justify-start mt-4">
              <router-link 
                to="/profile/edit" 
                class="btn btn-primary-outline px-4 py-2"
              >
                プロフィールを編集
              </router-link>
              
              <router-link 
                to="/dashboard" 
                class="btn btn-secondary-outline px-4 py-2"
              >
                ダッシュボードを表示
              </router-link>
              
              <!-- 削除ボタンを追加 -->
              <button 
                @click="showDeleteConfirmation = true" 
                class="btn btn-danger-outline px-4 py-2"
              >
                プロフィールを削除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 投稿一覧セクション - 視覚的改善 -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          投稿一覧
        </h2>
        
        <div v-if="posts.length === 0" class="glass-card p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500 mb-3">まだ投稿がありません</p>
          <div v-if="isOwnProfile">
            <router-link to="/create-post" class="btn btn-primary">
              最初の投稿を作成
            </router-link>
          </div>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PostCard 
            v-for="post in posts" 
            :key="post.id" 
            :post="post" 
            layout="vertical"
          />
        </div>
      </div>
      
      <!-- カテゴリーセクション -->
      <div v-if="topCategories && topCategories.length > 0" class="mb-8">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          関連カテゴリー
        </h2>
        
        <div class="flex flex-wrap gap-3">
          <router-link 
            v-for="category in topCategories" 
            :key="category.id" 
            :to="`/categories/${category.id}`"
            class="px-4 py-2 rounded-full bg-primary/15 hover:bg-primary/25 text-primary-light transition-colors"
          >
            {{ category.name }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="glass-card p-6 max-w-md w-full">
        <h3 class="text-xl font-bold mb-4 text-red-400">プロフィール削除の確認</h3>
        
        <p class="mb-6 text-gray-300">
          プロフィールを削除すると、あなたの全ての投稿、コメント、いいねなども削除されます。
          この操作は元に戻せません。本当に削除しますか？
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="showDeleteConfirmation = false" 
            class="btn btn-secondary px-4 py-2"
          >
            キャンセル
          </button>
          
          <button 
            @click="deleteProfile" 
            class="btn btn-danger px-4 py-2"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting">削除中...</span>
            <span v-else>削除する</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { getProfileImageUrl } from '../lib/storage';
import PostCard from '../components/common/PostCard.vue';

// 通知機能を注入
const showNotification = inject('showNotification') as (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 状態
const profile = ref<any>({});
const posts = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = 10;
const totalPosts = ref(0);
const topCategories = ref<any[]>([]);
const showDeleteConfirmation = ref(false);
const isDeleting = ref(false);

// 計算プロパティ
const userId = computed(() => {
  return route.params.id as string || authStore.user?.id;
});

const isOwnProfile = computed(() => {
  return authStore.isAuthenticated && authStore.user?.id === userId.value;
});

// プロフィールデータの取得
async function fetchProfile() {
  loading.value = true;
  error.value = null;
  
  try {
    // userId が undefined の場合は自分のプロフィールを表示
    const id = userId.value || authStore.user?.id;
    
    if (!id) {
      error.value = 'ユーザーが見つかりません';
      loading.value = false;
      return;
    }
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*, disability_types:disability_type_id(*)')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!data) {
      error.value = 'プロフィールが見つかりません';
      return;
    }
    
    // データを設定
    profile.value = data;
    
    // 追加情報を取得
    await Promise.all([
      fetchPosts(),
      fetchTopCategories()
    ]);
    
  } catch (err: any) {
    console.error('プロフィール取得エラー:', err);
    error.value = 'プロフィールの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// 投稿一覧の取得
async function fetchPosts() {
  if (!userId.value) {
    console.error('ユーザーIDが不明です');
    error.value = 'ユーザー情報の取得に失敗しました';
    return;
  }

  try {
    // 投稿数を取得
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId.value)
      .eq('published', true);
    
    if (countError) throw countError;
    totalPosts.value = count || 0;
    
    // 投稿を取得（ページネーション対応）
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error: postsError } = await supabase
      .from('posts')
      .select('*, profiles:author_id(*)')
      .eq('author_id', userId.value)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (postsError) throw postsError;
    posts.value = data || [];
    
  } catch (err: any) {
    console.error('投稿取得エラー:', err);
    error.value = '投稿の読み込みに失敗しました';
  }
}

// よく使うカテゴリの取得を修正
async function fetchTopCategories() {
  if (!userId.value) return;
  
  try {
    // サブクエリを修正してユーザーの投稿IDを取得
    const { data: userPostIds } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId.value);
    
    if (!userPostIds || userPostIds.length === 0) {
      topCategories.value = [];
      return;
    }
    
    // 投稿IDの配列を作成
    const postIds = userPostIds.map(post => post.id);
    
    // カテゴリを取得
    const { data, error: categoriesError } = await supabase
      .from('post_categories')
      .select('category_id, categories(*)')
      .in('post_id', postIds)
      .limit(5);
    
    if (categoriesError) throw categoriesError;
    
    // カテゴリの重複を除去
    const uniqueCategories = data?.reduce((acc: any[], item: any) => {
      const exists = acc.some(cat => cat.id === item.categories.id);
      if (!exists) {
        acc.push(item.categories);
      }
      return acc;
    }, []);
    
    topCategories.value = uniqueCategories || [];
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
  }
}

// プロフィールをシェア
function shareProfile(platform: string) {
  const url = window.location.href;
  const title = `${profile.value.nickname || 'ユーザー'}のプロフィール | Juna`;
  
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  } else if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }
}

// プロフィールリンクをコピー
function copyProfileLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      alert('プロフィールのリンクがコピーされました');
    })
    .catch(err => {
      console.error('クリップボードコピーエラー:', err);
    });
}

// ヘルパー関数
function getInitials(name: string): string {
  return name?.charAt(0).toUpperCase() || '';
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

// ユーザーIDの変更を監視
watch(() => route.params.id, () => {
  fetchProfile();
});

// 初期化
onMounted(() => {
  fetchProfile();
});

// プロフィール削除処理
async function deleteProfile() {
  if (!authStore.user || !isOwnProfile.value) {
    return;
  }
  
  isDeleting.value = true;
  
  try {
    // アクセストークンの取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました');
    }
    
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
    }
    
    // Edge Functionを使用してユーザーを完全に削除
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId: authStore.user.id })
      }
    );
    
    // レスポンスのステータスコードをチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `サーバーエラー (${response.status}): ${errorData.error || '不明なエラー'}`
      );
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'アカウント削除に失敗しました');
    }
    
    // ログアウト処理を先に実行
    await supabase.auth.signOut({ scope: 'global' });
    
    // ストアの状態をクリア
    authStore.clearUser();
    
    // 削除成功メッセージを表示
    showNotification(
      'success', 
      'アカウント削除完了', 
      'アカウントとすべての関連データが正常に削除されました。'
    );
    
    // 少し遅延させてからリダイレクト（通知を表示する時間確保）
    setTimeout(() => {
      router.push('/');
      // 完全にリロードして状態をリセット
      setTimeout(() => window.location.reload(), 100);
    }, 500);
    
  } catch (err: any) {
    console.error('アカウント削除エラー:', err);
    // エラーメッセージを通知コンポーネントで表示
    showNotification(
      'error',
      'アカウント削除エラー',
      err.message || 'アカウントの削除中に問題が発生しました'
    );
    showDeleteConfirmation.value = false;
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped lang="postcss">
/* アバターのエフェクト */
.avatar-container {
  transition: transform 0.3s ease;
}

.avatar-container:hover {
  transform: scale(1.05);
}

/* ソーシャルボタン */
.btn-social {
  @apply flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm font-medium;
}

/* アウトラインボタン */
.btn-primary-outline {
  @apply rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors;
}

.btn-secondary-outline {
  @apply rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors;
}

/* 危険操作用ボタン */
.btn-danger-outline {
  @apply rounded-lg border border-red-500 text-red-400 hover:bg-red-500/10 transition-colors;
}

.btn-danger {
  @apply rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors;
}
</style> 