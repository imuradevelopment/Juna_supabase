<template>
  <div class="p-8">
    <!-- ヒーローセクション - より魅力的に -->
    <section class="glass-card relative mb-10 overflow-hidden rounded-2xl p-8 md:p-12">
      <!-- 装飾的な背景要素 -->
      <div class="absolute top-0 right-0 h-full w-2/3 opacity-15 pointer-events-none">
        <svg class="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgb(var(--color-primary-light))" d="M44.9,-76.2C58.3,-69.3,69.8,-58.3,78.1,-45C86.5,-31.7,91.8,-15.8,90.9,-0.5C90.1,14.8,83,29.7,74.4,43.4C65.8,57.2,55.6,69.9,42.2,77.8C28.8,85.7,14.4,88.7,-0.3,89.2C-15,89.7,-30.1,87.6,-41.9,79.5C-53.8,71.4,-62.4,57.1,-70.6,42.8C-78.8,28.5,-86.5,14.2,-88.5,-1.1C-90.5,-16.5,-86.8,-33,-78.2,-46.4C-69.5,-59.8,-55.9,-70.1,-41.6,-76.5C-27.3,-82.9,-13.6,-85.5,0.9,-87C15.4,-88.5,31.5,-89,44.9,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <h1 class="animate-bounce mb-6 text-4xl font-bold text-[rgb(var(--color-primary-light))] md:text-6xl">見えない障害と共に生きる</h1>
        <p class="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[rgb(var(--color-text))] md:text-xl">経験を共有し、互いに学び、支え合うコミュニティへようこそ</p>
        <div class="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <router-link 
            to="/editor"
            class="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[rgb(var(--color-primary))] px-8 py-3 font-medium text-[rgb(var(--color-text-white))] shadow-[0_10px_15px_-3px_rgb(var(--color-primary-dark)_/_0.3)] transition-all duration-300 hover:bg-[rgb(var(--color-primary-dark))] sm:min-h-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="inline-block align-middle">投稿を始める</span>
          </router-link>
          
          <router-link 
            to="/posts"
            class="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.08)] px-8 py-3 font-medium text-[rgb(var(--color-primary-light))] transition-all duration-300 hover:bg-[rgba(var(--color-primary),0.15)] sm:min-h-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="inline-block align-middle">投稿一覧</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Aboutセクション（新規追加） -->
    <section class="mb-16">
      <div class="mb-8">
        <h2 class="flex items-center text-2xl font-bold text-[rgb(var(--color-heading))] md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-[rgb(var(--color-primary))]"></span>
          当サイトについて
        </h2>
      </div>
      
      <div class="glass-card p-6 md:p-8">
        <div class="mx-auto max-w-4xl">
          <p class="mb-6 text-lg leading-relaxed text-[rgb(var(--color-text))]">
            「見えない障害と共に生きる」は、身体的な症状が外見からはわかりにくい障害を持つ方々の経験を共有し、
            互いに支え合うためのコミュニティプラットフォームです。
          </p>
          
          <div class="my-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <!-- 特徴1 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[rgb(var(--color-primary-light))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 class="mb-2 text-xl font-semibold text-[rgb(var(--color-heading))]">経験の共有</h3>
              <p class="text-[rgb(var(--color-text))]">日常生活での工夫や対処法、成功体験や困難を乗り越えた経験を共有できます。</p>
            </div>
            
            <!-- 特徴2 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[rgb(var(--color-primary-light))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="mb-2 text-xl font-semibold text-[rgb(var(--color-heading))]">コミュニティ</h3>
              <p class="text-[rgb(var(--color-text))]">同じ障害や似た経験を持つ人とつながり、理解し合える関係を築けます。</p>
            </div>
            
            <!-- 特徴3 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--color-primary),0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[rgb(var(--color-primary-light))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 class="mb-2 text-xl font-semibold text-[rgb(var(--color-heading))]">安心できる場所</h3>
              <p class="text-[rgb(var(--color-text))]">理解されにくい障害や症状について偏見なく話せる安全な環境を提供します。</p>
            </div>
          </div>
          
          <div class="mb-8 rounded-lg border border-[rgba(var(--color-primary),0.2)] bg-[rgba(var(--color-primary),0.1)] p-6">
            <h3 class="mb-3 text-xl font-semibold text-[rgb(var(--color-primary-light))]">対象となる障害・症状</h3>
            <ul class="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>発達障害（ASD、ADHD、LD等）</li>
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>精神障害（うつ病、統合失調症等）</li>
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>慢性疲労症候群</li>
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>線維筋痛症</li>
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>内部障害</li>
              <li class="flex items-center"><span class="mr-2 h-2 w-2 rounded-full bg-[rgb(var(--color-primary-light))]"></span>その他の見えない障害</li>
            </ul>
          </div>
          
          <div class="text-center">
            <p class="mb-6 text-[rgb(var(--color-text))]">あなたの経験は、誰かの助けになります。<br>このコミュニティに参加して、あなたの物語を共有しませんか？</p>
            <router-link 
              to="/editor" 
              class="inline-flex items-center rounded-full bg-[rgb(var(--color-primary))] px-6 py-3 text-[rgb(var(--color-text-white))] transition-all duration-300 hover:bg-[rgb(var(--color-primary-dark))]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              今すぐ投稿を始める
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 注目の投稿 -->
    <section class="mb-16">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="flex items-center text-2xl font-bold text-[rgb(var(--color-heading))] md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-[rgb(var(--color-primary))]"></span>
          注目の投稿
        </h2>
        <router-link to="/posts?sort=views.desc" class="flex items-center text-[rgb(var(--color-primary-light))] hover:underline">
          すべて見る
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </router-link>
      </div>
      
      <!-- ローディング状態 -->
      <div v-if="loading" class="flex justify-center py-8">
        <svg class="h-10 w-10 animate-spin text-[rgb(var(--color-primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- エラー表示 -->
      <div v-else-if="error" class="glass-card p-6 text-center">
        <p class="text-[rgb(var(--color-error))]">{{ error }}</p>
        <button @click="fetchFeaturedPosts" class="mt-4 rounded bg-[rgb(var(--color-primary))] px-4 py-2 text-[rgb(var(--color-text-white))] shadow-[0_4px_6px_-1px_rgb(var(--color-primary-dark)_/_0.2)] transition-colors duration-300 hover:bg-[rgb(var(--color-primary-dark))]">再読み込み</button>
      </div>
      
      <!-- 投稿の表示 -->
      <div v-else>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PostCard 
            v-for="post in featuredPosts" 
            :key="post.id" 
            :post="post"
            layout="vertical"
          />
        </div>
      </div>
    </section>
    
    <!-- 最新の投稿 -->
    <section class="mb-10">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-[rgb(var(--color-heading))]">最新の投稿</h2>
        <router-link to="/posts?sort=created_at.desc" class="text-[rgb(var(--color-primary))] hover:underline">すべて見る</router-link>
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
import PostCard from '../components/common/PostCard.vue';

// 投稿の型定義を修正
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  created_at: string;
  views?: number;
  profiles?: {
    nickname?: string | null;
    avatar_data?: string | null;
  };
  author_id?: string;
  like_count?: number;
  comment_count?: number;
}

// カテゴリの型定義
interface Category {
  id: number;
  name: string;
  description?: string | null;
}

// 状態変数
const featuredPosts = ref<Post[]>([]);
const recentPosts = ref<Post[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref('');

// 初期化
onMounted(async () => {
  try {
    // 並行してデータを取得する
    await Promise.all([
      fetchFeaturedPosts(),
      fetchRecentPosts(),
      fetchCategories()
    ]);
  } catch (err: any) {
    console.error('データ取得エラー:', err);
    error.value = 'データの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
});

// 注目の投稿を取得
async function fetchFeaturedPosts() {
  try {
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id(nickname, avatar_data)
      `)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(6);
    
    if (fetchError) throw fetchError;
    
    if (data) {
      // いいね数とコメント数を取得して追加
      featuredPosts.value = await Promise.all(data.map(async (post) => {
        // いいね数を取得
        const { count: likeCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        // コメント数を取得
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        return {
          ...post,
          like_count: likeCount || 0,
          comment_count: commentCount || 0
        };
      }));
    } else {
      featuredPosts.value = [];
    }
  } catch (err: any) {
    console.error('注目投稿取得エラー:', err);
    throw err;
  }
}

// 最新の投稿を取得
async function fetchRecentPosts() {
  try {
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id(nickname, avatar_data)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) throw fetchError;
    
    if (data) {
      // いいね数とコメント数を取得して追加
      recentPosts.value = await Promise.all(data.map(async (post) => {
        // いいね数を取得
        const { count: likeCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        // コメント数を取得
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        return {
          ...post,
          like_count: likeCount || 0,
          comment_count: commentCount || 0
        };
      }));
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