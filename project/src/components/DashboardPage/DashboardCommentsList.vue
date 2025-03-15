<template>
  <div>
    <div class="flex flex-col justify-between items-start mb-3 sm:flex-row sm:items-center sm:mb-4">
      <h2 class="text-lg font-bold text-heading mb-1 sm:text-xl sm:mb-0">コメント管理</h2>
      <div class="text-xs text-text-muted sm:text-sm">
        全 {{ totalComments }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-4 sm:p-6">
      <svg class="animate-spin h-6 w-6 text-primary sm:h-8 sm:w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <!-- コメントがない場合 -->
    <div v-else-if="comments.length === 0" class="glass-card p-4 text-center sm:p-8">
      <p class="text-text-muted">
        まだコメントはありません
      </p>
    </div>
    
    <!-- コメントリスト -->
    <div v-else class="space-y-3 sm:space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="glass-card p-3 shadow-background/50 sm:p-4">
        <div class="flex flex-col">
          <!-- コメント内容 -->
          <div>
            <div class="flex items-center">
              <div class="w-5 h-5 rounded-full bg-primary-light flex items-center justify-center text-text-white overflow-hidden mr-2 sm:w-6 sm:h-6">
                <img 
                  v-if="comment.post?.author?.avatar_data" 
                  :src="getAvatarUrl(comment.post.author.avatar_data)" 
                  :alt="comment.post?.author?.nickname || ''"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ getInitials(comment.post?.author?.nickname || '') }}</span>
              </div>
              <span class="text-xs text-text sm:text-sm">{{ comment.post?.author?.nickname || '不明なユーザー' }}</span>
            </div>
            
            <p class="whitespace-pre-wrap mb-2 text-sm text-text">{{ comment.content }}</p>
            
            <div class="flex flex-col justify-between items-start mb-1 sm:flex-row sm:items-center sm:mb-0">
              <router-link 
                :to="`/posts/${comment.post_id}`" 
                class="text-xs text-primary hover:underline mb-1 sm:text-sm sm:mb-0"
              >
                {{ getPostTitle(comment) }}
              </router-link>
              <span class="text-xs text-text-muted">
                {{ formatDate(comment.created_at) }}
              </span>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="flex justify-end space-x-2 mt-2 sm:mt-3">
            <button 
              @click="confirmEditComment(comment)" 
              class="btn btn-outline-secondary btn-sm"
            >
              編集
            </button>
            <button 
              @click="confirmDeleteComment(comment)" 
              class="btn btn-outline-error btn-sm"
            >
              削除
            </button>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="flex justify-center mt-4 sm:mt-6">
        <div class="flex flex-wrap justify-center space-x-1 sm:space-x-2">
          <button 
            @click="changePage(currentPage - 1)" 
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage === 1"
          >
            前へ
          </button>
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            @click="changePage(typeof page === 'number' ? page : currentPage)" 
            class="btn btn-sm"
            :class="page === currentPage ? 'btn-primary' : 'btn-outline-primary'"
          >
            {{ page }}
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage === totalPages"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
    
    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card p-4 w-full max-w-md mx-auto shadow-background/70 sm:p-6">
        <h3 class="text-lg font-bold mb-3 text-heading sm:text-xl sm:mb-4">コメントを編集</h3>
        <textarea 
          v-model="editedContent" 
          class="w-full px-3 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary mb-3 text-sm sm:mb-4"
          rows="3"
        ></textarea>
        <div class="flex justify-end space-x-2 sm:space-x-3">
          <button 
            @click="showEditModal = false" 
            class="btn btn-ghost btn-sm"
          >
            キャンセル
          </button>
          <button 
            @click="updateComment" 
            class="btn btn-primary btn-sm"
            :disabled="actionSubmitting || !editedContent.trim()"
          >
            <svg v-if="actionSubmitting" class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ actionSubmitting ? '更新中...' : '更新する' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
      <div class="glass-card p-4 w-full max-w-md mx-auto shadow-background/70 sm:p-6">
        <h3 class="text-lg font-bold mb-3 text-heading sm:text-xl sm:mb-4">コメントを削除しますか？</h3>
        <p class="mb-4 text-sm text-text-muted sm:mb-6">この操作は取り消せません。本当にこのコメントを削除しますか？</p>
        <div class="flex justify-end space-x-2 sm:space-x-3">
          <button 
            @click="showDeleteModal = false" 
            class="btn btn-ghost btn-sm"
          >
            キャンセル
          </button>
          <button 
            @click="deleteComment" 
            class="btn btn-outline-error btn-sm"
            :disabled="actionSubmitting"
          >
            <svg v-if="actionSubmitting" class="animate-spin h-4 w-4 mr-1 inline" viewBox="0 0 24 24">
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

// インターフェース定義を修正
interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  post?: {
    id: string;
    title: string;
    author?: {
      id: string;
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
        posts:post_id (
          id,
          title,
          profiles:author_id (
            id,
            nickname,
            avatar_data
          )
        )
      `)
      .eq('author_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (commentsError) throw commentsError;

    // データを正しい形式に変換
    const formattedData = (data || []).map((item: any) => {
      return {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        post_id: item.post_id,
        parent_comment_id: item.parent_comment_id,
        post: {
          id: item.posts.id,
          title: item.posts.title,
          author: {
            id: item.posts.profiles.id,
            nickname: item.posts.profiles.nickname,
            avatar_data: item.posts.profiles.avatar_data
          }
        }
      } as Comment;
    });

    comments.value = formattedData;
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
  return comment.post?.title || '不明な投稿';
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