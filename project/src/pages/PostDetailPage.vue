<template>
  <div class="max-w-5xl mx-auto my-8 animate-[fadeIn_0.5s_ease_forwards] md:my-12">
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card flex items-center justify-center min-h-[300px] p-8">
      <div class="flex flex-col items-center">
        <PhSpinner class="w-10 h-10 animate-spin text-primary mb-4" />
        <p class="text-text-muted animate-pulse">投稿を読み込んでいます...</p>
      </div>
    </div>
    
    <!-- エラー状態 -->
    <div v-else-if="error" class="glass-card flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <PhWarning class="h-16 w-16 mx-auto mb-4 text-error animate-pulse" />
      <h2 class="text-xl font-bold mb-2">投稿の読み込みに失敗しました</h2>
      <p class="text-text-muted mb-4">{{ error }}</p>
      <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
    </div>
    
    <!-- 投稿が見つからない -->
    <div v-else-if="!post" class="glass-card flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <PhSmiley class="h-16 w-16 mx-auto mb-4 text-text-muted transform rotate-12" />
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
                <PhEye class="h-4 w-4 mr-1" />
                {{ post.views || 0 }}
              </span>
              <span class="flex items-center">
                <PhClock class="h-4 w-4 mr-1" />
                <p class="flex items-center text-xs text-text-muted">
                  {{ formatDate(post.updated_at || post.created_at) }}
                </p>
              </span>
            </div>
            
            <!-- 著者情報と操作ボタン -->
            <div class="flex flex-col space-y-4 mb-4">
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
                  <p class="text-xs text-text-muted">
                    {{ formatDate(post.created_at) }}
                  </p>
                </div>
              </router-link>
              
              <!-- アクションボタン -->
              <div class="flex flex-wrap gap-2">
                <!-- いいねボタン -->
                <button 
                  @click="toggleLike" 
                  class="btn btn-outline-primary btn-sm"
                  :class="{ 'text-primary-light': isLiked }"
                >
                  <PhHeart class="h-5 w-5 mr-1.5" :weight="isLiked ? 'fill' : 'regular'" />
                  <span>{{ likeCount }}</span>
                </button>
                
                <!-- シェアボタン -->
                <button 
                  @click="sharePost" 
                  class="btn btn-outline-info btn-sm"
                >
                  <PhShareNetwork class="h-5 w-5 mr-1.5" />
                  <span>シェア</span>
                </button>
                
                <!-- 投稿の編集/削除 (投稿者または管理者のみ) -->
                <template v-if="isAuthor">
                  <router-link 
                    :to="`/editor/${post.id}`" 
                    class="btn btn-outline-warning btn-sm"
                  >
                    <PhPencilSimple class="h-5 w-5 mr-1.5" />
                    <span>編集</span>
                  </router-link>
                  
                  <button 
                    @click="showDeleteModal = true" 
                    class="btn btn-outline-error btn-sm"
                  >
                    <PhTrash class="h-5 w-5 mr-1.5" />
                    <span>削除</span>
                  </button>
                </template>
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
      
      <!-- 関連投稿セクション -->
      <div class="mt-10">
        <h3 class="text-xl font-bold mb-6 text-heading border-b border-border-light pb-3">関連投稿</h3>
        
        <!-- ローディング表示 -->
        <div v-if="loadingRelatedPosts" class="flex justify-center p-6">
          <PhSpinner class="h-8 w-8 animate-spin text-primary-light" />
        </div>
        
        <!-- 関連投稿がない場合 -->
        <div v-else-if="relatedPosts.length === 0" class="text-center py-8 text-text-muted">
          関連投稿はありません
        </div>
        
        <!-- 関連投稿一覧 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PostCard 
            v-for="relatedPost in relatedPosts" 
            :key="relatedPost.id" 
            :post="relatedPost"
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
              <div class="flex mb-4 justify-center">
                <button 
                  @click="shareVia('twitter')" 
                  class="btn btn-info"
                >
                  <PhTwitterLogo class="h-5 w-5" />
                  <span class="ml-2">X (Twitter)</span>
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
                    <span v-if="copied"><PhCopy class="h-5 w-5 mr-1.5" />コピー済み</span>
                    <span v-else><PhCopy class="h-5 w-5 mr-1.5" />コピー</span>
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
              <PhSpinner v-if="deleteSubmitting" class="h-5 w-5 mr-1.5 animate-spin" />
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
import PostCard from '../components/common/PostCard.vue';
import { getProfileImageUrl, getCoverImageUrl } from '../lib/storage';
import { 
  PhSpinner,
  PhWarning,
  PhSmiley,
  PhEye,
  PhClock,
  PhHeart,
  PhShareNetwork,
  PhPencilSimple,
  PhTrash,
  PhTwitterLogo,
  PhCopy
} from '@phosphor-icons/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 投稿ID
const postId = route.params.id;

// 投稿情報
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

// 関連投稿
const relatedPosts = ref<any[]>([]);
const loadingRelatedPosts = ref(true);

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
    
    // 関連投稿を取得
    fetchRelatedPosts();
    
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
  if (typeof count === 'number') {
    commentCount.value = count;
  }
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

// 関連投稿の取得
async function fetchRelatedPosts() {
  if (!postId) return;
  
  try {
    loadingRelatedPosts.value = true;
    
    const { data, error } = await supabase
      .rpc('get_related_posts', { 
        input_post_id: postId,
        limit_count: 3
      });
      
    if (error) throw error;
    relatedPosts.value = data || [];
    
  } catch (err) {
    console.error('関連投稿取得エラー:', err);
    relatedPosts.value = [];
    
    // エラー時にフォールバック関数を使用
    try {
      relatedPosts.value = await getFallbackRelatedPosts();
    } catch (fallbackErr) {
      console.error('フォールバック投稿取得エラー:', fallbackErr);
    }
  } finally {
    loadingRelatedPosts.value = false;
  }
}

// フォールバック用の関連投稿取得 - 必要に応じて利用
async function getFallbackRelatedPosts() {
  try {
    // 最新の公開投稿を取得
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .neq('id', postId)
      .order('published_at', { ascending: false })
      .limit(3);
    
    return data || [];
  } catch (e) {
    return [];
  }
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