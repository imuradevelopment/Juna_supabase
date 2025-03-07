<template>
  <div style="background-color: #1a1e2d !important;" class="bg-white dark:bg-gray-900 p-5 rounded-lg comment-form border border-gray-100 dark:border-gray-800 shadow-sm">
    <div v-if="!authStore.isAuthenticated" class="text-center py-4">
      <p class="text-gray-600 dark:text-gray-300 mb-3">
        コメントするにはログインが必要です
      </p>
      <router-link to="/login" class="btn btn-primary dark:bg-primary-dark dark:text-white transition-all hover:shadow-md">
        ログインする
      </router-link>
    </div>
    
    <form v-else @submit.prevent="submitComment" class="space-y-3">
      <div class="mb-3 textarea-wrapper">
        <textarea 
          v-model="commentText" 
          class="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          rows="3"
          :placeholder="parentId ? '返信を入力...' : 'コメントを入力...'"
          :disabled="submitting"
          required
        ></textarea>
      </div>
      
      <div class="flex justify-end">
        <button 
          type="submit" 
          class="btn btn-primary dark:bg-primary-dark submit-button dark:text-white flex items-center justify-center transition-all hover:shadow-md"
          :disabled="submitting || !commentText.trim()"
        >
          <svg v-if="submitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitting ? '送信中...' : parentId ? '返信する' : '送信する' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  parentId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['comment-added']);
const authStore = useAuthStore();

const commentText = ref('');
const submitting = ref(false);

async function submitComment() {
  if (!commentText.value.trim() || !authStore.user || submitting.value) return;
  
  submitting.value = true;
  
  try {
    const newComment = {
      content: commentText.value.trim(),
      post_id: props.postId,
      author_id: authStore.user.id,
      parent_comment_id: props.parentId || null,
      created_at: new Date().toISOString()
    };
    
    // コメントの作成
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select('*, profiles:author_id(*)')
      .single();
    
    if (error) throw error;
    
    // 親コンポーネントに通知
    emit('comment-added', newCommentData);
    
    // フォームをリセット
    commentText.value = '';
  } catch (err: any) {
    console.error('コメント投稿エラー:', err);
    alert('コメントの投稿に失敗しました');
  } finally {
    submitting.value = false;
  }
}
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
</style> 