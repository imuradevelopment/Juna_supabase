<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6">投稿一覧</h1>
    
    <!-- 検索フォーム -->
    <div class="mb-8 max-w-3xl mx-auto">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          class="w-full px-4 pr-10 py-3 rounded-full bg-gray-800 border border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30 text-white"
          placeholder="検索キーワードを入力してください"
          @input="debouncedSearch"
        />
        <button 
          @click="refreshData"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- フィルターとソート -->
    <div class="glass-card p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- カテゴリーフィルター -->
        <div class="w-full sm:w-auto">
          <label for="category-filter" class="block text-sm font-medium mb-1">カテゴリー</label>
          <select
            id="category-filter"
            v-model="selectedCategoryId"
            class="w-full sm:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">すべて</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <!-- 障害タイプフィルター -->
        <div class="w-full sm:w-auto">
          <label for="disability-filter" class="block text-sm font-medium mb-1">障害タイプ</label>
          <select
            id="disability-filter"
            v-model="selectedDisabilityType"
            class="w-full sm:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">すべて</option>
            <option v-for="type in disabilityTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </div>
        
        <!-- ソート -->
        <div class="w-full sm:w-auto">
          <label for="sort-order" class="block text-sm font-medium mb-1">並び順</label>
          <select
            id="sort-order"
            v-model="sortOrder"
            class="w-full sm:w-auto px-4 py-2 rounded border border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="created_at.desc">新しい順</option>
            <option value="created_at.asc">古い順</option>
            <option value="views.desc">閲覧数順</option>
            <option value="likes.desc">いいね数順</option>
          </select>
        </div>
        
        <!-- フィルターリセットボタン -->
        <div class="w-full sm:w-auto mt-auto ml-auto">
          <button @click="resetFilters" class="btn btn-ghost btn-sm">
            フィルターをリセット
          </button>
        </div>
      </div>
    </div>
    
    <!-- メインコンテンツ -->
    <div class="flex flex-col md:flex-row gap-8">
      <!-- カテゴリーサイドバー -->
      <div class="w-full md:w-1/4 lg:w-1/5">
        <div class="glass-card p-4 mb-6">
          <h2 class="text-xl font-bold mb-4">カテゴリー一覧</h2>
          
          <!-- カテゴリーローディング -->
          <div v-if="categoriesLoading" class="flex justify-center py-4">
            <div class="loader"></div>
          </div>
          
          <!-- カテゴリーエラー -->
          <div v-else-if="categoriesError" class="text-error text-sm mb-2">
            {{ categoriesError }}
            <button @click="fetchCategories" class="text-primary hover:underline ml-2">再試行</button>
          </div>
          
          <!-- カテゴリーリスト -->
          <div v-else-if="categories.length === 0" class="text-center text-gray-500 py-2">
            カテゴリーはまだありません
          </div>
          
          <div v-else class="space-y-2">
            <button 
              @click="selectCategory(null)" 
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="selectedCategoryId === null ? 'bg-primary/20 text-white' : 'hover:bg-gray-700/50'"
            >
              すべてのカテゴリー
            </button>
            <button 
              v-for="category in categories" 
              :key="category.id"
              @click="selectCategory(category.id)"
              class="w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center"
              :class="selectedCategoryId === category.id ? 'bg-primary/20 text-white' : 'hover:bg-gray-700/50'"
            >
              <span>{{ category.name }}</span>
              <span class="text-xs text-primary">{{ category.post_count || 0 }}</span>
            </button>
          </div>
        </div>
        
        <!-- 障害タイプサイドバー -->
        <div class="glass-card p-4">
          <h2 class="text-xl font-bold mb-4">障害タイプ</h2>
          
          <!-- 障害タイプローディング -->
          <div v-if="disabilityTypesLoading" class="flex justify-center py-4">
            <div class="loader"></div>
          </div>
          
          <!-- 障害タイプリスト -->
          <div v-else-if="disabilityTypes.length === 0" class="text-center text-gray-500 py-2">
            障害タイプはまだありません
          </div>
          
          <div v-else class="space-y-2">
            <button 
              @click="selectDisabilityType(null)" 
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="selectedDisabilityType === null ? 'bg-primary/20 text-white' : 'hover:bg-gray-700/50'"
            >
              すべてのタイプ
            </button>
            <button 
              v-for="type in disabilityTypes" 
              :key="type.id"
              @click="selectDisabilityType(type.id)"
              class="w-full text-left px-3 py-2 rounded-lg transition-colors"
              :class="selectedDisabilityType === type.id ? 'bg-primary/20 text-white' : 'hover:bg-gray-700/50'"
            >
              {{ type.name }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 検索結果/投稿一覧 -->
      <div class="w-full md:w-3/4 lg:w-4/5">
        <!-- 検索中ローディング -->
        <div v-if="loading" class="flex justify-center items-center h-32">
          <div class="loader"></div>
        </div>
        
        <!-- エラー表示 -->
        <div v-else-if="error" class="glass-card p-4 text-error">
          <p>{{ error }}</p>
          <button @click="refreshData" class="mt-2 btn btn-primary btn-sm">再試行</button>
        </div>
        
        <!-- 選択されたカテゴリータイトル -->
        <div v-else-if="selectedCategoryId && selectedCategory" class="mb-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">{{ selectedCategory.name }}</h2>
          </div>
          <p v-if="selectedCategory.description" class="text-gray-500 mt-2">
            {{ selectedCategory.description }}
          </p>
        </div>
        
        <!-- 検索キーワードがあれば表示 -->
        <div v-else-if="searchQuery.trim()" class="mb-6">
          <h2 class="text-2xl font-bold">「{{ searchQuery }}」の検索結果</h2>
        </div>
        
        <!-- 投稿が存在しない場合 -->
        <div v-if="!loading && posts.length === 0" class="glass-card p-8 text-center">
          <p v-if="searchQuery.trim() || selectedCategoryId || selectedDisabilityType" class="text-gray-500">
            条件に一致する投稿は見つかりませんでした
          </p>
          <p v-else class="text-gray-500">
            投稿がありません
          </p>
          <button v-if="searchQuery.trim() || selectedCategoryId || selectedDisabilityType" 
                  @click="resetFilters" 
                  class="mt-4 btn btn-primary">
            フィルターをリセット
          </button>
        </div>
        
        <!-- 投稿一覧 -->
        <div v-else-if="posts.length > 0">
          <div v-if="totalResults > 0" class="mb-2 text-sm text-gray-500">
            {{ totalResults }}件中 {{ startIndex + 1 }}～{{ endIndex }}件を表示
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PostCard 
              v-for="post in posts" 
              :key="post.id"
              :post="post"
              layout="vertical"
              :showStats="true"
              :hoverEffect="true"
              customClass="h-full"
            />
          </div>
          
          <!-- ページネーション -->
          <div v-if="totalPages > 1" class="flex justify-center mt-8">
            <div class="flex space-x-2">
              <button 
                @click="changePage(currentPage - 1)" 
                class="btn btn-sm btn-secondary"
                :disabled="currentPage === 1"
              >
                前へ
              </button>
              
              <button
                v-for="page in getPageNumbers()"
                :key="page"
                @click="changePage(Number(page))"
                class="btn btn-sm"
                :class="currentPage === page ? 'btn-primary' : 'btn-secondary'"
              >
                {{ page }}
              </button>
              
              <button 
                @click="changePage(currentPage + 1)" 
                class="btn btn-sm btn-secondary"
                :disabled="currentPage === totalPages"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { supabase } from '@/lib/supabase';
import PostCard from '../components/common/PostCard.vue';

// カテゴリーの型定義
interface Category {
  id: number;
  name: string;
  description: string | null;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 障害タイプの型定義
interface DisabilityType {
  id: number;
  name: string;
  description?: string | null;
}

// 検索結果の型定義
interface PostResult {
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
  like_count?: number;
}

// 状態管理
const searchQuery = ref('');
const posts = ref<PostResult[]>([]);
const categories = ref<Category[]>([]);
const disabilityTypes = ref<DisabilityType[]>([]);
const selectedCategoryId = ref<number | null>(null);
const selectedCategory = ref<Category | null>(null);
const selectedDisabilityType = ref<number | null>(null);
const sortOrder = ref('created_at.desc');

// ローディング状態
const loading = ref(false);
const categoriesLoading = ref(false);
const disabilityTypesLoading = ref(false);
const error = ref('');
const categoriesError = ref('');
const isSearching = ref(false);

// ページネーション関連
const pageSize = 10;
const currentPage = ref(1);
const totalResults = ref(0);
const startIndex = computed(() => (currentPage.value - 1) * pageSize);
const endIndex = computed(() => Math.min(startIndex.value + pageSize, totalResults.value));
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize));

// ルート・ルーターの取得
const route = useRoute();
const router = useRouter();

// 初期化
onMounted(() => {
  // データの取得
  fetchCategories();
  fetchDisabilityTypes();
  
  // URLからクエリパラメータを取得
  const query = route.query.q as string;
  const page = parseInt(route.query.page as string) || 1;
  const categoryId = route.query.category ? parseInt(route.query.category as string) : null;
  const disabilityTypeId = route.query.disability_type ? parseInt(route.query.disability_type as string) : null;
  const sort = route.query.sort as string || 'created_at.desc';
  
  searchQuery.value = query || '';
  currentPage.value = page;
  selectedCategoryId.value = categoryId;
  selectedDisabilityType.value = disabilityTypeId;
  sortOrder.value = sort;
  
  if (categoryId) {
    fetchCategoryDetails(categoryId);
  }
  
  // 検索またはフィルターがある場合はデータを取得
  refreshData();
});

// 検索クエリが変更されたらURLを更新
watch(searchQuery, () => {
  if (!isSearching.value) {
    updateQueryParams();
    currentPage.value = 1;
  }
});

// フィルターやソートが変更されたらURLを更新
watch([selectedCategoryId, selectedDisabilityType, sortOrder], () => {
  updateQueryParams();
  currentPage.value = 1;
  
  if (selectedCategoryId.value) {
    fetchCategoryDetails(selectedCategoryId.value);
  } else {
    selectedCategory.value = null;
  }
  
  refreshData();
});

// ページが変更されたらURLを更新
watch(currentPage, () => {
  updateQueryParams();
});

// URLパラメータを更新
function updateQueryParams() {
  const query: Record<string, string | undefined> = {};
  
  if (searchQuery.value.trim()) query.q = searchQuery.value;
  if (selectedCategoryId.value) query.category = selectedCategoryId.value.toString();
  if (selectedDisabilityType.value) query.disability_type = selectedDisabilityType.value.toString();
  if (sortOrder.value !== 'created_at.desc') query.sort = sortOrder.value;
  if (currentPage.value > 1) query.page = currentPage.value.toString();
  
  router.replace({ query });
}

// フィルターのリセット
function resetFilters() {
  searchQuery.value = '';
  selectedCategoryId.value = null;
  selectedDisabilityType.value = null;
  selectedCategory.value = null;
  sortOrder.value = 'created_at.desc';
  currentPage.value = 1;
  updateQueryParams();
  refreshData();
}

// カテゴリー一覧を取得
async function fetchCategories() {
  categoriesLoading.value = true;
  categoriesError.value = '';
  
  try {
    // カテゴリーの取得
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) throw categoriesError;
    
    // 各カテゴリーの投稿数を取得
    const categoriesWithPostCount = await Promise.all((categoriesData || []).map(async (category) => {
      const { count, error: countError } = await supabase
        .from('post_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
      
      if (countError) console.error(`カテゴリ ${category.id} の投稿数取得エラー:`, countError);
      
      return {
        ...category,
        post_count: count || 0
      };
    }));
    
    categories.value = categoriesWithPostCount;
  } catch (err: any) {
    console.error('カテゴリ取得エラー:', err);
    categoriesError.value = err.message || 'カテゴリーの読み込みに失敗しました';
  } finally {
    categoriesLoading.value = false;
  }
}

// 障害タイプ一覧を取得
async function fetchDisabilityTypes() {
  disabilityTypesLoading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('disability_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    disabilityTypes.value = data || [];
  } catch (err: any) {
    console.error('障害タイプ取得エラー:', err);
    // エラーは表示しない（UIに影響しないため）
  } finally {
    disabilityTypesLoading.value = false;
  }
}

// 選択されたカテゴリーの詳細を取得
async function fetchCategoryDetails(categoryId: number) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
      
    if (error) throw error;
    selectedCategory.value = data;
  } catch (err: any) {
    console.error('カテゴリー詳細取得エラー:', err);
    // エラーは表示しない（メインコンテンツのエラーと重複するため）
  }
}

// デバウンス処理された検索
const debouncedSearch = debounce(() => {
  updateQueryParams();
  refreshData();
}, 500);

// データ更新（検索または選択されたカテゴリーの投稿を取得）
async function refreshData() {
  loading.value = true;
  error.value = '';
  isSearching.value = true;
  
  try {
    // キーワード検索がある場合
    if (searchQuery.value.trim()) {
      await performSearch();
    } else {
      // フィルター検索または全投稿取得
      await fetchFilteredPosts();
    }
  } catch (err: any) {
    console.error('データ取得エラー:', err);
    error.value = err.message || 'データの読み込みに失敗しました';
    posts.value = [];
    totalResults.value = 0;
  } finally {
    loading.value = false;
    isSearching.value = false;
  }
}

// キーワード検索の実行
async function performSearch() {
  if (!searchQuery.value.trim()) {
    posts.value = [];
    totalResults.value = 0;
    return;
  }
  
  try {
    // SQLスキーマに合わせて修正：search_term のみを渡す
    const { data, error: searchError } = await supabase.rpc('search_posts', {
      search_term: searchQuery.value
    });
    
    if (searchError) throw searchError;
    
    if (data && data.length > 0) {
      let filteredData = data;
      
      // カテゴリでさらにフィルタリング
      if (selectedCategoryId.value) {
        const { data: postIds } = await supabase
          .from('post_categories')
          .select('post_id')
          .eq('category_id', selectedCategoryId.value);
          
        if (postIds && postIds.length > 0) {
          const postIdSet = new Set(postIds.map(p => p.post_id));
          filteredData = filteredData.filter((post: PostResult) => postIdSet.has(post.id));
        } else {
          posts.value = [];
          totalResults.value = 0;
          return;
        }
      }
      
      // 障害タイプでさらにフィルタリング
      if (selectedDisabilityType.value) {
        const { data: userIds } = await supabase
          .from('profiles')
          .select('id')
          .eq('disability_type_id', selectedDisabilityType.value);
          
        if (userIds && userIds.length > 0) {
          const userIdSet = new Set(userIds.map(u => u.id));
          filteredData = filteredData.filter((post: PostResult) => userIdSet.has(post.author_id));
        } else {
          posts.value = [];
          totalResults.value = 0;
          return;
        }
      }
      
      // ソート処理
      filteredData = sortPosts(filteredData);
      
      // プロフィール情報を取得してアバターURLを追加
      const resultsWithDetails = await Promise.all(filteredData.map(async (post: any) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_data, nickname')
          .eq('id', post.author_id)
          .single();
          
        // いいね数を取得
        const { count: likeCount, error: likeError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (likeError) console.error(`投稿 ${post.id} のいいね数取得エラー:`, likeError);
        
        return {
          ...post,
          avatar_url: profileData?.avatar_data || null,
          author_name: profileData?.nickname || '不明なユーザー',
          like_count: likeCount || 0
        };
      }));
      
      // クライアントサイドでページネーション処理
      const allResults = resultsWithDetails;
      totalResults.value = allResults.length;
      
      // 現在のページに表示する結果のみをフィルタリング
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      posts.value = allResults.slice(start, end);
    } else {
      posts.value = [];
      totalResults.value = 0;
    }
  } catch (err) {
    throw err;
  }
}

// フィルター適用した投稿を取得
async function fetchFilteredPosts() {
  try {
    // 基本クエリ
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('published', true);
    
    // カテゴリーによるフィルタリング
    if (selectedCategoryId.value) {
      const { data: postIds } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', selectedCategoryId.value);
      
      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds.map(p => p.post_id));
      } else {
        // カテゴリに一致する投稿がない場合
        posts.value = [];
        totalResults.value = 0;
        return;
      }
    }
    
    // 障害タイプによるフィルタリング
    if (selectedDisabilityType.value) {
      const { data: userIds } = await supabase
        .from('profiles')
        .select('id')
        .eq('disability_type_id', selectedDisabilityType.value);
        
      if (userIds && userIds.length > 0) {
        query = query.in('author_id', userIds.map(u => u.id));
      } else {
        // 障害タイプに一致するユーザーがない場合
        posts.value = [];
        totalResults.value = 0;
        return;
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
      case 'views.desc':
        query = query.order('views', { ascending: false });
        break;
      case 'likes.desc':
        query = query.order('like_count', { ascending: false, nullsFirst: false });
        break;
    }
    
    // ページネーション適用
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) throw fetchError;
    totalResults.value = count || 0;
    
    if (data) {
      // 投稿の詳細情報を取得（著者情報、いいね数）
      const postsWithDetails = await Promise.all(data.map(async (post) => {
        // プロフィール情報取得
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_data, nickname')
          .eq('id', post.author_id)
          .single();
        
        // いいね数を取得
        const { count, error: likeError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (likeError) console.error(`投稿 ${post.id} のいいね数取得エラー:`, likeError);
        
        return {
          ...post,
          avatar_url: profileData?.avatar_data || null,
          author_name: profileData?.nickname || '不明なユーザー',
          like_count: count || 0
        };
      }));
      
      posts.value = postsWithDetails;
    }
  } catch (err) {
    throw err;
  }
}

// 投稿ソート関数
function sortPosts(posts: any[]) {
  return [...posts].sort((a, b) => {
    switch (sortOrder.value) {
      case 'created_at.asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'views.desc':
        return (b.views || 0) - (a.views || 0);
      case 'likes.desc':
        return (b.like_count || 0) - (a.like_count || 0);
      case 'created_at.desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
}

// カテゴリーを選択
function selectCategory(categoryId: number | null) {
  selectedCategoryId.value = categoryId;
}

// 障害タイプを選択
function selectDisabilityType(typeId: number | null) {
  selectedDisabilityType.value = typeId;
}

// ページネーション
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  refreshData();
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
</script>

<style scoped>
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid rgb(var(--color-primary));
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.no-underline {
  text-decoration: none;
}

/* セレクトボックスの矢印 */
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

/* ボタンのサイズバリエーション追加 */
.btn-sm {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
}
</style> 