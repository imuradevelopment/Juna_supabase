<template>
  <div>
    <!-- コメント投稿フォーム -->
    <div class="mb-6">
      <div class="rounded-lg border p-5 shadow-background/20 bg-surface-variant border-border">
        <div v-if="!authStore.isAuthenticated" class="py-4 text-center">
          <p class="mb-3 text-text-muted">
            コメントするにはログインが必要です
          </p>
          <router-link to="/login" class="btn btn-primary">
            ログインする
          </router-link>
        </div>
        
        <form v-else @submit.prevent="submitComment" class="space-y-3">
          <div class="mb-3">
            <textarea 
              v-model="commentText" 
              class="w-full rounded-lg border p-4 transition-all placeholder-text-muted focus:outline-none focus:shadow-primary/20 focus:border-primary bg-surface text-text border-border" 
              rows="3"
              :placeholder="parentCommentId ? '返信を入力...' : 'コメントを入力...'"
              :disabled="submitting"
              required
            ></textarea>
          </div>
          
          <div class="flex justify-end">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="submitting || !commentText.trim()"
            >
              <svg v-if="submitting" class="h-5 w-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ submitting ? '送信中...' : parentCommentId ? '返信する' : '送信する' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- コメント一覧 -->
    <div v-if="loading" class="flex justify-center p-4">
      <div class="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin border-primary-light"></div>
    </div>

    <div v-else-if="comments.length === 0" class="py-8 text-center">
      <p class="text-text-muted">
        まだコメントはありません。最初のコメントを投稿してみましょう。
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- ルートコメントのみ表示（返信は子コンポーネント内で処理） -->
      <div v-for="comment in rootComments" :key="comment.id">
        <!-- 個別コメント表示 -->
        <div class="mb-4">
          <!-- コメント本体 -->
          <div class="mb-4 flex">
            <!-- アバター -->
            <div class="mr-3 flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light text-text-white">
                <img 
                  v-if="comment.profiles?.avatar_data" 
                  :src="getAvatarUrl(comment.profiles.avatar_data)" 
                  :alt="comment.profiles.nickname"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ getInitials(comment.profiles?.nickname || '?') }}</span>
              </div>
            </div>
            
            <!-- コメント内容 -->
            <div class="flex-1">
              <div class="rounded-lg border p-3 backdrop-blur-sm bg-surface/80 border-border-light/60 shadow-background/30">
                <!-- ユーザー情報と日時 -->
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-medium text-text">{{ comment.profiles?.nickname }}</span>
                  <span class="text-xs text-text-muted">{{ formatDate(comment.created_at) }}</span>
                </div>
                
                <!-- 編集フォーム -->
                <div v-if="editingCommentId === comment.id" class="mb-2">
                  <textarea 
                    v-model="editedContent" 
                    class="w-full rounded border px-3 py-2 focus:outline-none bg-surface text-text border-border shadow-primary/20"
                    rows="2"
                  ></textarea>
                  <div class="mt-2 flex justify-end space-x-2">
                    <button 
                      @click="cancelEdit" 
                      class="btn-link text-text-muted hover:text-text-white"
                    >
                      キャンセル
                    </button>
                    <button 
                      @click="saveEdit(comment)" 
                      class="btn-link"
                      :disabled="!editedContent.trim() || editedContent === comment.content"
                    >
                      保存
                    </button>
                  </div>
                </div>
                
                <!-- コメント表示 -->
                <p v-else class="whitespace-pre-wrap text-sm text-text">{{ comment.content }}</p>
              </div>
              
              <!-- アクションボタン -->
              <div class="mt-1 flex space-x-4 text-xs">
                <button 
                  @click="setReplyTo(comment)" 
                  class="btn btn-primary btn-sm"
                  :disabled="submitting || !commentText.trim()"
                >
                  返信
                </button>
                
                <div v-if="isCommentOwner(comment)">
                  <button 
                    @click="startEdit(comment)" 
                    class="btn-link"
                  >
                    編集
                  </button>
                  <button 
                    @click="confirmDelete(comment)" 
                    class="btn-link text-error"
                  >
                    削除
                  </button>
                </div>
                
                <button 
                  @click="toggleLike(comment)" 
                  class="ml-4 flex items-center"
                  :class="{ 'text-primary-light': isCommentLiked(comment.id), 'text-text-muted': !isCommentLiked(comment.id) }"
                >
                  <span class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isCommentLiked(comment.id) }">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {{ getCommentLikeCount(comment) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 返信フォーム -->
          <div v-if="parentCommentId === comment.id" class="mb-4 ml-12">
            <div class="rounded-lg border p-5 shadow-background/20 bg-surface-variant border-border">
              <form @submit.prevent="submitComment" class="space-y-3">
                <div class="mb-3">
                  <textarea 
                    v-model="commentText" 
                    class="w-full rounded-lg border p-4 transition-all placeholder-text-muted focus:outline-none focus:shadow-primary/20 focus:border-primary bg-surface text-text border-border"
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
                    class="btn-link"
                  >
                    キャンセル
                  </button>
                
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="submitting || !commentText.trim()"
                  >
                    <svg v-if="submitting" class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
            <div v-for="reply in getCommentReplies(comment.id)" :key="reply.id" class="mb-4">
              <!-- 返信コメント本体 -->
              <div class="mb-4 flex">
                <!-- アバター -->
                <div class="mr-3 flex-shrink-0">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light text-text-white">
                    <img 
                      v-if="reply.profiles?.avatar_data" 
                      :src="getAvatarUrl(reply.profiles.avatar_data)" 
                      :alt="reply.profiles.nickname"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ getInitials(reply.profiles?.nickname || '?') }}</span>
                  </div>
                </div>
                
                <!-- 返信コメント内容 -->
                <div class="flex-1">
                  <div class="rounded-lg border p-3 backdrop-blur-sm bg-surface/80 border-border-light/60 shadow-background/30">
                    <!-- ユーザー情報と日時 -->
                    <div class="mb-2 flex items-center justify-between">
                      <span class="font-medium text-text">{{ reply.profiles?.nickname }}</span>
                      <span class="text-xs text-text-muted">{{ formatDate(reply.created_at) }}</span>
                    </div>
                    
                    <!-- 編集フォーム -->
                    <div v-if="editingCommentId === reply.id" class="mb-2">
                      <textarea 
                        v-model="editedContent" 
                        class="w-full rounded border px-3 py-2 focus:outline-none bg-surface text-text border-border shadow-primary/20"
                        rows="2"
                      ></textarea>
                      <div class="mt-2 flex justify-end space-x-2">
                        <button 
                          @click="cancelEdit" 
                          class="btn-link text-text-muted hover:text-text-white"
                        >
                          キャンセル
                        </button>
                        <button 
                          @click="saveEdit(reply)" 
                          class="btn-link"
                          :disabled="!editedContent.trim() || editedContent === reply.content"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                    
                    <!-- コメント表示 -->
                    <p v-else class="whitespace-pre-wrap text-sm text-text">{{ reply.content }}</p>
                  </div>
                  
                  <!-- アクションボタン -->
                  <div class="mt-1 flex space-x-4 text-xs">
                    <button 
                      @click="setReplyTo(comment)" 
                      class="btn btn-primary btn-sm"
                      :disabled="submitting || !commentText.trim()"
                    >
                      返信
                    </button>
                    
                    <div v-if="isCommentOwner(reply)">
                      <button 
                        @click="startEdit(reply)" 
                        class="btn-link"
                      >
                        編集
                      </button>
                      <button 
                        @click="confirmDelete(reply)" 
                        class="btn-link text-error"
                      >
                        削除
                      </button>
                    </div>
                    
                    <button 
                      @click="toggleLike(reply)" 
                      class="ml-4 flex items-center"
                      :class="{ 'text-primary-light': isCommentLiked(reply.id), 'text-text-muted': !isCommentLiked(reply.id) }"
                    >
                      <span class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isCommentLiked(reply.id) }">
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
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-lg p-6 bg-surface/80 border border-border-light/60 shadow-background/40">
        <h3 class="mb-4 text-lg font-bold text-heading">コメントを削除しますか？</h3>
        <p class="mb-6 text-text-muted">
          この操作は取り消せません。
        </p>
        <div class="flex justify-end space-x-4">
          <button 
            @click="showDeleteModal = false" 
            class="btn btn-outline-primary"
          >
            キャンセル
          </button>
          <button 
            @click="deleteComment" 
            class="btn btn-error"
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
      parent_comment_id: parentCommentId.value || null
    };
    
    // コメントの作成
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select('*, profiles:author_id(*)')
      .single();
    
    if (error) {
      console.error('コメント投稿エラー詳細:', error);
      throw error;
    }
    
    // コメント一覧に追加
    comments.value.push(newCommentData);
    commentLikeCounts.value[newCommentData.id] = 0;
    likedComments.value[newCommentData.id] = false;
    
    // 親コンポーネントに通知
    emit('comments-updated', comments.value.length);
    
    // フォームをリセット
    commentText.value = '';
    parentCommentId.value = null;
  } catch (err: any) {
    console.error('コメント投稿エラー:', err);
    alert('コメントの投稿に失敗しました: ' + err.message);
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
    router.push('/auth');
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