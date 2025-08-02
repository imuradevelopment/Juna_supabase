<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4 sm:py-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-heading">
            投稿管理
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
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label for="search" class="block text-sm font-medium text-text">
              検索
            </label>
            <input
              type="text"
              id="search"
              v-model="searchQuery"
              placeholder="タイトル、内容で検索"
              class="mt-1 block w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text placeholder-text-muted transition-all duration-200 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </div>
          <div>
            <label for="status" class="block text-sm font-medium text-text">
              ステータス
            </label>
            <div class="relative mt-1">
              <select
                id="status"
                v-model="statusFilter"
                class="block w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 pr-10 text-text transition-all duration-200 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm appearance-none cursor-pointer"
              >
                <option value="">すべて</option>
                <option value="published">公開</option>
                <option value="draft">下書き</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <PhCaretDown class="h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>
          <div>
            <label for="category" class="block text-sm font-medium text-text">
              カテゴリ
            </label>
            <div class="relative mt-1">
              <select
                id="category"
                v-model="categoryFilter"
                class="block w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 pr-10 text-text transition-all duration-200 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm appearance-none cursor-pointer"
              >
                <option value="">すべて</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <PhCaretDown class="h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 投稿テーブル -->
      <div class="bg-surface shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-surface-variant">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                タイトル
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                投稿者
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                カテゴリ
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                ステータス
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                投稿日
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-surface divide-y divide-border">
            <tr v-for="post in filteredPosts" :key="post.id">
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-text">
                  {{ post.title }}
                </div>
                <div class="text-sm text-text-muted">
                  {{ truncateContent(post.content) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-text">
                  {{ post.author?.nickname || '匿名' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-text">
                  {{ post.category?.name || '未分類' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    post.published
                      ? 'bg-success/20 text-success'
                      : 'bg-surface-variant text-text-muted',
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                  ]"
                >
                  {{ post.published ? '公開' : '下書き' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                {{ formatDate(post.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link
                  :to="`/posts/${post.id}`"
                  class="text-primary hover:text-primary-dark mr-4"
                >
                  表示
                </router-link>
                <button
                  @click="togglePostStatus(post)"
                  class="text-warning hover:text-accent2 mr-4"
                >
                  {{ post.published ? '非公開' : '公開' }}
                </button>
                <button
                  @click="deletePost(post)"
                  class="text-error hover:text-error-dark"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';
import { useNotification } from '../composables/useNotification';
import { PhCaretDown } from '@phosphor-icons/vue';

const route = useRoute();
const { showSuccess, showError, showConfirm } = useNotification();

const navigation = computed(() => [
  { name: '概要', href: '/admin', current: route.path === '/admin' },
  { name: 'ユーザー管理', href: '/admin/users', current: route.path === '/admin/users' },
  { name: '投稿管理', href: '/admin/posts', current: route.path === '/admin/posts' },
  { name: 'コメント管理', href: '/admin/comments', current: route.path === '/admin/comments' },
  { name: 'サイト設定', href: '/admin/settings', current: route.path === '/admin/settings' },
]);

const posts = ref<any[]>([]);
const categories = ref<any[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');
const categoryFilter = ref('');

// フィルター済み投稿
const filteredPosts = computed(() => {
  let filtered = posts.value;

  // 検索フィルター
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
    );
  }

  // ステータスフィルター
  if (statusFilter.value) {
    filtered = filtered.filter(post => 
      statusFilter.value === 'published' ? post.published === true : post.published === false
    );
  }

  // カテゴリフィルター
  if (categoryFilter.value) {
    filtered = filtered.filter(post => post.category_id === parseInt(categoryFilter.value));
  }

  return filtered;
});

// 投稿一覧の取得
const fetchPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, nickname, account_id),
        post_categories(category:categories(id, name))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // カテゴリ情報をフラット化
    posts.value = (data || []).map(post => ({
      ...post,
      category: post.post_categories?.[0]?.category || null,
      category_id: post.post_categories?.[0]?.category?.id || null
    }));
  } catch (error) {
    console.error('投稿一覧の取得エラー:', error);
    showError('投稿一覧の取得に失敗しました');
  }
};

// カテゴリ一覧の取得
const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    categories.value = data || [];
  } catch (error) {
    console.error('カテゴリ一覧の取得エラー:', error);
  }
};

// 投稿のステータス切り替え
const togglePostStatus = async (post: any) => {
  const newStatus = !post.published;
  const action = post.published ? '非公開' : '公開';
  
  const confirmed = await showConfirm(
    `「${post.title}」を${action}にしますか？`,
    ''
  );

  if (!confirmed) return;

  try {
    const updateData: any = { published: newStatus };
    if (newStatus) {
      updateData.published_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post.id);

    if (error) throw error;

    showSuccess(`投稿を${action}にしました`);
    await fetchPosts();
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    showError('ステータスの更新に失敗しました');
  }
};

// 投稿の削除
const deletePost = async (post: any) => {
  const confirmed = await showConfirm(
    `「${post.title}」を削除しますか？`,
    'この操作は取り消せません。投稿に関連するコメントやいいねも全て削除されます。'
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);

    if (error) throw error;

    showSuccess('投稿を削除しました');
    await fetchPosts();
  } catch (error) {
    console.error('投稿削除エラー:', error);
    showError('投稿の削除に失敗しました');
  }
};

// コンテンツの切り詰め
const truncateContent = (content: string) => {
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
};

// 日付フォーマット
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP');
};

onMounted(() => {
  fetchPosts();
  fetchCategories();
});
</script>