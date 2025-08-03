<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4 sm:py-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-heading">
            ユーザー管理
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
      <!-- 検索フィルター -->
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
              placeholder="ニックネーム、メールアドレス、アカウントID"
              class="mt-1 block w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text placeholder-text-muted transition-all duration-200 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- ユーザーテーブル -->
      <div class="bg-surface shadow overflow-hidden sm:rounded-lg">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-surface-variant">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                ユーザー
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                アカウントID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                登録日
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                投稾数
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                ステータス
              </th>
              <th class="relative px-6 py-3">
                <span class="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-surface divide-y divide-border">
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <img
                      v-if="user.avatar_url"
                      :src="user.avatar_url"
                      :alt="user.nickname"
                      class="h-10 w-10 rounded-full object-cover"
                    />
                    <div v-else class="h-10 w-10 rounded-full bg-surface-variant flex items-center justify-center">
                      <PhUser class="h-6 w-6 text-text-muted" :weight="'duotone'" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-text">
                      {{ user.nickname || '未設定' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-text">{{ user.account_id }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-text-muted">
                  {{ formatDate(user.created_at) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-text">{{ user.post_count || 0 }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  v-if="user.is_admin"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/20 text-primary"
                >
                  管理者
                </span>
                <span
                  v-else
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/20 text-success"
                >
                  一般
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link
                  :to="`/profile/${user.id}`"
                  class="text-primary hover:text-primary-dark mr-4"
                >
                  プロフィール
                </router-link>
                <button
                  v-if="!user.is_admin"
                  @click="deleteUser(user)"
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
import { PhUser } from '@phosphor-icons/vue';
import { useNotification } from '../composables/useNotification';
import { getProfileImageUrl } from '../lib/storage';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const { showSuccess, showError, showConfirm } = useNotification();

const navigation = computed(() => [
  { name: '概要', href: '/admin', current: route.path === '/admin' },
  { name: 'ユーザー管理', href: '/admin/users', current: route.path === '/admin/users' },
  { name: '投稿管理', href: '/admin/posts', current: route.path === '/admin/posts' },
  { name: 'コメント管理', href: '/admin/comments', current: route.path === '/admin/comments' },
  { name: 'サイト設定', href: '/admin/settings', current: route.path === '/admin/settings' },
]);

const users = ref<any[]>([]);
const searchQuery = ref('');

// フィルター済みユーザー
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.nickname?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.account_id?.toLowerCase().includes(query)
  );
});

// ユーザー一覧の取得
const fetchUsers = async () => {
  try {
    // プロフィール情報を取得
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 各ユーザーの追加情報を取得
    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile) => {
        // 投稿数を取得
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', profile.id);

        // メールアドレスは直接取得できないため、表示を工夫
        // 実際のメールアドレスが必要な場合はEdge Functionで実装が必要
        const email = '非表示';

        // 現在の管理者ユーザーIDと比較して管理者判定
        const isCurrentAdmin = authStore.user?.id === profile.id && authStore.isAdmin;

        return {
          ...profile,
          email: email,
          is_admin: profile.account_id === 'admin' || isCurrentAdmin, // account_idが'admin'または現在の管理者
          post_count: postCount || 0,
          avatar_url: profile.avatar_data ? getProfileImageUrl(profile.avatar_data) : null
        };
      })
    );

    users.value = usersWithDetails;
  } catch (error) {
    console.error('ユーザー一覧の取得エラー:', error);
    showError('ユーザー一覧の取得に失敗しました');
  }
};

// ユーザーの削除
const deleteUser = async (user: any) => {
  const confirmed = await showConfirm(
    `${user.nickname || user.email}を削除しますか？`,
    'この操作は取り消せません。ユーザーの投稿やコメントも全て削除されます。'
  );

  if (!confirmed) return;

  try {
    // セッショントークンを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('認証が必要です');
    }

    // delete-userエッジ関数を使用してユーザーを完全に削除
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          userId: user.id,
          isAdmin: true // 管理者による削除であることを示す
        })
      }
    );

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'ユーザーの削除に失敗しました');
    }

    showSuccess('ユーザーを削除しました');
    await fetchUsers();
  } catch (error: any) {
    console.error('ユーザー削除エラー:', error);
    showError(error.message || 'ユーザーの削除に失敗しました');
  }
};

// 日付フォーマット
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP');
};

onMounted(() => {
  fetchUsers();
});
</script>