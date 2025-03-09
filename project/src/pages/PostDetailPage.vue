<template>
  <div class="post-detail max-w-5xl mx-auto my-8 md:my-12">
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card p-8 flex justify-center items-center min-h-[300px]">
      <div class="flex flex-col items-center">
        <div class="loading-spinner mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400 animate-pulse">投稿を読み込んでいます...</p>
      </div>
    </div>
    
    <!-- エラー状態 -->
    <div v-else-if="error" class="glass-card p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">投稿の読み込みに失敗しました</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
      <router-link to="/" class="btn btn-primary transition-transform hover:scale-105">ホームに戻る</router-link>
    </div>
    
    <!-- 投稿が見つからない -->
    <div v-else-if="!post" class="glass-card p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500 mx-auto mb-4 transform rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">投稿が見つかりませんでした</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">お探しの投稿は削除されたか、存在しない可能性があります。</p>
      <router-link to="/" class="btn btn-primary transition-transform hover:scale-105">ホームに戻る</router-link>
    </div>
    
    <!-- 投稿表示 -->
    <template v-else>
      <!-- 投稿全体を一つのカードに結合 -->
      <div class="glass-card overflow-hidden shadow-lg rounded-lg transition-all duration-300">
        <!-- ヘッダー部分 - アイキャッチと投稿情報を横並びに -->
        <div class="flex flex-col md:flex-row">
          <!-- 左側 - アイキャッチ画像 -->
          <div v-if="post.cover_image_path" class="relative md:w-1/3 h-40 md:h-[200px] bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <img 
              :src="getImageUrl(post.cover_image_path)" 
              :alt="post.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <!-- カテゴリーを画像内に配置 -->
            <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div class="flex flex-wrap gap-1.5">
                <router-link 
                  v-for="category in postCategories" 
                  :key="category.id" 
                  :to="`/categories/${category.id}`"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/80 hover:bg-primary text-white transition-all"
                >
                  {{ category.name }}
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 右側 - 投稿情報 -->
          <div class="p-5 md:p-6 flex-1 flex flex-col justify-between">
            <!-- タイトル -->
            <h1 class="text-xl md:text-2xl font-bold mb-3 leading-tight">{{ post.title }}</h1>
            
            <!-- 閲覧数・更新情報 -->
            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span class="flex items-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {{ post.views || 0 }}
              </span>
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDate(post.updated_at || post.created_at) }}
              </span>
            </div>
            
            <!-- 著者情報と操作ボタン -->
            <div class="flex flex-row justify-between items-center mb-2">
              <!-- 著者情報 -->
              <router-link :to="`/profile/${post.author_id}`" class="flex items-center group">
                <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white mr-3 overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                  <img 
                    v-if="post.profiles?.avatar_data" 
                    :src="getAvatarUrl(post.profiles.avatar_data)" 
                    :alt="post.profiles?.nickname || '不明なユーザー'"
                    class="w-full h-full rounded-full object-cover"
                  />
                  <span v-else>{{ getInitials(post.profiles?.nickname || '不明なユーザー') }}</span>
                </div>
                <div>
                  <p class="text-base font-medium group-hover:text-primary transition-colors">
                    {{ post.profiles?.nickname || '不明なユーザー' }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                    {{ formatDate(post.created_at) }}
                  </p>
                </div>
              </router-link>
              
              <!-- アクションボタン -->
              <div class="flex space-x-2">
                <!-- いいねボタン -->
                <button 
                  @click="toggleLike" 
                  class="action-btn"
                  :class="{ 'liked-btn': isLiked }"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isLiked }">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ likeCount }}</span>
                </button>
                
                <!-- シェアボタン -->
                <button 
                  @click="sharePost" 
                  class="action-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>シェア</span>
                </button>
                
                <!-- 投稿の編集/削除 (投稿者または管理者のみ) -->
                <div v-if="isAuthor" class="flex space-x-2">
                  <router-link 
                    :to="`/posts/${post.id}/edit`" 
                    class="action-btn edit-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>編集</span>
                  </router-link>
                  <button 
                    @click="confirmDelete" 
                    class="action-btn delete-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>削除</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 投稿情報 -->
        <div class="p-5 md:p-6 border-t border-gray-200 dark:border-gray-700">
          <!-- 投稿本文 -->
          <div class="prose-container max-w-none">
            <RichTextContent :content="post.content" />
          </div>
          
          <!-- 区切り線 -->
          <div class="my-6 border-t border-gray-200 dark:border-gray-700"></div>
          
          <!-- コメントセクション -->
          <div class="mt-8 pb-12" id="comments">
            <h2 class="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              コメント <span class="text-gray-500 dark:text-gray-400 ml-2">{{ comments.length }}</span>
            </h2>
            
            <!-- コメント入力フォーム -->
            <div class="mb-8 comment-form-wrapper">
              <CommentForm 
                :post-id="post.id" 
                @comment-added="handleCommentAdded"
              />
            </div>
            
            <!-- コメント一覧 -->
            <div class="space-y-6">
              <CommentItem 
                v-for="comment in rootComments" 
                :key="comment.id" 
                :comment="comment"
                @comment-updated="fetchComments"
                @comment-deleted="handleCommentDeleted"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 関連投稿 -->
      <div v-if="relatedPosts.length > 0" class="mt-8 mb-6">
        <h2 class="text-lg font-bold mb-4 flex items-center">
          <svg class="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          関連投稿
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PostCard v-for="relatedPost in relatedPosts" :key="relatedPost.id" :post="relatedPost" />
        </div>
      </div>
    </template>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="glass-card p-8 max-w-md mx-auto rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 animate__animated animate__fadeInUp">
        <svg class="w-16 h-16 text-red-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        <h3 class="text-xl font-bold mb-4 text-center">投稿を削除しますか？</h3>
        <p class="mb-8 text-gray-600 dark:text-gray-400 text-center">この操作は取り消せません。本当にこの投稿を削除しますか？</p>
        <div class="flex justify-center space-x-4">
          <button 
            @click="showDeleteModal = false" 
            class="modal-btn cancel-btn"
          >
            キャンセル
          </button>
          <button 
            @click="deletePost" 
            class="modal-btn delete-confirm-btn"
            :disabled="deleteSubmitting"
          >
            <svg v-if="deleteSubmitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ deleteSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- シェア成功通知 -->
    <div v-if="showShareNotification" class="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-lg shadow-lg animate__animated animate__fadeInUp">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>URLをコピーしました</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import PostCard from '../components/post/PostCard.vue';
import RichTextContent from '../components/editor/RichTextContent.vue';
import CommentForm from '../components/comment/CommentForm.vue';
import CommentItem from '../components/comment/CommentItem.vue';
import { getProfileImageUrl, getCoverImageUrl } from '../lib/storage';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 状態
const post = ref<any>(null);
const postCategories = ref<any[]>([]);
const comments = ref<any[]>([]);
const relatedPosts = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isLiked = ref(false);
const likeCount = ref(0);
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const showShareNotification = ref(false);

// 投稿の著者かどうか
const isAuthor = computed(() => {
  return authStore.isAuthenticated && authStore.user?.id === post.value?.author_id;
});

// ルートコメントのみを取得（親コメントがないもの）
const rootComments = computed(() => {
  return comments.value.filter(comment => !comment.parent_comment_id);
});

// 投稿データの取得
async function fetchPostData() {
  loading.value = true;
  error.value = null;
  
  try {
    const postId = route.params.id as string;
    
    // 投稿データの取得
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id(*),
        post_categories(category_id)
      `)
      .eq('id', postId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!data) {
      error.value = '投稿が見つかりませんでした';
      loading.value = false;
      return;
    }
    
    post.value = data;
    
    // カテゴリーの取得
    if (data.post_categories && data.post_categories.length > 0) {
      const categoryIds = data.post_categories.map((pc: any) => pc.category_id);
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds);
        
      if (categoriesError) throw categoriesError;
      postCategories.value = categoriesData || [];
    } else {
      postCategories.value = [];
    }
    
    // コメントの取得
    await fetchComments();
    
    // いいね状態の確認
    await checkIfLiked();
    
    // いいね数の取得
    await fetchLikeCount();
    
    // 閲覧数の更新
    await incrementViewCount();
    
    // 関連投稿の取得
    await fetchRelatedPosts();
  } catch (err: any) {
    console.error('投稿データ取得エラー:', err);
    error.value = '投稿データの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// コメント取得
async function fetchComments() {
  try {
    const { data, error: commentsError } = await supabase
      .from('comments')
      .select('*, profiles:author_id(*)')
      .eq('post_id', route.params.id as string)
      .order('created_at', { ascending: true });
    
    if (commentsError) throw commentsError;
    
    comments.value = data || [];
  } catch (err: any) {
    console.error('コメント取得エラー:', err);
  }
}

// いいね状態の確認
async function checkIfLiked() {
  if (!authStore.isAuthenticated || !authStore.user) return;
  
  try {
    const { data, error } = await supabase
      .from('post_likes')  // 正しいテーブル名
      .select('*')
      .eq('post_id', post.value.id)
      .eq('user_id', authStore.user.id);
    
    if (error) throw error;
    isLiked.value = data && data.length > 0;
  } catch (err) {
    console.error('いいね状態取得エラー:', err);
  }
}

// いいね数の取得
async function fetchLikeCount() {
  try {
    const { count, error } = await supabase
      .from('post_likes')  // 正しいテーブル名
      .select('*', { count: 'exact' })
      .eq('post_id', post.value.id);
    
    if (error) throw error;
    likeCount.value = count || 0;
  } catch (err) {
    console.error('いいね数取得エラー:', err);
    likeCount.value = 0;
  }
}

// いいねの切り替え
async function toggleLike() {
  if (!authStore.isAuthenticated || !authStore.user) {
    router.push('/login');
    return;
  }
  
  try {
    if (isLiked.value) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('post_likes')  // 正しいテーブル名
        .delete()
        .eq('post_id', post.value.id)
        .eq('user_id', authStore.user.id);
      
      if (deleteError) throw deleteError;
      
      isLiked.value = false;
      likeCount.value--;
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('post_likes')  // 正しいテーブル名
        .insert({
          post_id: post.value.id,
          user_id: authStore.user.id
        });
      
      if (insertError) throw insertError;
      
      isLiked.value = true;
      likeCount.value++;
    }
  } catch (err) {
    console.error('いいね切り替えエラー:', err);
  }
}

// 閲覧数の更新
async function incrementViewCount() {
  try {
    await supabase.rpc('increment_post_views', {
      post_id: post.value.id
    });
  } catch (err) {
    console.error('閲覧数更新エラー:', err);
  }
}

// 関連投稿の取得
async function fetchRelatedPosts() {
  try {
    // カテゴリーIDのリストを取得
    const categoryIds = postCategories.value.map(category => category.id);
    
    if (categoryIds.length === 0) return;
    
    const { data, error: relatedError } = await supabase
      .from('post_categories')
      .select(`
        posts:post_id (
          *,
          profiles:author_id (*)
        )
      `)
      .in('category_id', categoryIds)
      .neq('post_id', post.value.id)
      .limit(3);
    
    if (relatedError) throw relatedError;
    
    // 重複を除去して整形
    const uniquePosts = new Map();
    data?.forEach(item => {
      const post = Array.isArray(item.posts) ? item.posts[0] : item.posts;
      if (post && post.id && !uniquePosts.has(post.id)) {
        uniquePosts.set(post.id, post);
      }
    });
    
    relatedPosts.value = Array.from(uniquePosts.values());
  } catch (err) {
    console.error('関連投稿取得エラー:', err);
  }
}

// コメント追加時の処理
function handleCommentAdded(newComment: any) {
  comments.value.push(newComment);
}

// コメント削除時の処理
function handleCommentDeleted(commentId: string) {
  comments.value = comments.value.filter(c => c.id !== commentId && c.parent_comment_id !== commentId);
}

// confirmDelete関数を定義
function confirmDelete() {
  showDeleteModal.value = true;
}

// 投稿削除
async function deletePost() {
  deleteSubmitting.value = true;
  
  try {
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.value.id);
    
    if (deleteError) throw deleteError;
    
    showDeleteModal.value = false;
    router.push('/');
  } catch (err) {
    console.error('投稿削除エラー:', err);
  } finally {
    deleteSubmitting.value = false;
  }
}

// 投稿のシェア
async function sharePost() {
  try {
    if (navigator.share) {
      await navigator.share({
        title: post.value.title,
        text: post.value.excerpt || '投稿を見る',
        url: window.location.href
      });
    } else {
      // クリップボードにコピー
      await navigator.clipboard.writeText(window.location.href);
      
      // 通知を表示
      showShareNotification.value = true;
      setTimeout(() => {
        showShareNotification.value = false;
      }, 3000);
    }
  } catch (err) {
    console.error('シェアエラー:', err);
  }
}

// ヘルパー関数
function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getImageUrl(path: string): string {
  return getCoverImageUrl(path);
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

// 初期データ取得
onMounted(() => {
  fetchPostData();
});
</script>

<style scoped lang="postcss">
/* ローディングスピナー */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: 50%;
  border-top-color: rgba(var(--color-primary-rgb), 1);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* アクションボタン共通スタイル */
.action-btn {
  @apply flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:shadow-md;
}

.action-btn:hover {
  @apply transform -translate-y-0.5;
}

/* いいねボタン */
.action-btn.liked-btn {
  @apply text-primary dark:text-primary-light border-primary/30 dark:border-primary-light/30 bg-primary/5 dark:bg-primary-light/10;
}

/* 編集ボタン */
.action-btn.edit-btn {
  @apply text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20;
}

/* 削除ボタン */
.action-btn.delete-btn {
  @apply text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20;
}

/* モーダルボタン */
.modal-btn {
  @apply px-6 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.modal-btn.cancel-btn {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600;
}

.modal-btn.delete-confirm-btn {
  @apply bg-red-600 text-white flex items-center justify-center hover:bg-red-700 focus:ring-red-500;
  min-width: 120px;
}

.modal-btn:disabled {
  @apply opacity-70 cursor-not-allowed;
}

/* コメントフォームのスタイル強化 - 修正版 */
.comment-form-wrapper :deep(.comment-form) {
  @apply transition-all duration-300 shadow-sm hover:shadow rounded-lg overflow-hidden;
  max-width: 100%;
}

/* ダークモード用に別のセレクタを定義 */
:global(.dark) .comment-form-wrapper :deep(.comment-form) {
  @apply bg-gray-900/90;
}

.comment-form-wrapper :deep(.comment-form textarea) {
  @apply transition-all duration-200 focus:shadow-inner bg-white
    text-gray-800 border-gray-200
    focus:ring-2 focus:ring-primary/30;
}

/* ダークモード用に別のセレクタを定義 */
:global(.dark) .comment-form-wrapper :deep(.comment-form textarea) {
  @apply bg-gray-900 text-gray-50 border-gray-800 focus:ring-primary-light/30;
}

.comment-form-wrapper :deep(.comment-form .submit-button) {
  @apply transition-transform duration-200 bg-primary text-white
    hover:bg-primary-dark;
}

/* ダークモード用に別のセレクタを定義 */
:global(.dark) .comment-form-wrapper :deep(.comment-form .submit-button) {
  @apply bg-primary-dark hover:bg-primary/90;
}

/* 記事本文のスタイル強化 - 修正版 */
.prose-container :deep(h2) {
  @apply text-xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200;
}

:global(.dark) .prose-container :deep(h2) {
  @apply border-gray-700;
}

.prose-container :deep(a) {
  @apply text-primary hover:underline;
}

:global(.dark) .prose-container :deep(a) {
  @apply text-primary-light;
}

.prose-container :deep(blockquote) {
  @apply pl-4 border-l-4 border-primary italic my-4 text-gray-700;
}

:global(.dark) .prose-container :deep(blockquote) {
  @apply text-gray-300;
}

.prose-container :deep(pre) {
  @apply bg-gray-100 p-4 rounded-lg overflow-x-auto my-4;
}

:global(.dark) .prose-container :deep(pre) {
  @apply bg-gray-800;
}

.prose-container :deep(code) {
  @apply bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono;
}

:global(.dark) .prose-container :deep(code) {
  @apply bg-gray-800;
}

/* アニメーション */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.post-detail {
  animation: fadeIn 0.5s ease forwards;
}

/* Animate.css のミニマル版 */
.animate__animated {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

.animate__fadeInUp {
  animation-name: fadeInUp;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* スタイルを追加 */
.glass-card {
  background-color: rgba(255, 255, 255, 0.8);
}

@media (prefers-color-scheme: dark) {
  .glass-card {
    background-color: #1a1e2d !important;
  }
  
  .comment-form-wrapper, 
  .comment-form-wrapper .comment-form,
  .comment-form-wrapper + div {
    background-color: #1a1e2d !important;
  }
}

.dark .glass-card {
  background-color: #1a1e2d !important;
}

/* コメントフォームのスタイル強化（修正版） */
.comment-form-wrapper {
  background-color: #1a1e2d !important;
}

.dark .comment-form-wrapper :deep(.comment-form),
.dark .comment-form-wrapper + div {
  background-color: #1a1e2d !important;
  border-color: #2d3748 !important;
}
</style> 