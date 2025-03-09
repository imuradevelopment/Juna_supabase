<template>
  <div class="home-page">
    <!-- ヒーローセクション - より魅力的に -->
    <section class="hero glass-card mb-10 p-8 md:p-12 rounded-2xl relative overflow-hidden">
      <!-- 装飾的な背景要素 -->
      <div class="absolute top-0 right-0 w-2/3 h-full opacity-15 pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
          <path fill="var(--primary-light)" d="M44.9,-76.2C58.3,-69.3,69.8,-58.3,78.1,-45C86.5,-31.7,91.8,-15.8,90.9,-0.5C90.1,14.8,83,29.7,74.4,43.4C65.8,57.2,55.6,69.9,42.2,77.8C28.8,85.7,14.4,88.7,-0.3,89.2C-15,89.7,-30.1,87.6,-41.9,79.5C-53.8,71.4,-62.4,57.1,-70.6,42.8C-78.8,28.5,-86.5,14.2,-88.5,-1.1C-90.5,-16.5,-86.8,-33,-78.2,-46.4C-69.5,-59.8,-55.9,-70.1,-41.6,-76.5C-27.3,-82.9,-13.6,-85.5,0.9,-87C15.4,-88.5,31.5,-89,44.9,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div class="max-w-3xl mx-auto text-center relative z-10">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 hero-title">見えない障害と共に生きる</h1>
        <p class="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">経験を共有し、互いに学び、支え合うコミュニティへようこそ</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
          <router-link 
            to="/create-post"
            class="btn-primary-gradient px-8 py-3 rounded-full text-white font-medium inline-flex items-center justify-center shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="inline-block align-middle">投稿を始める</span>
          </router-link>
          
          <router-link 
            to="/about"
            class="btn-secondary-outline px-8 py-3 rounded-full font-medium inline-flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="inline-block align-middle">詳しく見る</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- フィーチャー投稿 - グリッドレイアウト改善 -->
    <section class="mb-16">
      <div class="section-header flex items-center justify-between mb-8">
        <h2 class="text-2xl md:text-3xl font-bold flex items-center">
          <span class="inline-block w-2 h-6 bg-primary rounded-full mr-3"></span>
          注目の投稿
        </h2>
        <router-link to="/posts" class="text-primary-light hover:underline flex items-center">
          すべて見る
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </router-link>
      </div>
      
      <!-- ローディング状態 -->
      <div v-if="loading" class="flex justify-center py-8">
        <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- エラー表示 -->
      <div v-else-if="error" class="glass-card p-6 text-center">
        <p class="text-red-500">{{ error }}</p>
        <button @click="fetchFeaturedPosts" class="mt-4 btn btn-primary">再読み込み</button>
      </div>
      
      <!-- 投稿の表示 -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PostCard 
            v-for="post in featuredPosts" 
            :key="post.id" 
            :post="post"
            layout="vertical"
          />
        </div>
      </div>
    </section>

    <!-- カテゴリ一覧 - 修正済み、スタイル強化 -->
    <section class="mb-16">
      <div class="section-header flex items-center justify-between mb-8">
        <h2 class="text-2xl md:text-3xl font-bold flex items-center">
          <span class="inline-block w-2 h-6 bg-primary rounded-full mr-3"></span>
          カテゴリから探す
        </h2>
        <router-link to="/categories" class="text-primary-light hover:underline flex items-center">
          すべてのカテゴリ
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </router-link>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <CategoryCard 
          v-for="category in categories.slice(0, 4)" 
          :key="category.id" 
          :category="category" 
        />
      </div>
    </section>
    
    <!-- 最新の投稿 -->
    <section class="mb-10">
      <div class="section-header flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">最新の投稿</h2>
        <router-link to="/posts?sort=newest" class="text-primary hover:underline">すべて見る</router-link>
      </div>
      
      <div class="space-y-6">
        <PostCard 
          v-for="post in recentPosts" 
          :key="post.id" 
          :post="post"
          layout="horizontal"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import PostCard from '../components/post/PostCard.vue';
import CategoryCard from '../components/category/CategoryCard.vue';

// 投稿の型定義を修正
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  author_id: string;
  created_at: string;
  views: number;
  nickname?: string;
  avatar_data?: string | null;
  featured_image?: string | null;
}

// カテゴリの型定義を修正
interface Category {
  id: number;
  name: string;
  description?: string | null;
}

// 状態
const featuredPosts = ref<Post[]>([]);
const recentPosts = ref<Post[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// ページ読み込み時にデータを取得
onMounted(async () => {
  try {
    await Promise.all([
      fetchFeaturedPosts(),
      fetchRecentPosts(),
      fetchCategories()
    ]);
  } catch (err) {
    error.value = 'データの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
});

// 注目の投稿を取得
async function fetchFeaturedPosts() {
  try {
    const { data: postsData, error: fetchError } = await supabase
      .rpc('get_popular_posts', { limit_count: 6 });
    
    if (fetchError) throw fetchError;
    
    // プロフィール情報を取得
    if (postsData && postsData.length > 0) {
      const authorIds = postsData.map((post: any) => post.author_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_data')
        .in('id', authorIds);
        
      if (profilesError) throw profilesError;
      
      // 投稿データとプロフィールデータを結合
      featuredPosts.value = postsData.map((post: any) => {
        const profile = profilesData?.find(p => p.id === post.author_id);
        return {
          ...post,
          featured_image: post.cover_image_path, // 表示の互換性のため両方保持
          profiles: {
            nickname: profile?.nickname || '不明なユーザー',
            avatar_data: profile?.avatar_data || null
          }
        };
      });
    } else {
      featuredPosts.value = [];
    }
  } catch (err: any) {
    error.value = '投稿の読み込みに失敗しました';
  }
}

// 最新の投稿を取得
async function fetchRecentPosts() {
  try {
    // 再帰的な参照を避けるため、まずpostsのみを取得
    const { data: postsData, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, excerpt, cover_image_path, created_at, views, author_id')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (fetchError) throw fetchError;
    
    // 必要なprofiles情報を別途取得
    if (postsData && postsData.length > 0) {
      const authorIds = postsData.map(post => post.author_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_data')
        .in('id', authorIds);
        
      if (profilesError) throw profilesError;
      
      // データの結合
      recentPosts.value = postsData.map(post => {
        const profile = profilesData?.find(p => p.id === post.author_id);
        return {
          ...post,
          featured_image: post.cover_image_path,
          profiles: {
            nickname: profile?.nickname || '不明なユーザー',
            avatar_data: profile?.avatar_data || null
          }
        };
      });
    } else {
      recentPosts.value = [];
    }
  } catch (err: any) {
    // すでにエラー状態の場合は上書きしない
    if (!error.value) {
      error.value = '投稿の読み込みに失敗しました';
    }
  }
}

// カテゴリを取得
async function fetchCategories() {
  try {
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (fetchError) throw fetchError;
    categories.value = data || [];
  } catch (err: any) {
    // すでにエラー状態の場合は上書きしない
    if (!error.value) {
      error.value = 'カテゴリの読み込みに失敗しました';
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 2rem 0;
}

.hero {
  position: relative;
  overflow: hidden;
}

.hero-title {
  color: var(--primary-light);
  text-shadow: 0 0 20px rgba(196, 181, 253, 0.6);
  animation: fadeInUp 1s ease-out;
}

.btn-outline-light {
  position: relative;
  overflow: hidden;
}

.btn-outline-light::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 0;
  background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: height 0.5s ease, opacity 0.3s ease;
  z-index: -1;
  border-radius: 9999px;
}

.btn-outline-light:hover::after {
  height: 150%;
  opacity: 0.15;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* プライマリボタンのスタイル改善 */
.btn-primary-gradient {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
  box-shadow: 0 10px 20px -10px var(--primary-dark);
}

/* セカンダリボタンもプライマリカラーを使ったスタイルに変更 */
.btn-secondary-outline {
  border: 2px solid var(--primary); 
  color: var(--primary-light);
  background-color: rgba(139, 92, 246, 0.08);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary-outline:hover {
  background-color: rgba(139, 92, 246, 0.15);
  border-color: var(--primary-light);
  box-shadow: 0 0 15px rgba(196, 181, 253, 0.3);
}

/* レスポンシブ対応とアニメーション */
@media (max-width: 640px) {
  .btn-primary-gradient, 
  .btn-secondary-outline {
    width: 100%; /* モバイルでは幅いっぱい */
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 任意: 主要なCTAボタンに注目を集めるための控えめなアニメーション */
.btn-primary-gradient {
  animation: pulse 3s infinite ease-in-out;
}
</style> 