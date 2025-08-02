<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4 sm:py-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-heading">
            コメント管理
          </h1>
        </div>
      </div>
    </div>

    <!-- ナビゲーション -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex space-x-8" aria-label="管理メニュー">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current
                ? 'border-primary text-primary'
                : 'border-transparent text-text hover:text-text-muted hover:border-border-light',
              'py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- フィルター -->
      <div class="bg-surface shadow rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="search" class="block text-sm font-medium text-text">
              検索
            </label>
            <input
              type="text"
              id="search"
              v-model="searchQuery"
              placeholder="コメント内容で検索"
              class="mt-1 block w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text placeholder-text-muted transition-all duration-200 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- コメントリスト -->
      <div class="space-y-4">
        <div
          v-for="comment in filteredComments"
          :key="comment.id"
          class="bg-surface shadow rounded-lg p-6"
        >
          <div class="flex items-start space-x-4">
            <div class="flex-1">
              <!-- コメント投稿者情報 -->
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-text">
                    {{ comment.author?.nickname || '匿名' }}
                  </span>
                  <span class="text-sm text-text-muted ml-2">
                    {{ formatDate(comment.created_at) }}
                  </span>
                </div>
                <button
                  @click="deleteComment(comment)"
                  class="text-error hover:text-error-dark text-sm"
                >
                  削除
                </button>
              </div>

              <!-- コメント内容 -->
              <div class="mt-2 text-sm text-text">
                {{ comment.content }}
              </div>

              <!-- 投稿情報 -->
              <div class="mt-3 flex items-center text-sm">
                <span class="text-text-muted">投稿：</span>
                <router-link
                  :to="`/posts/${comment.post_id}`"
                  class="ml-1 text-primary hover:text-primary-dark"
                >
                  {{ comment.post?.title || '削除された投稿' }}
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 空の状態 -->
        <div
          v-if="filteredComments.length === 0"
          class="bg-surface shadow rounded-lg p-12 text-center"
        >
          <p class="text-text-muted">
            {{ searchQuery ? '検索結果がありません' : 'コメントがありません' }}
          </p>
        </div>
      </div>

      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="mt-8 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-2 text-sm font-medium text-text bg-surface border border-border rounded-md hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          <span class="px-4 py-2 text-sm text-text-muted">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-2 text-sm font-medium text-text bg-surface border border-border rounded-md hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';
import { useNotification } from '../composables/useNotification';

const route = useRoute();
const { showSuccess, showError, showConfirm } = useNotification();

const navigation = computed(() => [
  { name: '概要', href: '/admin', current: route.path === '/admin' },
  { name: 'ユーザー管理', href: '/admin/users', current: route.path === '/admin/users' },
  { name: '投稿管理', href: '/admin/posts', current: route.path === '/admin/posts' },
  { name: 'コメント管理', href: '/admin/comments', current: route.path === '/admin/comments' },
]);

const comments = ref<any[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;

// フィルター済みコメント
const filteredComments = computed(() => {
  let filtered = comments.value;

  // 検索フィルター
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(comment => 
      comment.content.toLowerCase().includes(query)
    );
  }

  // ページネーション
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filtered.slice(start, end);
});

// 総ページ数
const totalPages = computed(() => {
  const filtered = searchQuery.value
    ? comments.value.filter(c => c.content.toLowerCase().includes(searchQuery.value.toLowerCase()))
    : comments.value;
  return Math.ceil(filtered.length / itemsPerPage);
});

// コメント一覧の取得
const fetchComments = async () => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, nickname, account_id),
        post:posts!comments_post_id_fkey(id, title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    comments.value = data || [];
  } catch (error) {
    console.error('コメント一覧の取得エラー:', error);
    showError('コメント一覧の取得に失敗しました');
  }
};

// コメントの削除
const deleteComment = async (comment: any) => {
  const confirmed = await showConfirm(
    'このコメントを削除しますか？',
    'この操作は取り消せません。'
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id);

    if (error) throw error;

    showSuccess('コメントを削除しました');
    await fetchComments();
  } catch (error) {
    console.error('コメント削除エラー:', error);
    showError('コメントの削除に失敗しました');
  }
};

// 日付フォーマット
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 7) {
    return date.toLocaleDateString('ja-JP');
  } else if (days > 0) {
    return `${days}日前`;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return 'たった今';
  }
};

// 検索時はページを1に戻す
watch(searchQuery, () => {
  currentPage.value = 1;
});

onMounted(() => {
  fetchComments();
});
</script>