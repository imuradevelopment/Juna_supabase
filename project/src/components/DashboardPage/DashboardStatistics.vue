<template>
  <div>
    <h2 class="text-xl font-bold mb-4 text-heading">統計情報</h2>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 統計表示 -->
    <div v-else class="space-y-6">
      <!-- 概要カード -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="glass-card flex flex-col items-center p-4">
          <h3 class="mb-1 text-lg font-semibold text-text-muted">投稿数</h3>
          <p class="text-3xl font-bold text-primary-dark">{{ stats.postsCount }}</p>
        </div>
        
        <div class="glass-card flex flex-col items-center p-4">
          <h3 class="mb-1 text-lg font-semibold text-text-muted">コメント数</h3>
          <p class="text-3xl font-bold text-primary-dark">{{ stats.commentsCount }}</p>
        </div>
        
        <div class="glass-card flex flex-col items-center p-4">
          <h3 class="mb-1 text-lg font-semibold text-text-muted">いいね数</h3>
          <p class="text-3xl font-bold text-primary-dark">{{ stats.totalLikesGivenCount }}</p>
        </div>
      </div>
      
      <!-- 詳細統計 -->
      <div class="glass-card p-4">
        <h3 class="mb-3 text-lg font-bold text-heading">詳細統計</h3>
        
        <div class="divide-y divide-border">
          <div class="flex justify-between py-3">
            <span class="text-text-muted">公開中の投稿</span>
            <span class="font-semibold text-primary">{{ stats.publishedPostsCount }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">下書き</span>
            <span class="font-semibold text-primary">{{ stats.draftsCount }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">総閲覧数</span>
            <span class="font-semibold text-primary">{{ stats.totalViews }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">投稿への返信コメント</span>
            <span class="font-semibold text-primary">{{ stats.commentsOnPostsCount }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">自分がいいねした投稿</span>
            <span class="font-semibold text-primary">{{ stats.postLikesGivenCount }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">自分がいいねしたコメント</span>
            <span class="font-semibold text-primary">{{ stats.commentLikesGivenCount }}</span>
          </div>
          
          <div class="flex justify-between py-3">
            <span class="text-text-muted">自分の投稿が受けたいいね</span>
            <span class="font-semibold text-primary">{{ stats.likesReceivedCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- 人気の投稿 -->
      <div v-if="stats.popularPosts.length > 0" class="glass-card p-4">
        <h3 class="mb-3 text-lg font-bold text-heading">人気の投稿</h3>
        
        <div class="space-y-3">
          <div v-for="post in stats.popularPosts" :key="post.id" class="flex items-center justify-between">
            <div class="flex-1">
              <router-link :to="`/posts/${post.id}`" class="btn-link">
                {{ post.title }}
              </router-link>
              <div class="flex items-center text-sm text-text-muted">
                <PhEye class="mr-1 h-4 w-4" />
                {{ post.views }} 閲覧
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 最近の活動 -->
      <div v-if="stats.recentActivities.length > 0" class="glass-card p-4">
        <h3 class="mb-3 text-lg font-bold text-heading">最近の活動</h3>
        
        <div class="space-y-3">
          <div v-for="activity in stats.recentActivities" :key="activity.id" class="flex items-start">
            <div class="mr-3 flex-shrink-0">
              <div :class="getActivityIconClass(activity.type)" class="rounded-full p-1.5 flex items-center justify-center">
                <PhArticle v-if="activity.type === 'post'" class="h-4 w-4" />
                <PhChatText v-else-if="activity.type === 'comment'" class="h-4 w-4" />
                <PhHeart v-else-if="activity.type === 'post-like'" class="h-4 w-4" weight="fill" />
                <PhHeart v-else-if="activity.type === 'comment-like'" class="h-4 w-4" weight="fill" />
              </div>
            </div>
            
            <div class="flex-1">
              <p class="text-sm text-text">
                {{ getActivityText(activity) }}
              </p>
              <p class="text-xs text-text-muted">
                {{ formatDate(activity.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ユーザー情報表示 -->
      <div class="glass-card p-4 text-center md:text-left">
        <div class="flex flex-col items-center md:flex-row">
          <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-2xl text-text-white md:mb-0 md:mr-4">
            <img 
              v-if="profile?.avatar_data" 
              :src="getAvatarUrl(profile.avatar_data)" 
              :alt="profile?.nickname"
              class="h-full w-full rounded-full object-cover"
            />
            <span v-else>{{ getInitials(profile?.nickname || 'U') }}</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-heading">{{ profile?.nickname }}</h3>
            <p v-if="profile?.bio" class="mt-1 text-sm text-text-muted">{{ profile.bio }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl } from '../../lib/storage';
import { PhSpinner, PhEye, PhArticle, PhChatText, PhHeart } from '@phosphor-icons/vue';

const authStore = useAuthStore();

// 状態
const loading = ref(true);
const stats = ref({
  postsCount: 0,
  publishedPostsCount: 0,
  draftsCount: 0,
  commentsCount: 0,
  commentsOnPostsCount: 0,
  postLikesGivenCount: 0,      // 自分がいいねした投稿数
  commentLikesGivenCount: 0,   // 自分がいいねしたコメント数
  totalLikesGivenCount: 0,     // 自分がいいねした合計数（投稿＋コメント）
  likesReceivedCount: 0,       // 自分の投稿が受けたいいね数
  totalViews: 0,
  popularPosts: [] as any[],
  recentActivities: [] as any[]
});

// プロフィール情報を追加
const profile = ref<any>(null);

// 初期データ取得
onMounted(async () => {
  if (authStore.user) {
    // プロフィール情報の取得
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single();
    
    profile.value = profileData;
  }
  
  fetchStats();
});

// 統計情報の取得
async function fetchStats() {
  if (!authStore.user) return;
  
  try {
    // 投稿数
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id);
      
    if (postsError) throw postsError;
    
    // 公開中の投稿数
    const { count: publishedPostsCount, error: publishedError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id)
      .eq('published', true);
      
    if (publishedError) throw publishedError;
    
    // 下書き数
    const { count: draftsCount, error: draftsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id)
      .eq('published', false);
      
    if (draftsError) throw draftsError;
    
    // コメント数
    const { count: commentsCount, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id);
      
    if (commentsError) throw commentsError;
    
    // 投稿に対するコメント数
    const { count: commentsOnPostsCount, error: commentsOnPostsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id)
      .is('parent_comment_id', null);
      
    if (commentsOnPostsError) throw commentsOnPostsError;
    
    // 自分がいいねした投稿の数
    const { count: postLikesGivenCount, error: postLikesGivenError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id);
      
    if (postLikesGivenError) throw postLikesGivenError;
    
    // 自分がいいねしたコメントの数
    const { count: commentLikesGivenCount, error: commentLikesGivenError } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id);
      
    if (commentLikesGivenError) throw commentLikesGivenError;
    
    // 自分の投稿が受けたいいねの数
    const { count: postsLikesReceivedCount, error: postsLikesReceivedError } = await supabase
      .from('post_likes')
      .select('posts!inner(author_id)', { count: 'exact', head: true })
      .eq('posts.author_id', authStore.user.id);
      
    if (postsLikesReceivedError) throw postsLikesReceivedError;
    
    // 自分のコメントが受けたいいねの数
    const { count: commentsLikesReceivedCount, error: commentsLikesReceivedError } = await supabase
      .from('comment_likes')
      .select('comments!inner(author_id)', { count: 'exact', head: true })
      .eq('comments.author_id', authStore.user.id);
      
    if (commentsLikesReceivedError) throw commentsLikesReceivedError;
    
    // 総閲覧数を取得
    const { data: viewsData, error: viewsError } = await supabase
      .from('posts')
      .select('views')
      .eq('author_id', authStore.user.id);
      
    if (viewsError) throw viewsError;
    
    const totalViews = viewsData.reduce((sum, post) => sum + (post.views || 0), 0);
    
    // 人気の投稿を取得
    const { data: popularPosts, error: popularError } = await supabase
      .from('posts')
      .select('id, title, views')
      .eq('author_id', authStore.user.id)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(3);
      
    if (popularError) throw popularError;
    
    // 最近の活動を取得
    const recentActivities = await fetchRecentActivities();
    
    // すべての統計をセット
    stats.value = {
      postsCount: postsCount || 0,
      publishedPostsCount: publishedPostsCount || 0,
      draftsCount: draftsCount || 0,
      commentsCount: commentsCount || 0,
      commentsOnPostsCount: commentsOnPostsCount || 0,
      postLikesGivenCount: postLikesGivenCount || 0,
      commentLikesGivenCount: commentLikesGivenCount || 0,
      likesReceivedCount: (postsLikesReceivedCount || 0) + (commentsLikesReceivedCount || 0),
      totalLikesGivenCount: (postLikesGivenCount || 0) + (commentLikesGivenCount || 0),
      totalViews,
      popularPosts: popularPosts || [],
      recentActivities: recentActivities || []
    };
  } catch (err) {
    console.error('統計情報取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// 最近の活動を取得
async function fetchRecentActivities() {
  if (!authStore.user) return [];
  
  // 最近の投稿
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, created_at')
    .eq('author_id', authStore.user.id)
    .order('created_at', { ascending: false })
    .limit(2);
  
  // 最近のコメント
  const { data: recentComments } = await supabase
    .from('comments')
    .select('id, content, created_at, posts(title)')
    .eq('author_id', authStore.user.id)
    .order('created_at', { ascending: false })
    .limit(2);
  
  // 最近の投稿いいね
  const { data: recentPostLikes } = await supabase
    .from('post_likes')
    .select('post_id, created_at, posts(title)')
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })
    .limit(2);
  
  // 最近のコメントいいね
  const { data: recentCommentLikes } = await supabase
    .from('comment_likes')
    .select('comment_id, created_at, comments(content, posts(title))')
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })
    .limit(2);
  
  // 活動データの整形
  const activities = [
    ...(recentPosts || []).map((post: any) => ({
      id: `post-${post.id}`,
      type: 'post',
      title: post.title,
      created_at: post.created_at
    })),
    ...(recentComments || []).map((comment: any) => ({
      id: `comment-${comment.id}`,
      type: 'comment',
      content: comment.content,
      postTitle: comment.posts?.title,
      created_at: comment.created_at
    })),
    ...(recentPostLikes || []).map((like: any) => ({
      id: `post-like-${like.post_id}`,
      type: 'post-like',
      postTitle: like.posts?.title,
      created_at: like.created_at
    })),
    ...(recentCommentLikes || []).map((like: any) => ({
      id: `comment-like-${like.comment_id}`,
      type: 'comment-like',
      commentContent: like.comments?.content,
      postTitle: like.comments?.posts?.title,
      created_at: like.created_at
    }))
  ];
  
  // 日付でソート
  activities.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return activities.slice(0, 5);
}

// イニシャルを取得する関数を追加
function getInitials(name: string): string {
  if (!name) return 'U';
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
}

// 活動タイプに応じたアイコンのクラスを取得
function getActivityIconClass(type: string) {
  switch (type) {
    case 'post':
      return 'bg-info/20 text-info';
    case 'comment':
      return 'bg-success/20 text-success';
    case 'post-like':
    case 'comment-like':
      return 'bg-error/20 text-error';
    default:
      return 'bg-text/10 text-text';
  }
}

// 活動内容のテキストを取得
function getActivityText(activity: any) {
  switch (activity.type) {
    case 'post':
      return `新しい投稿「${activity.title}」を作成しました`;
    case 'comment':
      return `「${activity.postTitle || '不明な投稿'}」にコメントしました`;
    case 'post-like':
      return `投稿「${activity.postTitle || '不明な投稿'}」にいいねしました`;
    case 'comment-like':
      return `「${activity.postTitle || '不明な投稿'}」のコメントにいいねしました`;
    default:
      return '不明な活動';
  }
}

// 日付フォーマット
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch {
    return dateString;
  }
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}
</script> 