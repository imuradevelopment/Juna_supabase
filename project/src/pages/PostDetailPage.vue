<template>
  <div class="max-w-5xl mx-auto my-8 animate-[fadeIn_0.5s_ease_forwards] md:my-12">
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card flex items-center justify-center min-h-[300px] p-8">
      <div class="flex flex-col items-center">
        <div class="w-10 h-10 rounded-full border-3 border-text-white/10 border-t-primary animate-spin mb-4"></div>
        <p class="text-text-muted animate-pulse">投稿を読み込んでいます...</p>
      </div>
    </div>
    
    <!-- エラー状態 -->
    <div v-else-if="error" class="glass-card flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-error animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">投稿の読み込みに失敗しました</h2>
      <p class="text-text-muted mb-4">{{ error }}</p>
      <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
    </div>
    
    <!-- 投稿が見つからない -->
    <div v-else-if="!post" class="glass-card flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-text-muted transform rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">投稿が見つかりませんでした</h2>
      <p class="text-text-muted mb-4">お探しの投稿は削除されたか、存在しない可能性があります。</p>
      <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
    </div>
    
    <!-- 投稿表示 -->
    <template v-else>
      <!-- 投稿全体を一つのカードに結合 -->
      <div class="glass-card overflow-hidden rounded-lg shadow-background/30 transition-all duration-300">
        <!-- ヘッダー部分 - アイキャッチと投稿情報を横並びに -->
        <div class="flex flex-col md:flex-row">
          <!-- 左側 - アイキャッチ画像 -->
          <div v-if="post.cover_image_path" class="relative h-40 overflow-hidden bg-surface-variant md:w-1/3 md:h-[200px]">
            <img 
              :src="getImageUrl(post.cover_image_path)" 
              :alt="post.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <!-- カテゴリを画像内に配置 -->
            <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div class="flex flex-wrap gap-1.5">
                <router-link 
                  v-for="category in postCategories" 
                  :key="category.id" 
                  :to="`/categories/${category.id}`"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/80 text-text-white transition-all hover:bg-primary"
                >
                  {{ category.name }}
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- 右側 - 投稿情報 -->
          <div class="flex flex-col justify-between flex-1 p-5 md:p-6">
            <!-- タイトル -->
            <h1 class="text-xl font-bold mb-3 leading-tight text-heading md:text-2xl">{{ post.title }}</h1>
            
            <!-- 閲覧数・更新情報 -->
            <div class="flex items-center mb-3 text-sm text-text-muted">
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
                <p class="flex items-center text-xs text-text-muted">
                  {{ formatDate(post.updated_at || post.created_at) }}
                </p>
              </span>
            </div>
            
            <!-- 著者情報と操作ボタン -->
            <div class="flex flex-row items-center justify-between mb-2">
              <!-- 著者情報 -->
              <router-link :to="`/profile/${post.author_id}`" class="flex items-center group">
                <div class="flex items-center justify-center w-10 h-10 mr-3 overflow-hidden text-text-white bg-primary-light rounded-full border-2 border-transparent transition-all group-hover:border-primary">
                  <img 
                    v-if="post.profiles?.avatar_data" 
                    :src="getAvatarUrl(post.profiles.avatar_data)" 
                    :alt="post.profiles?.nickname || '不明なユーザー'"
                    class="w-full h-full object-cover rounded-full"
                  />
                  <span v-else>{{ getInitials(post.profiles?.nickname || '不明なユーザー') }}</span>
                </div>
                <div>
                  <p class="text-base font-medium text-text transition-colors group-hover:text-primary">
                    {{ post.profiles?.nickname || '不明なユーザー' }}
                  </p>
                  <p class="flex items-center text-xs text-text-muted">
                    {{ formatDate(post.created_at) }}
                  </p>
                </div>
              </router-link>
              
              <!-- アクションボタン -->
              <div class="flex space-x-2">
                <!-- いいねボタン -->
                <button 
                  @click="toggleLike" 
                  class="btn btn-outline-primary"
                  :class="{ 'text-primary-light': isLiked }"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isLiked }">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ likeCount }}</span>
                </button>
                
                <!-- シェアボタン -->
                <button 
                  @click="sharePost" 
                  class="btn btn-outline-info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>シェア</span>
                </button>
                
                <!-- 投稿の編集/削除 (投稿者または管理者のみ) -->
                <div v-if="isAuthor" class="flex space-x-2">
                  <router-link 
                    :to="`/editor/${post.id}`" 
                    class="btn btn-outline-warning"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>編集</span>
                  </router-link>
                  
                  <button 
                    @click="showDeleteModal = true" 
                    class="btn btn-outline-error"
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
        
        <!-- 記事本文 -->
        <div class="p-6">
          <RichTextContent 
            :content="post.content"
          />
        </div>
      </div>
      
      <!-- コメントセクション -->
      <div class="mt-10">
        <h3 class="text-xl font-bold mb-4 text-heading">コメント {{ commentCount }}件</h3>
        <div class="bg-surface">
          <CommentSystem 
            :post-id="post.id" 
            @comments-updated="updateCommentCount"
            class="[&_.comment-form]:transition-all [&_.comment-form]:duration-300 [&_.comment-form]:shadow-background/10 [&_.comment-form]:hover:shadow-background/20 [&_.comment-form]:rounded-lg [&_.comment-form]:overflow-hidden [&_.comment-form]:max-w-full [&_.comment-form_textarea]:transition-all [&_.comment-form_textarea]:duration-200 [&_.comment-form_textarea]:focus:shadow-background/10 [&_.comment-form_textarea]:focus:ring-2 [&_.comment-form_textarea]:bg-surface [&_.comment-form_textarea]:text-text [&_.comment-form_textarea]:border-border [&_.comment-form_.submit-button]:transition-transform [&_.comment-form_.submit-button]:duration-200 [&_.comment-form_.submit-button]:bg-primary [&_.comment-form_.submit-button]:text-text-white [&_.comment-form_.submit-button]:hover:bg-primary-dark"
          />
        </div>
      </div>
      
      <!-- シェアモーダル -->
      <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="glass-card w-full max-w-sm p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-4 text-heading">この投稿をシェア</h3>
          
          <div class="space-y-4">
            <div>
              <div class="flex mb-4 space-x-4">
                <button 
                  @click="shareVia('twitter')" 
                  class="btn btn-info flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                  <span class="ml-2">X (Twitter)</span>
                </button>
                
                <button 
                  @click="shareVia('facebook')" 
                  class="btn btn-primary-dark flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                  <span class="ml-2">Facebook</span>
                </button>
              </div>
              
              <div>
                <p class="mb-2 text-sm text-text">または、リンクをコピー:</p>
                <div class="flex">
                  <input 
                    type="text" 
                    :value="pageUrl" 
                    class="flex-1 px-3 py-2 rounded-l border border-border bg-surface text-text"
                    readonly
                    ref="urlInput"
                  />
                  <button 
                    @click="copyPageUrl" 
                    class="btn btn-primary"
                  >
                    <span v-if="copied">コピー済み</span>
                    <span v-else>コピー</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button 
                @click="showShareModal = false" 
                class="btn btn-ghost"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 削除確認モーダル -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="glass-card w-full max-w-sm p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-4 text-heading">投稿を削除しますか？</h3>
          <p class="mb-6 text-text-muted">
            この操作は取り消せません。本当にこの投稿を削除しますか？
          </p>
          <div class="flex justify-end space-x-4">
            <button 
              @click="showDeleteModal = false" 
              class="btn btn-ghost"
            >
              キャンセル
            </button>
            <button 
              @click="deletePost" 
              class="btn btn-error"
              :disabled="deleteSubmitting"
            >
              {{ deleteSubmitting ? '削除中...' : '削除する' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import RichTextContent from '../components/PostDetailPage/RichTextContent.vue';
import CommentSystem from '../components/PostDetailPage/CommentSystem.vue';
import { getProfileImageUrl, getCoverImageUrl } from '../lib/storage';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 投稿ID
const postId = route.params.id;

// 状態
const post = ref<any>(null);
const postCategories = ref<any[]>([]);
const loading = ref(true);
const error = ref('');
const isLiked = ref(false);
const likeCount = ref(0);
const commentCount = ref(0);
const pageUrl = ref('');
const copied = ref(false);
const showShareModal = ref(false);
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const urlInput = ref<HTMLInputElement | null>(null);

// 投稿の著者かどうか
const isAuthor = computed(() => {
  return authStore.user && post.value && post.value.author_id === authStore.user.id;
});

// 投稿取得
async function fetchPost() {
  loading.value = true;
  error.value = '';
  
  try {
    // 投稿データ取得
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          nickname,
          avatar_data,
          bio
        )
      `)
      .eq('id', postId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!data) {
      error.value = '投稿が見つかりませんでした';
      return;
    }
    
    if (!data.published && (!authStore.user || data.author_id !== authStore.user.id)) {
      error.value = 'この投稿は公開されていません';
      return;
    }
    
    post.value = data;
    
    // カテゴリ取得
    fetchCategories();
    
    // 投稿閲覧数を更新
    incrementViews();
    
    // いいね数と状態を取得
    fetchLikes();
    checkIfLiked();
    
    // ページURLを設定
    pageUrl.value = window.location.href;
  } catch (err: any) {
    console.error('投稿取得エラー:', err);
    error.value = err.message || '投稿の読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// カテゴリ取得
async function fetchCategories() {
  try {
    const { data, error: categoriesError } = await supabase
      .from('post_categories')
      .select('categories(*)')
      .eq('post_id', postId);
    
    if (categoriesError) throw categoriesError;
    
    postCategories.value = data?.map(item => item.categories) || [];
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
  }
}

// 閲覧数インクリメント
async function incrementViews() {
  if (!post.value) return;
  
  try {
    // 既存の閲覧数を取得
    const currentViews = post.value.views || 0;
    
    // 閲覧数を+1して更新
    const { error: updateError } = await supabase
      .from('posts')
      .update({ views: currentViews + 1 })
      .eq('id', postId);
    
    if (updateError) throw updateError;
    
    // UIに反映
    post.value.views = currentViews + 1;
  } catch (err) {
    console.error('閲覧数更新エラー:', err);
  }
}

// いいね数取得
async function fetchLikes() {
  try {
    const { count, error: likesError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact' })
      .eq('post_id', postId);
    
    if (likesError) throw likesError;
    likeCount.value = count || 0;
  } catch (err) {
    console.error('いいね数取得エラー:', err);
  }
}

// いいね状態確認
async function checkIfLiked() {
  if (!authStore.isAuthenticated || !authStore.user) return;
  
  try {
    const { data, error: likeError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', authStore.user.id)
      .maybeSingle();
    
    if (likeError) throw likeError;
    isLiked.value = !!data;
  } catch (err) {
    console.error('いいね状態確認エラー:', err);
  }
}

// いいね切り替え
async function toggleLike() {
  if (!authStore.isAuthenticated) {
    // ログインページにリダイレクト
    router.push('/auth');
    return;
  }
  
  try {
    if (isLiked.value) {
      // いいね解除
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', authStore.user!.id);
      
      if (deleteError) {
        console.error('いいね解除エラー:', deleteError);
        throw deleteError;
      }
      
      isLiked.value = false;
      likeCount.value -= 1;
    } else {
      // いいね追加
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: authStore.user!.id
        });
      
      if (insertError) {
        console.error('いいね追加エラー:', insertError.message);
        throw insertError;
      }
      
      isLiked.value = true;
      likeCount.value += 1;
    }
  } catch (err) {
    console.error('いいね切り替えエラー:', err);
  }
}

// コメント数の更新
function updateCommentCount(count: number) {
  commentCount.value = count;
}

// 投稿シェア
function sharePost() {
  showShareModal.value = true;
}

// ソーシャルメディアでシェア
function shareVia(platform: string) {
  let shareUrl = '';
  const encodedUrl = encodeURIComponent(window.location.href);
  const encodedTitle = encodeURIComponent(post.value?.title || '');
  
  if (platform === 'twitter') {
    shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  } else if (platform === 'facebook') {
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  } else if (platform === 'line') {
    shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank');
  }
  
  showShareModal.value = false;
}

// URLコピー
function copyPageUrl() {
  if (urlInput.value) {
    urlInput.value.select();
    document.execCommand('copy');
    copied.value = true;
    
    setTimeout(() => {
      copied.value = false;
    }, 3000);
  }
}

// 投稿削除
async function deletePost() {
  if (!authStore.user || !isAuthor.value) return;
  
  deleteSubmitting.value = true;
  
  try {
    // 投稿を削除
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // 削除モーダルを閉じる
    showDeleteModal.value = false;
    
    // ホームページにリダイレクト
    router.push('/');
  } catch (err: any) {
    console.error('投稿削除エラー:', err);
    alert('投稿の削除に失敗しました');
  } finally {
    deleteSubmitting.value = false;
  }
}

// 日付フォーマット
function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

// 画像URL取得
function getImageUrl(path: string): string {
  return getCoverImageUrl(path);
}

// アバターURL取得
function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

// イニシャル取得
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

// 初期化
onMounted(() => {
  fetchPost();
});

// ルートパラメータが変更されたら再取得
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchPost();
  }
});
</script>

<style scoped lang="postcss">
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 