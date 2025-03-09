<template>
  <div class="dashboard-comments-list">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">コメント管理</h2>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        全 {{ totalComments }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <!-- コメントがない場合 -->
    <div v-else-if="comments.length === 0" class="glass-card p-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">
        まだコメントはありません
      </p>
    </div>
    
    <!-- コメントリスト -->
    <div v-else class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="glass-card p-4">
        <div class="flex flex-col">
          <!-- コメント内容 -->
          <div>
            <div class="flex items-center">
              <div class="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center text-white overflow-hidden mr-2">
                <img 
                  v-if="comment.posts?.profiles?.avatar_data" 
                  :src="getAvatarUrl(comment.posts.profiles.avatar_data)" 
                  :alt="comment.posts?.profiles?.nickname || ''"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ getInitials(comment.posts?.profiles?.nickname || '') }}</span>
              </div>
              <span class="text-sm">{{ comment.posts?.profiles?.nickname || '不明なユーザー' }}</span>
            </div>
            
            <p class="whitespace-pre-wrap mb-2">{{ comment.content }}</p>
            
            <div class="flex justify-between items-center">
              <router-link 
                :to="`/posts/${comment.post_id}`" 
                class="text-sm text-primary hover:underline"
              >
                {{ getPostTitle(comment) }}
              </router-link>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                {{ formatDate(comment.created_at) }}
              </span>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="flex justify-end space-x-2 mt-3">
            <button 
              @click="confirmEditComment(comment)" 
              class="btn btn-sm btn-outline"
            >
              編集
            </button>
            <button 
              @click="confirmDeleteComment(comment)" 
              class="btn btn-sm btn-danger"
            >
              削除
            </button>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="flex justify-center mt-6">
        <div class="flex space-x-2">
          <button 
            @click="changePage(currentPage - 1)" 
            class="btn btn-sm btn-outline"
            :disabled="currentPage === 1"
          >
            前へ
          </button>
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            @click="changePage(typeof page === 'number' ? page : currentPage)" 
            class="btn btn-sm" 
            :class="page === currentPage ? 'btn-primary' : 'btn-outline'"
          >
            {{ page }}
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            class="btn btn-sm btn-outline"
            :disabled="currentPage === totalPages"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
    
    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="glass-card p-6 max-w-md w-full mx-auto">
        <h3 class="text-xl font-bold mb-4">コメントを編集</h3>
        <textarea 
          v-model="editedContent" 
          class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          rows="3"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button @click="showEditModal = false" class="btn btn-ghost">キャンセル</button>
          <button 
            @click="updateComment" 
            class="btn btn-primary"
            :disabled="actionSubmitting || !editedContent.trim()"
          >
            <svg v-if="actionSubmitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ actionSubmitting ? '更新中...' : '更新する' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="glass-card p-6 max-w-md mx-auto">
        <h3 class="text-xl font-bold mb-4">コメントを削除しますか？</h3>
        <p class="mb-6 text-gray-600 dark:text-gray-400">この操作は取り消せません。本当にこのコメントを削除しますか？</p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="btn btn-ghost">キャンセル</button>
          <button 
            @click="deleteComment" 
            class="btn bg-red-500 hover:bg-red-600 text-white"
            :disabled="actionSubmitting"
          >
            <svg v-if="actionSubmitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ actionSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl } from '../../lib/storage';

// 型定義を修正
interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  posts?: {
    id: string;
    title: string;
    profiles?: {
      nickname: string | null;
      avatar_data?: string | null;
    };
  };
}

const authStore = useAuthStore();

// 状態
const comments = ref<Comment[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalComments = ref(0);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const actionSubmitting = ref(false);
const selectedComment = ref<Comment | null>(null);
const editedContent = ref('');

// 計算プロパティ
const totalPages = computed(() => Math.ceil(totalComments.value / pageSize));

// 初期データ取得
onMounted(() => {
  fetchComments();
});

// コメントの取得
async function fetchComments() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // 合計数を取得
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id);
    
    if (countError) throw countError;
    totalComments.value = count || 0;
    
    // ページネーションの計算
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // コメントデータを取得
    const { data, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        post_id,
        parent_comment_id,
        posts (
          id,
          title,
          profiles:author_id (
            nickname,
            avatar_data
          )
        )
      `)
      .eq('author_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (commentsError) throw commentsError;
    comments.value = data || [];
  } catch (err) {
    console.error('コメント取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// ページネーション
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchComments();
}

// ページ番号の配列を取得
function getPageNumbers(): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisiblePages = 5;
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage.value >= totalPages.value - 2) {
      for (let i = totalPages.value - 4; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage.value - 2; i <= currentPage.value + 2; i++) {
        pages.push(i);
      }
    }
  }
  
  return pages;
}

// 投稿タイトルを取得
function getPostTitle(comment: Comment): string {
  return comment.posts?.title || '不明な投稿';
}

// コメント編集確認
function confirmEditComment(comment: Comment) {
  selectedComment.value = comment;
  editedContent.value = comment.content;
  showEditModal.value = true;
  showDeleteModal.value = false;
}

// コメント削除確認
function confirmDeleteComment(comment: Comment) {
  selectedComment.value = comment;
  showDeleteModal.value = true;
  showEditModal.value = false;
}

// コメント更新
async function updateComment() {
  if (!selectedComment.value || !editedContent.value.trim() || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // コメントを更新
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        content: editedContent.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedComment.value.id)
      .eq('author_id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // リストを更新
    const index = comments.value.findIndex(c => c.id === selectedComment.value?.id);
    if (index !== -1) {
      comments.value[index].content = editedContent.value;
      comments.value[index].updated_at = new Date().toISOString();
    }
    
    showEditModal.value = false;
  } catch (err) {
    console.error('コメント更新エラー:', err);
    alert('コメントの更新に失敗しました');
  } finally {
    actionSubmitting.value = false;
  }
}

// コメント削除
async function deleteComment() {
  if (!selectedComment.value || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // コメントを削除
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', selectedComment.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // リストから削除
    comments.value = comments.value.filter(c => c.id !== selectedComment.value?.id);
    totalComments.value--;
    showDeleteModal.value = false;
    
    // ページが空になった場合は前のページに戻る
    if (comments.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchComments();
    }
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました');
  } finally {
    actionSubmitting.value = false;
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

// アバターURLを取得
function getAvatarUrl(avatar_data?: string) {
  return avatar_data ? getProfileImageUrl(avatar_data) : '';
}

// イニシャルを取得
function getInitials(nickname: string) {
  if (!nickname) return 'U';
  return nickname.charAt(0).toUpperCase();
}
</script> 