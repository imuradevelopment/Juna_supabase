<template>
  <div>
    <h2 class="text-xl font-bold mb-4 text-[rgb(var(--color-heading))]">統計情報</h2>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <svg class="animate-spin h-8 w-8 text-[rgb(var(--color-primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <!-- 統計表示 -->
    <div v-else class="space-y-6">
      <!-- 概要カード -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="glass-card p-4 flex flex-col items-center">
          <h3 class="text-lg font-semibold text-[rgb(var(--color-text-muted))] mb-1">投稿数</h3>
          <p class="text-3xl font-bold text-[rgb(var(--color-primary))]">{{ stats.postsCount }}</p>
        </div>
        
        <div class="glass-card p-4 flex flex-col items-center">
          <h3 class="text-lg font-semibold text-[rgb(var(--color-text-muted))] mb-1">コメント数</h3>
          <p class="text-3xl font-bold text-[rgb(var(--color-primary))]">{{ stats.commentsCount }}</p>
        </div>
        
        <div class="glass-card p-4 flex flex-col items-center">
          <h3 class="text-lg font-semibold text-[rgb(var(--color-text-muted))] mb-1">いいね数</h3>
          <p class="text-3xl font-bold text-[rgb(var(--color-primary))]">{{ stats.totalLikesGivenCount }}</p>
        </div>
      </div>
      
      <!-- 詳細統計 -->
      <div class="glass-card p-4">
        <h3 class="text-lg font-bold mb-3 text-[rgb(var(--color-heading))]">詳細統計</h3>
        
        <div class="divide-y divide-[rgb(var(--color-border))]">
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">公開中の投稿</span>
            <span class="font-semibold">{{ stats.publishedPostsCount }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">下書き</span>
            <span class="font-semibold">{{ stats.draftsCount }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">総閲覧数</span>
            <span class="font-semibold">{{ stats.totalViews }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">投稿への返信コメント</span>
            <span class="font-semibold">{{ stats.commentsOnPostsCount }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">自分がいいねした投稿</span>
            <span class="font-semibold">{{ stats.postLikesGivenCount }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">自分がいいねしたコメント</span>
            <span class="font-semibold">{{ stats.commentLikesGivenCount }}</span>
          </div>
          
          <div class="py-3 flex justify-between">
            <span class="text-[rgb(var(--color-text-muted))]">自分の投稿が受けたいいね</span>
            <span class="font-semibold">{{ stats.likesReceivedCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- 人気の投稿 -->
      <div v-if="stats.popularPosts.length > 0" class="glass-card p-4">
        <h3 class="text-lg font-bold mb-3 text-[rgb(var(--color-heading))]">人気の投稿</h3>
        
        <div class="space-y-3">
          <div v-for="post in stats.popularPosts" :key="post.id" class="flex justify-between items-center">
            <div class="flex-1">
              <router-link :to="`/posts/${post.id}`" class="font-medium hover:text-[rgb(var(--color-primary))]">
                {{ post.title }}
              </router-link>
              <div class="text-sm text-[rgb(var(--color-text-muted))] flex items-center">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {{ post.views }} 閲覧
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 最近の活動 -->
      <div v-if="stats.recentActivities.length > 0" class="glass-card p-4">
        <h3 class="text-lg font-bold mb-3 text-[rgb(var(--color-heading))]">最近の活動</h3>
        
        <div class="space-y-3">
          <div v-for="activity in stats.recentActivities" :key="activity.id" class="flex items-start">
            <div class="flex-shrink-0 mr-3">
              <div :class="getActivityIconClass(activity.type)" class="h-8 w-8 rounded-full flex items-center justify-center">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path v-if="activity.type === 'post'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  <path v-else-if="activity.type === 'comment'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  <path v-else-if="activity.type === 'post-like'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  <path v-else-if="activity.type === 'comment-like'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            
            <div class="flex-1">
              <p class="text-sm text-[rgb(var(--color-text))]">
                {{ getActivityText(activity) }}
              </p>
              <p class="text-xs text-[rgb(var(--color-text-muted))]">
                {{ formatDate(activity.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ユーザー情報表示 -->
      <div class="glass-card p-4 text-center md:text-left">
        <div class="flex flex-col md:flex-row items-center">
          <div class="w-20 h-20 rounded-full bg-[rgb(var(--color-primary-light))] flex items-center justify-center text-[rgb(var(--color-text-white))] text-2xl mb-4 md:mb-0 md:mr-4">
            <img 
              v-if="profile?.avatar_data" 
              :src="getAvatarUrl(profile.avatar_data)" 
              :alt="profile?.nickname"
              class="w-full h-full object-cover rounded-full"
            />
            <span v-else>{{ getInitials(profile?.nickname || 'U') }}</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-[rgb(var(--color-heading))]">{{ profile?.nickname }}</h3>
            <p v-if="profile?.bio" class="text-sm text-[rgb(var(--color-text-muted))] mt-1">{{ profile.bio }}</p>
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
      return 'bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-info))]';
    case 'comment':
      return 'bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-success))]';
    case 'post-like':
    case 'comment-like':
      return 'bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-error))]';
    default:
      return 'bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]';
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