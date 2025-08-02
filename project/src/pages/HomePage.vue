<template>
  <div>
    <!-- ヒーローセクション - より魅力的に -->
    <section class="glass-card relative mb-10 overflow-hidden rounded-2xl p-8 md:p-12">
      <!-- 装飾的な背景要素 -->
      <div class="pointer-events-none absolute top-0 right-0 h-full w-2/3 opacity-10">
        <svg class="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" class="text-primary-light" d="M44.9,-76.2C58.3,-69.3,69.8,-58.3,78.1,-45C86.5,-31.7,91.8,-15.8,90.9,-0.5C90.1,14.8,83,29.7,74.4,43.4C65.8,57.2,55.6,69.9,42.2,77.8C28.8,85.7,14.4,88.7,-0.3,89.2C-15,89.7,-30.1,87.6,-41.9,79.5C-53.8,71.4,-62.4,57.1,-70.6,42.8C-78.8,28.5,-86.5,14.2,-88.5,-1.1C-90.5,-16.5,-86.8,-33,-78.2,-46.4C-69.5,-59.8,-55.9,-70.1,-41.6,-76.5C-27.3,-82.9,-13.6,-85.5,0.9,-87C15.4,-88.5,31.5,-89,44.9,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <h1 class="mb-6 text-4xl font-bold text-primary-light md:text-6xl">{{ settingsStore.domainTexts?.heroTitle || '見えない障害と共に生きる' }}</h1>
        <p class="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text md:text-xl">{{ settingsStore.domainTexts?.heroSubtitle || '経験を共有し、互いに学び、支え合うコミュニティへようこそ' }}</p>
        <div class="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <router-link 
            to="/editor"
            class="btn btn-primary rounded-full px-8"
          >
            <PhPlusCircle :size="20" class="mr-2" weight="bold" />
            <span class="inline-block align-middle">{{ settingsStore.domainTexts?.startPostingButton || '投稿を始める' }}</span>
          </router-link>
          
          <router-link 
            to="/posts"
            class="btn btn-outline-primary rounded-full px-8"
          >
            <PhInfo :size="20" class="mr-2" weight="bold" />
            <span class="inline-block align-middle">{{ settingsStore.domainTexts?.viewPostsButton || '投稿一覧' }}</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Aboutセクション（新規追加） -->
    <section class="mb-16">
      <div class="mb-8">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          {{ settingsStore.domainTexts?.aboutTitle || '当サイトについて' }}
        </h2>
      </div>
      
      <div class="glass-card p-6 md:p-8">
        <div class="mx-auto max-w-4xl">
          <p class="mb-6 text-lg leading-relaxed text-text">
            {{ settingsStore.domainTexts?.aboutDescription || '「見えない障害と共に生きる」は、身体的な症状が外見からはわかりにくい障害を持つ方々の経験を共有し、互いに支え合うためのコミュニティプラットフォームです。' }}
          </p>
          
          <div class="my-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <!-- 特徴1 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhBookOpen :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">{{ settingsStore.domainTexts?.feature1Title || '経験の共有' }}</h3>
              <p class="text-text">{{ settingsStore.domainTexts?.feature1Description || '日常生活での工夫や対処法、成功体験や困難を乗り越えた経験を共有できます。' }}</p>
            </div>
            
            <!-- 特徴2 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhUsersThree :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">{{ settingsStore.domainTexts?.feature2Title || 'コミュニティ' }}</h3>
              <p class="text-text">{{ settingsStore.domainTexts?.feature2Description || '同じ障害や似た経験を持つ人とつながり、理解し合える関係を築けます。' }}</p>
            </div>
            
            <!-- 特徴3 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhShieldStar :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">{{ settingsStore.domainTexts?.feature3Title || '安心できる場所' }}</h3>
              <p class="text-text">{{ settingsStore.domainTexts?.feature3Description || '理解されにくい障害や症状について偏見なく話せる安全な環境を提供します。' }}</p>
            </div>
          </div>
          
          <div class="mb-8 rounded-lg border border-primary border-opacity-20 bg-primary bg-opacity-10 p-6">
            <h3 class="mb-3 text-xl font-semibold text-primary-light">{{ settingsStore.domainTexts?.targetDisabilitiesTitle || '対象となる障害・症状' }}</h3>
            <ul class="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
              <li v-for="(disability, index) in (settingsStore.domainTexts?.targetDisabilities || defaultDisabilities)" :key="index" class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>{{ disability }}
              </li>
            </ul>
          </div>
          
          <div class="text-center">
            <p class="mb-6 text-text">{{ settingsStore.domainTexts?.callToAction || 'あなたの経験は、誰かの助けになります。このコミュニティに参加して、あなたの物語を共有しませんか？' }}</p>
            <router-link 
              to="/editor" 
              class="btn btn-primary rounded-full px-6"
            >
              <PhPencilSimple :size="20" class="mr-2" weight="bold" />
              <span class="inline-block align-middle">{{ settingsStore.domainTexts?.startPostingButton || '今すぐ投稿を始める' }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 注目の投稿 -->
    <section class="mb-16">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          注目の投稿
        </h2>
        <router-link to="/posts?sort=views.desc" class="flex items-center text-primary-light hover:underline">
          すべて見る
          <PhArrowRight :size="20" class="ml-1" weight="bold" />
        </router-link>
      </div>
      
      <!-- ローディング状態 -->
      <div v-if="loading" class="flex justify-center py-8">
        <PhCircleNotch :size="40" class="animate-spin text-primary" weight="bold" />
      </div>
      
      <!-- 投稿の表示 -->
      <div v-else>
        <div v-if="featuredPosts.length > 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PostCard 
            v-for="post in featuredPosts" 
            :key="post.id" 
            :post="post"
          />
        </div>
        <div v-else class="glass-card p-6 text-center">
          <p class="text-text-muted">まだ投稿はありません。</p>
        </div>
      </div>
    </section>
    
    <!-- 最新の投稿 -->
    <section class="mb-10">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          {{ settingsStore.domainTexts?.recentPostsTitle || '最新の投稿' }}
        </h2>
        <router-link to="/posts?sort=created_at.desc" class="flex items-center text-primary-light hover:underline">
          {{ settingsStore.domainTexts?.viewAllPosts || 'すべて見る' }}
          <PhArrowRight :size="20" class="ml-1" weight="bold" />
        </router-link>
      </div>
      
      <div v-if="recentPosts.length > 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PostCard 
          v-for="post in recentPosts" 
          :key="post.id" 
          :post="post"
        />
      </div>
      <div v-else class="glass-card p-6 text-center">
        <p class="text-text-muted">{{ settingsStore.domainTexts?.noRecentPosts || 'まだ投稿はありません。' }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from '../stores/settings';
import PostCard from '../components/common/PostCard.vue';
// Phosphor Iconsのインポート（修正版）
import { 
  PhPlusCircle, 
  PhInfo, 
  PhBookOpen, 
  PhUsersThree, 
  PhShieldStar, 
  PhPencilSimple, 
  PhArrowRight,
  PhCircleNotch
} from '@phosphor-icons/vue';

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

// ストア
const settingsStore = useSettingsStore();

// デフォルトの障害リスト
const defaultDisabilities = [
  'インフラ基礎',
  'ネットワーク',
  'コンテナ / Kubernetes',
  'Rinstack Cloud入門',
  'Rinstack Cloud開発',
  '運用 / DevOps',
  'セキュリティ & ガバナンス',
  '認定試験対策'
];

// 状態変数
const featuredPosts = ref<Post[]>([]);
const recentPosts = ref<Post[]>([]);
const loading = ref(true);

// 注目の投稿を取得（閲覧数順）
const fetchFeaturedPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        cover_image_path,
        published_at,
        created_at,
        views,
        author_id,
        profiles!posts_author_id_fkey (
          nickname,
          avatar_data
        )
      `)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(6);

    if (error) throw error;

    // 各投稿のいいね数とコメント数を取得
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
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
      })
    );

    featuredPosts.value = postsWithCounts;
  } catch (error) {
    console.error('注目の投稿の取得エラー:', error);
  }
};

// 最新の投稿を取得
const fetchRecentPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        cover_image_path,
        published_at,
        created_at,
        views,
        author_id,
        profiles!posts_author_id_fkey (
          nickname,
          avatar_data
        )
      `)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    // 各投稿のいいね数とコメント数を取得
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
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
      })
    );

    recentPosts.value = postsWithCounts;
  } catch (error) {
    console.error('最新の投稿の取得エラー:', error);
  }
};

// データの取得
onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchFeaturedPosts(),
    fetchRecentPosts()
  ]);
  loading.value = false;
});
</script>