<template>
  <div class="dashboard-likes-list">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">いいね管理</h2>
      <div class="text-sm text-[rgb(var(--color-text-muted))]">
        全 {{ activeLikeType === 'post' ? totalPostLikes : totalCommentLikes }} 件
      </div>
    </div>
    
    <!-- タブ切り替え -->
    <div class="flex border-b border-[rgb(var(--color-border))] mb-4">
      <button 
        @click="activeLikeType = 'post'" 
        class="py-2 px-4 font-medium text-sm focus:outline-none"
        :class="activeLikeType === 'post' 
          ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' 
          : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'"
      >
        投稿のいいね
      </button>
      <button 
        @click="activeLikeType = 'comment'" 
        class="py-2 px-4 font-medium text-sm focus:outline-none"
        :class="activeLikeType === 'comment' 
          ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' 
          : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'"
      >
        コメントのいいね
      </button>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <svg class="animate-spin h-8 w-8 text-[rgb(var(--color-primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <!-- 投稿のいいね -->
    <div v-else-if="activeLikeType === 'post'">
      <!-- いいねがない場合 -->
      <div v-if="postLikes.length === 0" class="glass-card p-8 text-center">
        <p class="text-[rgb(var(--color-text-muted))]">
          まだいいねした投稿はありません
        </p>
      </div>
      
      <!-- いいねリスト -->
      <div v-else class="space-y-4">
        <div v-for="like in postLikes" :key="`post-${like.post_id}`" class="glass-card p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="flex-1">
              <!-- 投稿情報 -->
              <h3 class="font-bold text-lg mb-1">
                <router-link :to="`/posts/${like.post_id}`" class="hover:text-[rgb(var(--color-primary))]">
                  {{ like.post?.title || '不明な投稿' }}
                </router-link>
              </h3>
              
              <!-- 投稿メタデータ -->
              <div class="flex items-center mb-2">
                <div class="w-6 h-6 rounded-full bg-[rgb(var(--color-primary-light))] flex items-center justify-center text-[rgb(var(--color-text-white))] overflow-hidden mr-2">
                  <img 
                    v-if="like.post?.author?.avatar_data" 
                    :src="getAvatarUrl(like.post.author.avatar_data)" 
                    :alt="like.post?.author?.nickname || ''"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ getInitials(like.post?.author?.nickname || '') }}</span>
                </div>
                <span class="text-sm">{{ like.post?.author?.nickname || '不明なユーザー' }}</span>
              </div>
              
              <!-- 投稿の抜粋 -->
              <p v-if="like.post?.excerpt" class="text-sm text-[rgb(var(--color-text-muted))] line-clamp-2 mb-2">
                {{ like.post.excerpt }}
              </p>
            </div>
            
            <!-- いいね解除ボタン -->
            <div class="flex justify-end mt-3 md:mt-0 md:ml-4">
              <button 
                @click="confirmUnlikePost(like)" 
                class="px-3 py-1 rounded text-sm font-medium transition-all flex items-center text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))] hover:text-[rgb(var(--color-text-white))]"
              >
                <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                </svg>
                いいね解除
              </button>
            </div>
          </div>
        </div>
        
        <!-- ページネーション -->
        <div v-if="totalPostPages > 1" class="flex justify-center mt-6">
          <div class="flex space-x-2">
            <button 
              @click="changePostPage(currentPostPage - 1)" 
              class="px-3 py-1 rounded text-sm font-medium border border-[rgb(var(--color-border))] transition-all"
              :class="currentPostPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
              :disabled="currentPostPage === 1"
            >
              前へ
            </button>
            <button 
              v-for="page in getPostPageNumbers()" 
              :key="page"
              @click="changePostPage(page)" 
              class="px-3 py-1 rounded text-sm font-medium transition-all" 
              :class="page === currentPostPage ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-white))]' : 'border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
            >
              {{ page }}
            </button>
            <button 
              @click="changePostPage(currentPostPage + 1)" 
              class="px-3 py-1 rounded text-sm font-medium border border-[rgb(var(--color-border))] transition-all"
              :class="currentPostPage === totalPostPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
              :disabled="currentPostPage === totalPostPages"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- コメントのいいね -->
    <div v-else-if="activeLikeType === 'comment'">
      <!-- いいねがない場合 -->
      <div v-if="commentLikes.length === 0" class="glass-card p-8 text-center">
        <p class="text-[rgb(var(--color-text-muted))]">
          まだいいねしたコメントはありません
        </p>
      </div>
      
      <!-- いいねリスト -->
      <div v-else class="space-y-4">
        <div v-for="like in commentLikes" :key="`comment-${like.comment_id}`" class="glass-card p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="flex-1">
              <!-- コメント情報 -->
              <div class="mb-2 p-3 bg-[rgb(var(--color-surface-variant))] rounded">
                <p class="text-sm whitespace-pre-wrap">{{ like.comment?.content || '不明なコメント' }}</p>
              </div>
              
              <!-- 投稿情報 -->
              <div class="flex items-center justify-between">
                <router-link 
                  v-if="like.comment?.post_id" 
                  :to="`/posts/${like.comment.post_id}`" 
                  class="text-sm text-[rgb(var(--color-primary))] hover:underline"
                >
                  {{ like.comment?.post?.title || '不明な投稿' }}
                </router-link>
                <span class="text-xs text-[rgb(var(--color-text-muted))]">
                  {{ formatDate(like.created_at) }}
                </span>
              </div>
              
              <!-- コメント投稿者 -->
              <div class="flex items-center mt-2">
                <div class="w-5 h-5 rounded-full bg-[rgb(var(--color-primary-light))] flex items-center justify-center text-[rgb(var(--color-text-white))] overflow-hidden mr-2">
                  <img 
                    v-if="like.comment?.author?.avatar_data" 
                    :src="getAvatarUrl(like.comment.author.avatar_data)" 
                    :alt="like.comment?.author?.nickname || ''"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ getInitials(like.comment?.author?.nickname || '') }}</span>
                </div>
                <span class="text-xs">{{ like.comment?.author?.nickname || '不明なユーザー' }}</span>
              </div>
            </div>
            
            <!-- いいね解除ボタン -->
            <div class="flex justify-end mt-3 md:mt-0 md:ml-4">
              <button 
                @click="confirmUnlikeComment(like)" 
                class="px-3 py-1 rounded text-sm font-medium transition-all flex items-center text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))] hover:text-[rgb(var(--color-text-white))]"
              >
                <svg class="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                </svg>
                いいね解除
              </button>
            </div>
          </div>
        </div>
        
        <!-- ページネーション -->
        <div v-if="totalCommentPages > 1" class="flex justify-center mt-6">
          <div class="flex space-x-2">
            <button 
              @click="changeCommentPage(currentCommentPage - 1)" 
              class="px-3 py-1 rounded text-sm font-medium border border-[rgb(var(--color-border))] transition-all"
              :class="currentCommentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
              :disabled="currentCommentPage === 1"
            >
              前へ
            </button>
            <button 
              v-for="page in getCommentPageNumbers()" 
              :key="page"
              @click="changeCommentPage(page)" 
              class="px-3 py-1 rounded text-sm font-medium transition-all" 
              :class="page === currentCommentPage ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-white))]' : 'border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
            >
              {{ page }}
            </button>
            <button 
              @click="changeCommentPage(currentCommentPage + 1)" 
              class="px-3 py-1 rounded text-sm font-medium border border-[rgb(var(--color-border))] transition-all"
              :class="currentCommentPage === totalCommentPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text-white))]'"
              :disabled="currentCommentPage === totalCommentPages"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- いいね解除確認モーダル -->
    <div v-if="showUnlikeModal" class="fixed inset-0 bg-[rgb(var(--color-background))/0.7] flex items-center justify-center z-50">
      <div class="glass-card p-6 max-w-md mx-auto">
        <h3 class="text-xl font-bold mb-4">いいねを解除しますか？</h3>
        <p class="mb-6 text-[rgb(var(--color-text-muted))]">
          {{ activeLikeType === 'post' ? 'この投稿' : 'このコメント' }}のいいねを解除しますか？
        </p>
        <div class="flex justify-end space-x-3">
          <button @click="showUnlikeModal = false" class="px-4 py-2 rounded font-medium transition-all bg-transparent text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))/0.1]">キャンセル</button>
          <button 
            @click="unlikeItem" 
            class="px-4 py-2 rounded font-medium transition-all bg-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error-dark))] text-[rgb(var(--color-text-white))]"
            :disabled="unlikeSubmitting"
          >
            <svg v-if="unlikeSubmitting" class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ unlikeSubmitting ? '解除中...' : '解除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl } from '../../lib/storage';

const authStore = useAuthStore();

// 型定義
interface PostLike {
  user_id: string;
  post_id: string;
  created_at: string;
  post?: {
    id: string;
    title: string;
    excerpt?: string | null;
    published_at?: string | null;
    views?: number;
    author?: {
      id: string;
      nickname: string | null;
      avatar_data?: string | null;
    };
  };
}

interface CommentLike {
  user_id: string;
  comment_id: string;
  created_at: string;
  comment?: {
    id: string;
    content: string;
    post_id: string;
    created_at: string;
    author?: {
      id: string;
      nickname: string | null;
      avatar_data?: string | null;
    };
    post?: {
      id: string;
      title: string;
    };
  };
}

// タブ状態
const activeLikeType = ref<'post' | 'comment'>('post');

// 投稿いいね状態
const postLikes = ref<PostLike[]>([]);
const currentPostPage = ref(1);
const totalPostLikes = ref(0);

// コメントいいね状態
const commentLikes = ref<CommentLike[]>([]);
const currentCommentPage = ref(1);
const totalCommentLikes = ref(0);

// 共通状態
const pageSize = 10;
const loading = ref(true);
const showUnlikeModal = ref(false);
const unlikeSubmitting = ref(false);
const selectedPostLike = ref<PostLike | null>(null);
const selectedCommentLike = ref<CommentLike | null>(null);
const error = ref('');

// 計算プロパティ
const totalPostPages = computed(() => Math.ceil(totalPostLikes.value / pageSize));
const totalCommentPages = computed(() => Math.ceil(totalCommentLikes.value / pageSize));

// タブ変更時にデータを読み込む
watch(activeLikeType, (newType) => {
  if (newType === 'post') {
    if (postLikes.value.length === 0) {
      fetchPostLikes();
    }
  } else {
    if (commentLikes.value.length === 0) {
      fetchCommentLikes();
    }
  }
});

// 初期データ取得
onMounted(() => {
  fetchPostLikes();
});

// 投稿いいねの取得
async function fetchPostLikes() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // 合計数を取得
    const { count, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id);
    
    if (countError) throw countError;
    totalPostLikes.value = count || 0;
    
    // ページネーションの計算
    const from = (currentPostPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // いいねデータを取得
    const { data, error: likesError } = await supabase
      .from('post_likes')
      .select(`
        user_id,
        post_id,
        created_at,
        posts:post_id (
          id,
          title,
          excerpt,
          published_at,
          views,
          profiles:author_id (
            id,
            nickname,
            avatar_data
          )
        )
      `)
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (likesError) throw likesError;
    // データを正しい形式に変換
    const formattedData = (data || []).map((item: any) => {
      return {
        user_id: item.user_id,
        post_id: item.post_id,
        created_at: item.created_at,
        post: {
          id: item.posts.id,
          title: item.posts.title,
          excerpt: item.posts.excerpt,
          published_at: item.posts.published_at,
          views: item.posts.views,
          author: {
            id: item.posts.profiles.id,
            nickname: item.posts.profiles.nickname,
            avatar_data: item.posts.profiles.avatar_data
          }
        }
      } as PostLike;
    });
    postLikes.value = formattedData;
  } catch (err) {
    console.error('投稿いいね取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// コメントいいねの取得
async function fetchCommentLikes() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // 合計数を取得
    const { count, error: countError } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id);
    
    if (countError) throw countError;
    totalCommentLikes.value = count || 0;
    
    // ページネーションの計算
    const from = (currentCommentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // いいねデータを取得
    const { data, error: likesError } = await supabase
      .from('comment_likes')
      .select(`
        user_id,
        comment_id,
        created_at,
        comments:comment_id (
          id,
          content,
          post_id,
          created_at,
          profiles:author_id (
            id,
            nickname,
            avatar_data
          ),
          posts:post_id (
            id,
            title
          )
        )
      `)
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (likesError) throw likesError;
    // データを正しい形式に変換
    const formattedData = (data || []).map((item: any) => {
      return {
        user_id: item.user_id,
        comment_id: item.comment_id,
        created_at: item.created_at,
        comment: item.comments ? {
          id: item.comments.id,
          content: item.comments.content,
          post_id: item.comments.post_id,
          created_at: item.comments.created_at,
          author: item.comments.profiles ? {
            id: item.comments.profiles.id,
            nickname: item.comments.profiles.nickname,
            avatar_data: item.comments.profiles.avatar_data
          } : undefined,
          post: item.comments.posts ? {
            id: item.comments.posts.id,
            title: item.comments.posts.title
          } : undefined
        } : undefined
      } as CommentLike;
    });
    commentLikes.value = formattedData;
  } catch (err) {
    console.error('コメントいいね取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// 投稿いいねのページネーション
function changePostPage(page: number) {
  if (page < 1 || page > totalPostPages.value) return;
  currentPostPage.value = page;
  fetchPostLikes();
}

// コメントいいねのページネーション
function changeCommentPage(page: number) {
  if (page < 1 || page > totalCommentPages.value) return;
  currentCommentPage.value = page;
  fetchCommentLikes();
}

// 投稿いいねのページ番号配列を取得
function getPostPageNumbers() {
  return getPageNumbers(currentPostPage.value, totalPostPages.value);
}

// コメントいいねのページ番号配列を取得
function getCommentPageNumbers() {
  return getPageNumbers(currentCommentPage.value, totalCommentPages.value);
}

// ページ番号の配列を取得するヘルパー関数
function getPageNumbers(currentPage: number, totalPages: number) {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
  }
  
  return pages;
}

// 投稿いいね解除確認
function confirmUnlikePost(like: PostLike) {
  selectedPostLike.value = like;
  selectedCommentLike.value = null;
  showUnlikeModal.value = true;
}

// コメントいいね解除確認
function confirmUnlikeComment(like: CommentLike) {
  selectedCommentLike.value = like;
  selectedPostLike.value = null;
  showUnlikeModal.value = true;
}

// いいね解除（投稿またはコメント）
async function unlikeItem() {
  if (!authStore.user) {
    error.value = 'ユーザー情報が取得できません';
    return;
  }
  
  unlikeSubmitting.value = true;
  
  try {
    if (activeLikeType.value === 'post' && selectedPostLike.value) {
      await unlikePost();
    } else if (activeLikeType.value === 'comment' && selectedCommentLike.value) {
      await unlikeComment();
    }
    
    showUnlikeModal.value = false;
  } catch (err) {
    console.error('いいね解除エラー:', err);
    alert('いいねの解除に失敗しました');
  } finally {
    unlikeSubmitting.value = false;
  }
}

// 投稿いいね解除
async function unlikePost() {
  if (!selectedPostLike.value || !authStore.user) return;
  
  // いいねを削除
  const { error: deleteError } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', selectedPostLike.value.post_id)
    .eq('user_id', authStore.user.id);
  
  if (deleteError) throw deleteError;
  
  // リストから削除
  postLikes.value = postLikes.value.filter(l => l.post_id !== selectedPostLike.value!.post_id);
  totalPostLikes.value--;
  
  // ページが空になった場合は前のページに戻る
  if (postLikes.value.length === 0 && currentPostPage.value > 1) {
    currentPostPage.value--;
    fetchPostLikes();
  }
}

// コメントいいね解除
async function unlikeComment() {
  if (!selectedCommentLike.value || !authStore.user) return;
  
  // いいねを削除
  const { error: deleteError } = await supabase
    .from('comment_likes')
    .delete()
    .eq('comment_id', selectedCommentLike.value.comment_id)
    .eq('user_id', authStore.user.id);
  
  if (deleteError) throw deleteError;
  
  // リストから削除
  commentLikes.value = commentLikes.value.filter(l => l.comment_id !== selectedCommentLike.value!.comment_id);
  totalCommentLikes.value--;
  
  // ページが空になった場合は前のページに戻る
  if (commentLikes.value.length === 0 && currentCommentPage.value > 1) {
    currentCommentPage.value--;
    fetchCommentLikes();
  }
}

// 日付フォーマット
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateString;
  }
}

// ヘルパー関数
function getInitials(name: string): string {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}
</script> 