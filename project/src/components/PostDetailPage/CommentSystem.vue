<template>
  <div class="comment-system">
    <!-- コメント投稿フォーム -->
    <div class="mb-6">
      <div style="background-color: #1a1e2d !important;" class="bg-gray-900 p-5 rounded-lg comment-form border border-gray-800 shadow-sm">
        <div v-if="!authStore.isAuthenticated" class="text-center py-4">
          <p class="text-gray-300 mb-3">
            コメントするにはログインが必要です
          </p>
          <router-link to="/login" class="btn btn-primary bg-primary-dark text-white transition-all hover:shadow-md">
            ログインする
          </router-link>
        </div>
        
        <form v-else @submit.prevent="submitComment" class="space-y-3">
          <div class="mb-3 textarea-wrapper">
            <textarea 
              v-model="commentText" 
              class="w-full p-4 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-100 placeholder-gray-500"
              rows="3"
              :placeholder="parentCommentId ? '返信を入力...' : 'コメントを入力...'"
              :disabled="submitting"
              required
            ></textarea>
          </div>
          
          <div class="flex justify-end">
            <button 
              type="submit" 
              class="btn btn-primary bg-primary-dark submit-button text-white flex items-center justify-center transition-all hover:shadow-md"
              :disabled="submitting || !commentText.trim()"
            >
              <svg v-if="submitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? '送信中...' : parentCommentId ? '返信する' : '送信する' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- コメント数 -->
    <div class="mb-4">
      <h3 class="text-xl font-bold">コメント {{ comments.length }}件</h3>
    </div>

    <!-- コメント一覧 -->
    <div v-if="loading" class="flex justify-center p-4">
      <div class="loading-spinner"></div>
    </div>

    <div v-else-if="comments.length === 0" class="text-center py-8">
      <p class="text-gray-400">
        まだコメントはありません。最初のコメントを投稿してみましょう。
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- ルートコメントのみ表示（返信は子コンポーネント内で処理） -->
      <div v-for="comment in rootComments" :key="comment.id" class="comment-thread">
        <!-- 個別コメント表示 -->
        <div class="comment-item">
          <!-- コメント本体 -->
          <div class="flex mb-4">
            <!-- アバター -->
            <div class="flex-shrink-0 mr-3">
              <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white overflow-hidden">
                <img 
                  v-if="comment.profiles?.avatar_data" 
                  :src="getAvatarUrl(comment.profiles.avatar_data)" 
                  :alt="comment.profiles.nickname"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ getInitials(comment.profiles?.nickname || '?') }}</span>
              </div>
            </div>
            
            <!-- コメント内容 -->
            <div class="flex-1">
              <div class="glass-card p-3">
                <!-- ユーザー情報と日時 -->
                <div class="flex justify-between items-center mb-2">
                  <span class="font-medium">{{ comment.profiles?.nickname }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(comment.created_at) }}</span>
                </div>
                
                <!-- 編集フォーム -->
                <div v-if="editingCommentId === comment.id" class="mb-2">
                  <textarea 
                    v-model="editedContent" 
                    class="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="2"
                  ></textarea>
                  <div class="flex justify-end space-x-2 mt-2">
                    <button 
                      @click="cancelEdit" 
                      class="text-xs text-gray-400 hover:text-gray-200"
                    >
                      キャンセル
                    </button>
                    <button 
                      @click="saveEdit(comment)" 
                      class="text-xs text-primary hover:text-primary-dark"
                      :disabled="!editedContent.trim() || editedContent === comment.content"
                    >
                      保存
                    </button>
                  </div>
                </div>
                
                <!-- コメント表示 -->
                <p v-else class="text-sm whitespace-pre-wrap">{{ comment.content }}</p>
              </div>
              
              <!-- アクションボタン -->
              <div class="flex text-xs mt-1 space-x-4">
                <button 
                  @click="setReplyTo(comment)" 
                  class="text-gray-400 hover:text-primary-light"
                >
                  返信
                </button>
                
                <div v-if="isCommentOwner(comment)">
                  <button 
                    @click="startEdit(comment)" 
                    class="text-gray-400 hover:text-primary-light"
                  >
                    編集
                  </button>
                  <button 
                    @click="confirmDelete(comment)" 
                    class="text-gray-400 hover:text-red-500 ml-4"
                  >
                    削除
                  </button>
                </div>
                
                <button 
                  @click="toggleLike(comment)" 
                  class="text-gray-400 hover:text-primary-light ml-4"
                  :class="{ 'text-primary-light': isCommentLiked(comment.id) }"
                >
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isCommentLiked(comment.id) }">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {{ getCommentLikeCount(comment) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 返信フォーム -->
          <div v-if="parentCommentId === comment.id" class="ml-12 mb-4">
            <div style="background-color: #1a1e2d !important;" class="bg-gray-900 p-5 rounded-lg comment-form border border-gray-800 shadow-sm">
              <form @submit.prevent="submitComment" class="space-y-3">
                <div class="mb-3 textarea-wrapper">
                  <textarea 
                    v-model="commentText" 
                    class="w-full p-4 bg-gray-900 border border-gray-800 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-100 placeholder-gray-500"
                    rows="3"
                    placeholder="返信を入力..."
                    :disabled="submitting"
                    required
                  ></textarea>
                </div>
                
                <div class="flex justify-between">
                  <button 
                    type="button"
                    @click="cancelReply" 
                    class="text-gray-400 hover:text-gray-200"
                  >
                    キャンセル
                  </button>
                
                  <button 
                    type="submit" 
                    class="btn btn-primary bg-primary-dark submit-button text-white flex items-center justify-center transition-all hover:shadow-md"
                    :disabled="submitting || !commentText.trim()"
                  >
                    <svg v-if="submitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ submitting ? '送信中...' : '返信する' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <!-- 子コメント（返信）-->
          <div v-if="getCommentReplies(comment.id).length > 0" class="ml-12">
            <div v-for="reply in getCommentReplies(comment.id)" :key="reply.id" class="comment-item">
              <!-- 返信コメント本体 -->
              <div class="flex mb-4">
                <!-- アバター -->
                <div class="flex-shrink-0 mr-3">
                  <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white overflow-hidden">
                    <img 
                      v-if="reply.profiles?.avatar_data" 
                      :src="getAvatarUrl(reply.profiles.avatar_data)" 
                      :alt="reply.profiles.nickname"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ getInitials(reply.profiles?.nickname || '?') }}</span>
                  </div>
                </div>
                
                <!-- 返信コメント内容 -->
                <div class="flex-1">
                  <div class="glass-card p-3">
                    <!-- ユーザー情報と日時 -->
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium">{{ reply.profiles?.nickname }}</span>
                      <span class="text-xs text-gray-400">{{ formatDate(reply.created_at) }}</span>
                    </div>
                    
                    <!-- 編集フォーム -->
                    <div v-if="editingCommentId === reply.id" class="mb-2">
                      <textarea 
                        v-model="editedContent" 
                        class="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                      ></textarea>
                      <div class="flex justify-end space-x-2 mt-2">
                        <button 
                          @click="cancelEdit" 
                          class="text-xs text-gray-400 hover:text-gray-200"
                        >
                          キャンセル
                        </button>
                        <button 
                          @click="saveEdit(reply)" 
                          class="text-xs text-primary hover:text-primary-dark"
                          :disabled="!editedContent.trim() || editedContent === reply.content"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                    
                    <!-- コメント表示 -->
                    <p v-else class="text-sm whitespace-pre-wrap">{{ reply.content }}</p>
                  </div>
                  
                  <!-- アクションボタン -->
                  <div class="flex text-xs mt-1 space-x-4">
                    <button 
                      @click="setReplyTo(comment)" 
                      class="text-gray-400 hover:text-primary-light"
                    >
                      返信
                    </button>
                    
                    <div v-if="isCommentOwner(reply)">
                      <button 
                        @click="startEdit(reply)" 
                        class="text-gray-400 hover:text-primary-light"
                      >
                        編集
                      </button>
                      <button 
                        @click="confirmDelete(reply)" 
                        class="text-gray-400 hover:text-red-500 ml-4"
                      >
                        削除
                      </button>
                    </div>
                    
                    <button 
                      @click="toggleLike(reply)" 
                      class="text-gray-400 hover:text-primary-light ml-4"
                      :class="{ 'text-primary-light': isCommentLiked(reply.id) }"
                    >
                      <span class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isCommentLiked(reply.id) }">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {{ getCommentLikeCount(reply) }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="glass-card p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold mb-4">コメントを削除しますか？</h3>
        <p class="text-gray-400 mb-6">
          この操作は取り消せません。
        </p>
        <div class="flex justify-end space-x-4">
          <button 
            @click="showDeleteModal = false" 
            class="btn btn-ghost"
          >
            キャンセル
          </button>
          <button 
            @click="deleteComment" 
            class="btn btn-danger"
            :disabled="deleteSubmitting"
          >
            {{ deleteSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'vue-router';
import { getProfileImageUrl } from '../../lib/storage';

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['comments-updated']);

const router = useRouter();
const authStore = useAuthStore();

// コメント関連の状態
const comments = ref<any[]>([]);
const loading = ref(true);
const commentText = ref('');
const submitting = ref(false);
const parentCommentId = ref<string | null>(null);
const editingCommentId = ref<string | null>(null);
const editedContent = ref('');
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const commentToDelete = ref<any>(null);

// いいね関連の状態
const likedComments = ref<Record<string, boolean>>({});
const commentLikeCounts = ref<Record<string, number>>({});

// ルートコメント（親コメントがないもの）のみを取得
const rootComments = computed(() => {
  return comments.value.filter(comment => !comment.parent_comment_id);
});

// 特定のコメントの返信を取得
function getCommentReplies(commentId: string) {
  return comments.value.filter(comment => comment.parent_comment_id === commentId);
}

// コメント一覧を取得
async function fetchComments() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:author_id (*)
      `)
      .eq('post_id', props.postId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    comments.value = data || [];
    
    // コメントごとのいいね数を取得
    await Promise.all(comments.value.map(async (comment) => {
      await fetchCommentLikes(comment.id);
      await checkIfLiked(comment.id);
    }));
    
  } catch (err) {
    console.error('コメント取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// コメントを投稿
async function submitComment() {
  if (!commentText.value.trim() || !authStore.user || submitting.value) return;
  
  submitting.value = true;
  
  try {
    const newComment = {
      content: commentText.value.trim(),
      post_id: props.postId,
      author_id: authStore.user.id,
      parent_comment_id: parentCommentId.value || null,
      created_at: new Date().toISOString()
    };
    
    // コメントの作成
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select('*, profiles:author_id(*)')
      .single();
    
    if (error) throw error;
    
    // コメント一覧に追加
    comments.value.push(newCommentData);
    commentLikeCounts.value[newCommentData.id] = 0;
    likedComments.value[newCommentData.id] = false;
    
    // 親コンポーネントに通知
    emit('comments-updated');
    
    // フォームをリセット
    commentText.value = '';
    parentCommentId.value = null;
  } catch (err: any) {
    console.error('コメント投稿エラー:', err);
    alert('コメントの投稿に失敗しました');
  } finally {
    submitting.value = false;
  }
}

// 編集を開始
function startEdit(comment: any) {
  editingCommentId.value = comment.id;
  editedContent.value = comment.content;
}

// 編集をキャンセル
function cancelEdit() {
  editingCommentId.value = null;
  editedContent.value = '';
}

// 編集を保存
async function saveEdit(comment: any) {
  if (!editedContent.value.trim() || !authStore.user) return;
  
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        content: editedContent.value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comment.id)
      .eq('author_id', authStore.user.id);
    
    if (error) throw error;
    
    // コメントを更新
    const index = comments.value.findIndex(c => c.id === comment.id);
    if (index !== -1) {
      comments.value[index].content = editedContent.value.trim();
      comments.value[index].updated_at = new Date().toISOString();
    }
    
    // 編集モードを終了
    editingCommentId.value = null;
    editedContent.value = '';
    
    // 親コンポーネントに通知
    emit('comments-updated');
  } catch (err) {
    console.error('コメント更新エラー:', err);
    alert('コメントの更新に失敗しました');
  }
}

// 返信する対象を設定
function setReplyTo(comment: any) {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  parentCommentId.value = comment.id;
  commentText.value = '';
}

// 返信をキャンセル
function cancelReply() {
  parentCommentId.value = null;
  commentText.value = '';
}

// 削除確認
function confirmDelete(comment: any) {
  commentToDelete.value = comment;
  showDeleteModal.value = true;
}

// コメント削除
async function deleteComment() {
  if (!commentToDelete.value || !authStore.user || deleteSubmitting.value) return;
  
  deleteSubmitting.value = true;
  
  try {
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentToDelete.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // 削除確認モーダルを閉じる
    showDeleteModal.value = false;
    
    // UI上でコメントを削除
    comments.value = comments.value.filter(c => c.id !== commentToDelete.value.id);
    
    // 子コメントもUIから削除（DBではON DELETE CASCADEで自動的に削除される）
    comments.value = comments.value.filter(c => c.parent_comment_id !== commentToDelete.value.id);
    
    // 親コンポーネントに通知
    emit('comments-updated');
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました');
  } finally {
    deleteSubmitting.value = false;
    commentToDelete.value = null;
  }
}

// コメントのいいね数を取得
async function fetchCommentLikes(commentId: string) {
  try {
    const { count, error: likesError } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact' })
      .eq('comment_id', commentId);
    
    if (likesError) throw likesError;
    commentLikeCounts.value[commentId] = count || 0;
  } catch (err) {
    console.error('いいね数取得エラー:', err);
  }
}

// いいね状態の確認
async function checkIfLiked(commentId: string) {
  if (!authStore.isAuthenticated || !authStore.user) {
    likedComments.value[commentId] = false;
    return;
  }
  
  try {
    const { data, error: likeError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', authStore.user.id)
      .maybeSingle();
    
    if (likeError) throw likeError;
    likedComments.value[commentId] = !!data;
  } catch (err) {
    console.error('いいね状態確認エラー:', err);
  }
}

// いいねの切り替え
async function toggleLike(comment: any) {
  if (!authStore.isAuthenticated || !authStore.user) {
    router.push('/login');
    return;
  }
  
  try {
    if (isCommentLiked(comment.id)) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', authStore.user.id);
      
      if (deleteError) throw deleteError;
      
      likedComments.value[comment.id] = false;
      commentLikeCounts.value[comment.id]--;
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: comment.id,
          user_id: authStore.user.id
        });
      
      if (insertError) throw insertError;
      
      likedComments.value[comment.id] = true;
      commentLikeCounts.value[comment.id]++;
    }
  } catch (err) {
    console.error('いいね切り替えエラー:', err);
  }
}

// ヘルパー関数
function isCommentOwner(comment: any): boolean {
  return Boolean(authStore.user && comment.author_id === authStore.user.id);
}

function getCommentLikeCount(comment: any): number {
  return commentLikeCounts.value[comment.id] || 0;
}

function isCommentLiked(commentId: string): boolean {
  return likedComments.value[commentId] || false;
}

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

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

// 投稿IDが変更されたらコメントを再取得
watch(() => props.postId, () => {
  fetchComments();
});

// 初期化
onMounted(() => {
  fetchComments();
});
</script>

<style scoped>
/* ダークモード対応のカスタムスタイル */
:deep(textarea) {
  background-color: #1a1e2d !important; /* 暗い背景色 */
  color: #e2e8f0 !important; /* 明るいテキスト色 */
  border-color: #2d3748 !important; /* 暗いボーダー色 */
}

:deep(textarea::placeholder) {
  color: #718096 !important; /* プレースホルダーテキスト色 */
}

.dark :deep(textarea:focus) {
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2) !important;
  border-color: #4f46e5 !important;
}

@media (prefers-color-scheme: dark) {
  textarea {
    background-color: #1a1e2d !important;
    color: #e2e8f0 !important;
    border-color: #2d3748 !important;
  }
  
  textarea::placeholder {
    color: #718096 !important;
  }
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid currentColor;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dark .loading-spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: currentColor;
}
</style> 