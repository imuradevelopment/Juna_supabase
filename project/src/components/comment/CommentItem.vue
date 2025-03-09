<template>
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
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(comment.created_at) }}</span>
          </div>
          
          <!-- 編集フォーム -->
          <div v-if="isEditing" class="mb-2">
            <textarea 
              v-model="editedContent" 
              class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              rows="2"
            ></textarea>
            <div class="flex justify-end space-x-2 mt-2">
              <button 
                @click="cancelEdit" 
                class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                キャンセル
              </button>
              <button 
                @click="saveEdit" 
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
            @click="toggleReplyForm" 
            class="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
          >
            返信
          </button>
          
          <div v-if="isOwner">
            <button 
              @click="startEdit" 
              class="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
            >
              編集
            </button>
            <button 
              @click="confirmDelete" 
              class="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-4"
            >
              削除
            </button>
          </div>
          
          <button 
            @click="toggleLike" 
            class="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light ml-4"
            :class="{ 'text-primary dark:text-primary-light': isLiked }"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'fill-current': isLiked }">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {{ likeCount }}
            </span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 返信フォーム -->
    <div v-if="showReplyForm" class="ml-12 mb-4">
      <CommentForm 
        :post-id="comment.post_id" 
        :parent-id="comment.id"
        @comment-added="handleReplyAdded"
      />
    </div>
    
    <!-- 返信コメント -->
    <div v-if="replies.length > 0" class="ml-12">
      <CommentItem 
        v-for="reply in replies" 
        :key="reply.id" 
        :comment="reply" 
        @comment-updated="$emit('comment-updated')"
        @comment-deleted="handleCommentDeleted"
      />
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="glass-card p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold mb-4">コメントを削除しますか？</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
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
import { ref, computed, onMounted } from 'vue';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm.vue';
import { useRouter } from 'vue-router';
import { getProfileImageUrl } from '../../lib/storage';

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['comment-updated', 'comment-deleted']);
const router = useRouter();
const authStore = useAuthStore();

const isEditing = ref(false);
const editedContent = ref('');
const showReplyForm = ref(false);
const replies = ref<any[]>([]);
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const likeCount = ref(0);
const isLiked = ref(false);

// 自分のコメントかどうか
const isOwner = computed(() => {
  return authStore.isAuthenticated && 
         authStore.user && 
         props.comment.author_id === authStore.user.id;
});

// 返信コメントを取得
async function fetchReplies() {
  if (!props.comment.id) return;
  
  try {
    const { data, error: repliesError } = await supabase
      .from('comments')
      .select('*, profiles:author_id(*)')
      .eq('parent_comment_id', props.comment.id)
      .order('created_at', { ascending: true });
    
    if (repliesError) throw repliesError;
    replies.value = data || [];
  } catch (err) {
    console.error('返信取得エラー:', err);
  }
}

// 編集開始
function startEdit() {
  editedContent.value = props.comment.content;
  isEditing.value = true;
}

// 編集キャンセル
function cancelEdit() {
  isEditing.value = false;
}

// 編集保存
async function saveEdit() {
  if (!editedContent.value.trim() || editedContent.value === props.comment.content) {
    isEditing.value = false;
    return;
  }
  
  try {
    const { error } = await supabase
      .from('comments')
      .update({ 
        content: editedContent.value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', props.comment.id);
    
    if (error) throw error;
    
    // 更新成功
    props.comment.content = editedContent.value.trim();
    props.comment.updated_at = new Date().toISOString();
    isEditing.value = false;
    
    // 親コンポーネントに通知
    emit('comment-updated');
  } catch (err) {
    console.error('コメント更新エラー:', err);
    alert('コメントの更新に失敗しました');
  }
}

// 返信フォーム切り替え
function toggleReplyForm() {
  showReplyForm.value = !showReplyForm.value;
}

// 返信追加時の処理
function handleReplyAdded(newComment: any) {
  replies.value.push(newComment);
  showReplyForm.value = false;
  emit('comment-updated');
}

// 削除確認
function confirmDelete() {
  showDeleteModal.value = true;
}

// コメント削除
async function deleteComment() {
  if (deleteSubmitting.value) return;
  
  deleteSubmitting.value = true;
  
  try {
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', props.comment.id);
    
    if (deleteError) throw deleteError;
    
    // 削除確認モーダルを閉じる
    showDeleteModal.value = false;
    
    // 親コンポーネントに通知（UIから削除）
    emit('comment-deleted', props.comment.id);
    
    // 子コメントをUIから削除する必要はなくなった（DBのON DELETE CASCADEが自動的に削除する）
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました');
  } finally {
    deleteSubmitting.value = false;
  }
}

// コメント削除ハンドラー（子から親への通知）
function handleCommentDeleted(commentId: string) {
  // 削除された子コメントをUIから削除
  replies.value = replies.value.filter(c => c.id !== commentId);
  // 親に削除を通知しない（親コメントの削除時には不要）
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

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

// いいね数の取得
async function fetchLikes() {
  try {
    const { count, error: likesError } = await supabase
      .from('comment_likes')  // 新しいテーブル名を使用
      .select('*', { count: 'exact' })
      .eq('comment_id', props.comment.id);
    
    if (likesError) throw likesError;
    likeCount.value = count || 0;
  } catch (err) {
    console.error('いいね数取得エラー:', err);
  }
}

// いいね状態の確認
async function checkIfLiked() {
  if (!authStore.isAuthenticated || !authStore.user) return;
  
  try {
    const { data, error: likeError } = await supabase
      .from('comment_likes')  // 新しいテーブル名を使用
      .select('*')
      .eq('comment_id', props.comment.id)
      .eq('user_id', authStore.user.id)
      .maybeSingle();
    
    if (likeError) throw likeError;
    isLiked.value = !!data;
  } catch (err) {
    console.error('いいね状態確認エラー:', err);
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
        .from('comment_likes')  // 新しいテーブル名を使用
        .delete()
        .eq('comment_id', props.comment.id)
        .eq('user_id', authStore.user.id);
      
      if (deleteError) throw deleteError;
      
      isLiked.value = false;
      likeCount.value--;
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('comment_likes')  // 新しいテーブル名を使用
        .insert({
          comment_id: props.comment.id,
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

// 初期化
onMounted(() => {
  fetchReplies();
  fetchLikes();
  checkIfLiked();
});
</script> 