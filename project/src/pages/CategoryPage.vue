<template>
  <div class="max-w-4xl mx-auto py-8">
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
      <button @click="fetchCategoryData" class="btn btn-primary">再試行</button>
      <div class="mt-4">
        <router-link to="/categories" class="btn btn-secondary">
          カテゴリー一覧に戻る
        </router-link>
      </div>
    </div>
    
    <!-- カテゴリー情報と投稿リスト -->
    <div v-else>
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">{{ category?.name }}</h1>
        <router-link to="/categories" class="btn btn-outline">
          カテゴリー一覧に戻る
        </router-link>
      </div>
      
      <p v-if="category?.description" class="text-gray-600 dark:text-gray-400 mb-8">
        {{ category.description }}
      </p>
      
      <h2 class="text-2xl font-semibold mb-4">投稿一覧</h2>
      
      <div v-if="posts.length === 0" class="glass-card p-8 text-center">
        <p class="text-gray-600 dark:text-gray-400">
          このカテゴリーにはまだ投稿がありません
        </p>
      </div>
      
      <div v-else class="space-y-6">
        <div v-for="post in posts" :key="post.id" class="glass-card p-6">
          <router-link :to="`/posts/${post.id}`" class="no-underline">
            <h3 class="text-xl font-bold mb-2 hover:text-primary hover:underline">{{ post.title }}</h3>
          </router-link>
          <p v-if="post.excerpt" class="text-gray-600 dark:text-gray-400 mb-4">
            {{ post.excerpt }}
          </p>
          <div class="flex justify-between items-center text-sm">
            <div class="text-gray-500">
              {{ new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP') }}
            </div>
            <div class="flex items-center space-x-3">
              <span class="flex items-center">
                <i class="fas fa-eye mr-1"></i> {{ post.views || 0 }}
              </span>
              <span class="flex items-center">
                <i class="fas fa-heart mr-1"></i> {{ post.like_count || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  created_at: string;
  published_at: string | null;
  views: number;
  like_count?: number;
  author_id: string;
}

const route = useRoute();
const categoryId = Number(route.params.id);

const category = ref<Category | null>(null);
const posts = ref<Post[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(() => {
  fetchCategoryData();
});

async function fetchCategoryData() {
  loading.value = true;
  error.value = '';
  
  try {
    // カテゴリー情報を取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    
    if (categoryError) throw categoryError;
    category.value = categoryData;
    
    // カテゴリーに属する投稿を取得
    // 修正: user_idではなくauthor_idを使用する
    await fetchPosts();
    
  } catch (err: any) {
    console.error('カテゴリーデータ取得エラー:', err);
    error.value = err.message || '投稿の読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

async function fetchPosts() {
  try {
    // クエリの修正: 正しいリレーションシップを使用
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories!inner(category_id)
      `)
      .eq('post_categories.category_id', categoryId)
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (postsError) throw postsError;
    
    // いいね数を取得
    const postsWithLikes = await Promise.all((postsData || []).map(async (post) => {
      const { count, error: likeError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      if (likeError) console.error(`投稿 ${post.id} のいいね数取得エラー:`, likeError);
      
      return {
        ...post,
        like_count: count || 0
      };
    }));
    
    posts.value = postsWithLikes;
  } catch (err: any) {
    console.error('投稿取得エラー:', err);
    throw err;
  }
}
</script>

<style scoped>
.no-underline {
  text-decoration: none;
}
</style> 