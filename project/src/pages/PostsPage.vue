<template>
  <div class="posts-page">
    <!-- ヘッダー -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold">投稿一覧</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        すべての投稿を見る
      </p>
    </div>
    
    <!-- フィルターとソート -->
    <div class="glass-card p-4 mb-8">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <!-- カテゴリーフィルター -->
        <div class="w-full md:w-auto">
          <label for="category-filter" class="block text-sm font-medium mb-1">カテゴリー</label>
          <select
            id="category-filter"
            v-model="selectedCategory"
            class="w-full md:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">すべて</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <!-- 障害タイプフィルター -->
        <div class="w-full md:w-auto">
          <label for="disability-filter" class="block text-sm font-medium mb-1">障害タイプ</label>
          <select
            id="disability-filter"
            v-model="selectedDisabilityType"
            class="w-full md:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">すべて</option>
            <option v-for="type in disabilityTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </div>
        
        <!-- ソート -->
        <div class="w-full md:w-auto">
          <label for="sort-order" class="block text-sm font-medium mb-1">並び順</label>
          <select
            id="sort-order"
            v-model="sortOrder"
            class="w-full md:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="created_at.desc">新しい順</option>
            <option value="created_at.asc">古い順</option>
            <option value="likes_count.desc">いいね数順</option>
            <option value="comments_count.desc">コメント数順</option>
            <option value="views.desc">閲覧数順</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 投稿リスト -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <div v-else-if="posts.length === 0" class="glass-card p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-xl font-medium mb-2">投稿が見つかりません</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        検索条件に一致する投稿はありません。フィルターを変更してみてください。
      </p>
      <button @click="resetFilters" class="btn btn-primary">フィルターをリセット</button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <PostCard 
        v-for="post in posts" 
        :key="post.id" 
        :post="post" 
        layout="vertical"
      />
    </div>
    
    <!-- ページネーション -->
    <div v-if="totalPages > 1" class="flex justify-center mt-8">
      <nav class="flex items-center space-x-2">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
        >
          前へ
        </button>
        
        <div class="flex space-x-1">
          <button 
            v-for="page in displayedPages" 
            :key="page" 
            @click="goToPage(page)"
            class="w-8 h-8 flex items-center justify-center rounded"
            :class="page === currentPage ? 'bg-primary text-white' : 'border border-gray-300 dark:border-gray-700'"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
        >
          次へ
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';
import PostCard from '../components/common/PostCard.vue';

// 状態
const posts = ref<any[]>([]);
const categories = ref<any[]>([]);
const disabilityTypes = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// フィルター状態
const selectedCategory = ref('');
const selectedDisabilityType = ref('');
const sortOrder = ref('created_at.desc');
const currentPage = ref(1);
const pageSize = 12;
const totalCount = ref(0);

// ルーターとルート
const route = useRoute();
const router = useRouter();

// URLクエリからフィルター状態を取得
function initFromQuery() {
  const { query } = route;
  
  selectedCategory.value = query.category as string || '';
  selectedDisabilityType.value = query.disability_type as string || '';
  sortOrder.value = query.sort as string || 'created_at.desc';
  currentPage.value = parseInt(query.page as string || '1', 10);
}

// フィルター変更時にURLを更新
function updateQueryParams() {
  const query: Record<string, string> = {};
  
  if (selectedCategory.value) query.category = selectedCategory.value;
  if (selectedDisabilityType.value) query.disability_type = selectedDisabilityType.value;
  if (sortOrder.value !== 'created_at.desc') query.sort = sortOrder.value;
  if (currentPage.value > 1) query.page = currentPage.value.toString();
  
  router.push({ query });
}

// フィルターのリセット
function resetFilters() {
  selectedCategory.value = '';
  selectedDisabilityType.value = '';
  sortOrder.value = 'created_at.desc';
  currentPage.value = 1;
  updateQueryParams();
}

// ページング
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize));

const displayedPages = computed(() => {
  const pages = [];
  const maxPagesToShow = 5;
  
  if (totalPages.value <= maxPagesToShow) {
    // すべてのページを表示
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // 一部のページを表示
    let startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    // 範囲調整
    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }
  
  return pages;
});

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    updateQueryParams();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    updateQueryParams();
  }
}

function goToPage(page: number) {
  currentPage.value = page;
  updateQueryParams();
}

// データ取得
async function fetchCategories() {
  try {
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (fetchError) throw fetchError;
    if (data) categories.value = data;
  } catch (err: any) {
    console.error('カテゴリー取得エラー:', err);
  }
}

async function fetchDisabilityTypes() {
  try {
    const { data, error: fetchError } = await supabase
      .from('disability_types')
      .select('*')
      .order('name');
    
    if (fetchError) throw fetchError;
    if (data) disabilityTypes.value = data;
  } catch (err: any) {
    console.error('障害タイプ取得エラー:', err);
  }
}

async function fetchPosts() {
  loading.value = true;
  error.value = null;
  
  try {
    // 投稿数をカウント（フィルター適用）
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('published', true);
    
    // 関連テーブルの結合とフィルタリング
    if (selectedCategory.value) {
      const { data: postIds } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', Number(selectedCategory.value));
      
      if (postIds && postIds.length > 0) {
        countQuery = countQuery.in('id', postIds.map(p => p.post_id));
      } else {
        // カテゴリに一致する投稿がない場合
        totalCount.value = 0;
        posts.value = [];
        loading.value = false;
        return;
      }
    }
    
    if (selectedDisabilityType.value) {
      const { data: userIds } = await supabase
        .from('profiles')
        .select('id')
        .eq('disability_type_id', Number(selectedDisabilityType.value));
        
      if (userIds && userIds.length > 0) {
        countQuery = countQuery.in('author_id', userIds.map(u => u.id));
      } else {
        // 障害タイプに一致するユーザーがない場合
        totalCount.value = 0;
        posts.value = [];
        loading.value = false;
        return;
      }
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
    totalCount.value = count || 0;
    
    // ページネーションの計算
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 基本クエリ
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          nickname,
          avatar_data
        )
      `)
      .eq('published', true);
    
    // カテゴリによるフィルタリング
    if (selectedCategory.value) {
      const { data: postIds } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', Number(selectedCategory.value));
      
      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds.map(p => p.post_id));
      }
    }
    
    // 障害タイプによるフィルタリング
    if (selectedDisabilityType.value) {
      const { data: userIds } = await supabase
        .from('profiles')
        .select('id')
        .eq('disability_type_id', Number(selectedDisabilityType.value));
        
      if (userIds && userIds.length > 0) {
        query = query.in('author_id', userIds.map(u => u.id));
      }
    }
    
    // ソート適用
    switch (sortOrder.value) {
      case 'created_at.desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'created_at.asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'likes_count.desc':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'comments_count.desc':
        query = query.order('comments_count', { ascending: false });
        break;
      case 'views.desc':
        query = query.order('views', { ascending: false });
        break;
    }
    
    // ページネーション適用
    const { data, error: fetchError } = await query.range(from, to);
    
    if (fetchError) throw fetchError;
    
    if (data) {
      // カテゴリ情報を取得
      const postsWithCategories = await Promise.all(data.map(async post => {
        const { data: categories } = await supabase
          .from('post_categories')
          .select('category_id, categories(*)')
          .eq('post_id', post.id);
        
        return {
          ...post,
          categories: categories?.map(c => c.categories) || []
        };
      }));
      
      posts.value = postsWithCategories;
    }
  } catch (err: any) {
    console.error('投稿取得エラー:', err);
    error.value = '投稿の読み込みに失敗しました';
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

// フィルター変更を監視
watch([selectedCategory, selectedDisabilityType, sortOrder], () => {
  currentPage.value = 1; // フィルター変更時は1ページ目に戻す
  updateQueryParams();
});

// URL変更を監視して再取得
watch(() => route.query, () => {
  initFromQuery();
  fetchPosts();
}, { deep: true });

// 初期化
onMounted(async () => {
  initFromQuery();
  await Promise.all([fetchCategories(), fetchDisabilityTypes()]);
  await fetchPosts();
});
</script>

<style scoped>
/* セレクトボックスの矢印を調整 */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* セレクトオプションのスタイリングを確保 */
select option {
  background-color: #1e293b;
  color: #f1f5f9;
}

/* フォーカス時の外観を改善 */
select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.3);
}
</style> 