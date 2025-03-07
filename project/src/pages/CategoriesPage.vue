<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-3xl font-bold mb-8">カテゴリー一覧</h1>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card p-8 flex justify-center">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    </div>
    
    <!-- エラー表示 -->
    <div v-else-if="error" class="glass-card p-8 text-center">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button @click="fetchCategories" class="btn btn-primary">再試行</button>
    </div>
    
    <!-- カテゴリーリスト -->
    <div v-else-if="categories.length === 0" class="glass-card p-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">
        カテゴリーはまだありません
      </p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <router-link 
        v-for="category in categories" 
        :key="category.id"
        :to="`/categories/${category.id}`"
        class="glass-card p-6 border border-transparent hover:bg-primary/15 dark:hover:bg-primary/25 hover:border-primary/50 transition-all duration-200 no-underline"
      >
        <h2 class="text-xl font-bold mb-2 hover:text-primary-light hover:underline">{{ category.name }}</h2>
        <p v-if="category.description" class="text-gray-600 dark:text-gray-400 mb-4">
          {{ category.description }}
        </p>
        <div class="text-primary text-sm">
          {{ category.post_count || 0 }} 件の投稿
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';

interface Category {
  id: number;
  name: string;
  description: string | null;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 状態
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref('');

// 初期化
onMounted(() => {
  fetchCategories();
});

// カテゴリ一覧取得
async function fetchCategories() {
  loading.value = true;
  error.value = '';
  
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
    error.value = err.message || 'カテゴリーの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* アンダーライン関連のスタイルを追加 */
.no-underline {
  text-decoration: none;
}

.no-underline:hover p,
.no-underline:hover div {
  text-decoration: none;
}
</style> 