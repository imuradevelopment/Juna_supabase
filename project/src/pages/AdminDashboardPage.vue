<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4 sm:py-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-heading">
            管理者ダッシュボード
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
      <!-- 統計カード -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="stat in stats"
          :key="stat.name"
          class="bg-surface overflow-hidden shadow rounded-lg"
        >
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-1">
                <dt class="text-sm font-medium text-text-muted truncate">
                  {{ stat.name }}
                </dt>
                <dd class="mt-1 text-3xl font-semibold text-heading">
                  {{ stat.value }}
                </dd>
              </div>
              <div class="ml-5 flex-shrink-0">
                <component
                  :is="stat.icon"
                  class="h-12 w-12 text-primary-light"
                  :weight="'duotone'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近の活動 -->
      <div class="mt-8">
        <h2 class="text-lg font-medium text-heading mb-4">最近の活動</h2>
        <div class="bg-surface shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-border">
            <li v-for="activity in recentActivities" :key="activity.id" class="px-6 py-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <p class="text-sm text-text">
                    {{ activity.description }}
                  </p>
                  <p class="text-sm text-text-muted">
                    {{ formatDate(activity.created_at) }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../lib/supabase';
import { PhUsers, PhFileText, PhChatCircle, PhChartBar } from '@phosphor-icons/vue';
import { useNotification } from '../composables/useNotification';

const route = useRoute();
const { showError } = useNotification();

const navigation = computed(() => [
  { name: '概要', href: '/admin', current: route.path === '/admin' },
  { name: 'ユーザー管理', href: '/admin/users', current: route.path === '/admin/users' },
  { name: '投稿管理', href: '/admin/posts', current: route.path === '/admin/posts' },
  { name: 'コメント管理', href: '/admin/comments', current: route.path === '/admin/comments' },
  { name: 'サイト設定', href: '/admin/settings', current: route.path === '/admin/settings' },
]);

const stats = ref([
  { name: '総ユーザー数', value: 0, icon: PhUsers },
  { name: '公開投稿数', value: 0, icon: PhFileText },
  { name: '総コメント数', value: 0, icon: PhChatCircle },
  { name: '今週の新規投稿', value: 0, icon: PhChartBar },
]);

const recentActivities = ref<any[]>([]);

// 統計情報の取得
const fetchStatistics = async () => {
  try {
    // ユーザー数
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    // 公開投稿数
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true);
    
    // コメント数
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    // 今週の新規投稿
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { count: weeklyPostCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString());

    stats.value = [
      { name: '総ユーザー数', value: userCount || 0, icon: PhUsers },
      { name: '公開投稿数', value: postCount || 0, icon: PhFileText },
      { name: '総コメント数', value: commentCount || 0, icon: PhChatCircle },
      { name: '今週の新規投稿', value: weeklyPostCount || 0, icon: PhChartBar },
    ];
  } catch (error) {
    console.error('統計情報の取得エラー:', error);
    showError('統計情報の取得に失敗しました');
  }
};

// 最近の活動を取得
const fetchRecentActivities = async () => {
  try {
    // 最近の投稿
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        created_at,
        author:profiles!posts_author_id_fkey(nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // 最近のコメント
    const { data: recentComments } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        author:profiles!comments_author_id_fkey(nickname),
        post:posts!comments_post_id_fkey(title)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // 活動を統合してソート
    const activities: any[] = [];
    
    if (recentPosts) {
      activities.push(...recentPosts.map(post => ({
        id: `post-${post.id}`,
        description: `${post.author?.nickname || '匿名'}さんが「${post.title}」を投稿しました`,
        created_at: post.created_at,
        type: 'post'
      })));
    }

    if (recentComments) {
      activities.push(...recentComments.map(comment => ({
        id: `comment-${comment.id}`,
        description: `${comment.author?.nickname || '匿名'}さんが「${comment.post?.title}」にコメントしました`,
        created_at: comment.created_at,
        type: 'comment'
      })));
    }

    // 日時でソートして最新10件を表示
    recentActivities.value = activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error('最近の活動の取得エラー:', error);
    showError('最近の活動の取得に失敗しました');
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

onMounted(() => {
  fetchStatistics();
  fetchRecentActivities();
});
</script>