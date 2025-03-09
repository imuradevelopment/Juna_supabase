<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold mb-6">検索結果</h1>
    
    <!-- 検索フォーム -->
    <div class="mb-8 max-w-2xl mx-auto">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          class="w-full px-4 pr-10 py-3 rounded-full bg-gray-800 border border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 text-white"
          placeholder="検索キーワードを入力してください"
          @input="debouncedSearch"
        />
        <button 
          @click="performSearch"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- ローディング表示 -->
    <div v-if="loading" class="flex justify-center items-center h-32">
      <div class="loader"></div>
    </div>
    
    <!-- エラー表示 -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <p>{{ error }}</p>
      <button @click="performSearch" class="mt-2 btn btn-primary btn-sm">再試行</button>
    </div>
    
    <!-- 検索が空の場合 -->
    <div v-else-if="!searchQuery.trim()">
      <p class="text-center text-gray-600 dark:text-gray-400">検索キーワードを入力してください</p>
    </div>
    
    <!-- 検索結果がない場合 -->
    <div v-else-if="searchQuery.trim() && !loading && results.length === 0">
      <p class="text-center text-gray-600 dark:text-gray-400">
        「{{ searchQuery }}」に一致する結果は見つかりませんでした
      </p>
    </div>
    
    <!-- 検索結果表示 -->
    <div v-else>
      <div class="mb-4">
        <p class="text-gray-600 dark:text-gray-400">
          「{{ searchQuery }}」の検索結果: {{ totalResults }} 件中 {{ startIndex + 1 }}～{{ endIndex }} 件を表示
        </p>
      </div>
      
      <div class="space-y-4">
        <PostCardHorizontal v-for="post in results" :key="post.id" :post="post">
          <div class="flex items-center">
            <div class="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-white mr-2">
              <img 
                v-if="post.avatar_url" 
                :src="getAvatarUrl(post.avatar_url)" 
                :alt="post.author_name || '不明なユーザー'"
                class="w-full h-full rounded-full object-cover"
              />
              <span v-else>{{ getInitials(post.author_name || '?') }}</span>
            </div>
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ post.author_name }}</span>
          </div>
        </PostCardHorizontal>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="flex space-x-2">
          <button 
            @click="changePage(currentPage - 1)" 
            class="btn btn-sm btn-outline"
            :disabled="currentPage === 1"
          >
            前へ
          </button>
          
          <button
            v-for="page in getPageNumbers()"
            :key="page"
            @click="changePage(Number(page))"
            class="btn btn-sm"
            :class="currentPage === page ? 'btn-primary' : 'btn-outline'"
          >
            {{ page }}
          </button>
          
          <button 
            @click="changePage(currentPage + 1)" 
            class="btn btn-sm btn-outline"
            :disabled="currentPage === totalPages"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import PostCardHorizontal from '@/components/post/PostCardHorizontal.vue';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// 検索結果の型定義
interface SearchResult {
  id: string;
  author_id: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  published_at: string | null;
  created_at: string;
  views: number;
  author_name?: string;
  avatar_url?: string | null;
}

// 検索関連の状態
const searchQuery = ref('');
const results = ref<SearchResult[]>([]);
const totalResults = ref(0);
const loading = ref(false);
const error = ref('');
const isSearching = ref(false);

// ページネーション関連
const pageSize = 10;
const currentPage = ref(1);
const startIndex = computed(() => (currentPage.value - 1) * pageSize);
const endIndex = computed(() => Math.min(startIndex.value + pageSize, totalResults.value));
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize));

// ルート・ルーターの取得
const route = useRoute();
const router = useRouter();

// 初期化
onMounted(() => {
  // URLからクエリパラメータを取得
  const query = route.query.q as string;
  const page = parseInt(route.query.page as string) || 1;
  
  if (query) {
    searchQuery.value = query;
    currentPage.value = page;
    performSearch();
  }
});

// 検索クエリが変更されたらURLを更新
watch(searchQuery, () => {
  if (!isSearching.value) {
    router.replace({
      query: { 
        ...route.query,
        q: searchQuery.value,
        page: '1'
      }
    });
    currentPage.value = 1;
  }
});

// ページが変更されたらURLを更新
watch(currentPage, () => {
  router.replace({
    query: { 
      ...route.query,
      page: currentPage.value.toString() 
    }
  });
});

// デバウンス処理された検索
const debouncedSearch = debounce(() => {
  if (searchQuery.value.trim().length > 0) {
    performSearch();
  } else {
    results.value = [];
    totalResults.value = 0;
  }
}, 500);

// 検索実行
async function performSearch() {
  if (!searchQuery.value.trim()) {
    isSearching.value = false;
    return;
  }
  
  loading.value = true;
  isSearching.value = true;
  error.value = '';
  
  try {
    // SQLスキーマに合わせて修正：search_term のみを渡す
    const { data, error: searchError } = await supabase.rpc('search_posts', {
      search_term: searchQuery.value
    });
    
    if (searchError) throw searchError;
    
    if (data && data.length > 0) {
      // プロフィール情報を取得してアバターURLを追加
      const resultsWithAvatars = await Promise.all(data.map(async (post: Database['public']['Tables']['posts']['Row']) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_data, nickname')
          .eq('id', post.author_id)
          .single();
          
        return {
          ...post,
          avatar_url: profileData?.avatar_data || null,
          author_name: profileData?.nickname || '不明なユーザー'
        };
      }));
      
      // クライアントサイドでページネーション処理
      const allResults = resultsWithAvatars;
      totalResults.value = allResults.length;
      
      // 現在のページに表示する結果のみをフィルタリング
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      results.value = allResults.slice(start, end);
    } else {
      results.value = [];
      totalResults.value = 0;
    }
  } catch (err: any) {
    console.error('検索エラー:', err);
    error.value = err.message || '検索に失敗しました';
  } finally {
    loading.value = false;
    isSearching.value = false;
  }
}

// ページネーション
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  performSearch();
}

// ページ番号の配列を取得
function getPageNumbers(): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisiblePages = 5;
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage.value >= totalPages.value - 2) {
      for (let i = totalPages.value - 4; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage.value - 2; i <= currentPage.value + 2; i++) {
        pages.push(i);
      }
    }
  }
  
  return pages;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getAvatarUrl(path: string | null): string {
  if (!path) return '';
  // データがJSON形式で保存されている可能性がある場合の処理
  try {
    const avatarData = JSON.parse(path);
    if (avatarData && avatarData.path) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile_images/${avatarData.path}`;
    }
  } catch (e) {
    // JSONでない場合はそのまま使用
  }
  
  return path.startsWith('http') ? path : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/profile_images/${path}`;
}
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 