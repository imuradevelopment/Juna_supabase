<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-heading mb-8">投稿を検索</h1>

      <!-- 検索フォーム -->
      <div class="mb-8">
        <form @submit.prevent="handleSearch" class="space-y-4">
          <div class="flex gap-4">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="キーワードを入力してください..."
              class="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autofocus
            />
            <button
              type="submit"
              :disabled="loading || !searchQuery.trim()"
              class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PhMagnifyingGlass v-if="!loading" class="w-5 h-5" />
              <PhSpinner v-else class="w-5 h-5 animate-spin" />
            </button>
          </div>

          <!-- 検索タイプ選択 -->
          <div class="flex gap-4 text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="searchType"
                type="radio"
                value="hybrid"
                class="text-primary focus:ring-primary"
              />
              <span class="text-text-muted">ハイブリッド検索（推奨）</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="searchType"
                type="radio"
                value="keyword"
                class="text-primary focus:ring-primary"
              />
              <span class="text-text-muted">キーワード検索</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="searchType"
                type="radio"
                value="vector"
                class="text-primary focus:ring-primary"
              />
              <span class="text-text-muted">AI検索</span>
            </label>
          </div>
        </form>
      </div>

      <!-- 検索結果 -->
      <div v-if="hasSearched">
        <!-- 結果件数 -->
        <div v-if="results.length > 0" class="mb-6 text-text-muted">
          「{{ lastSearchQuery }}」の検索結果: {{ results.length }} 件
        </div>

        <!-- 結果一覧 -->
        <div v-if="results.length > 0" class="space-y-6">
          <article
            v-for="post in results"
            :key="post.id"
            class="glass-card p-6 hover:shadow-lg transition-shadow"
          >
            <router-link
              :to="`/posts/${post.id}`"
              class="block space-y-3"
            >
              <!-- タイトル -->
              <h2 class="text-xl font-bold text-heading hover:text-primary transition-colors">
                {{ post.title }}
              </h2>

              <!-- メタ情報 -->
              <div class="flex items-center gap-4 text-sm text-text-muted">
                <div v-if="post.author" class="flex items-center gap-2">
                  <img
                    v-if="post.author.avatar_data"
                    :src="getProfileImageUrl(post.author.avatar_data)"
                    :alt="post.author.nickname"
                    class="w-6 h-6 rounded-full object-cover"
                  />
                  <div v-else class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center">
                    <PhUser class="w-4 h-4 text-text-muted" />
                  </div>
                  <span>{{ post.author.nickname }}</span>
                </div>
                <time :datetime="post.published_at">
                  {{ formatDate(post.published_at) }}
                </time>
                <div v-if="post.similarity" class="text-primary">
                  関連度: {{ Math.round(post.similarity * 100) }}%
                </div>
              </div>

              <!-- 抜粋 -->
              <p v-if="post.excerpt" class="text-text-muted line-clamp-3">
                {{ post.excerpt }}
              </p>
            </router-link>
          </article>
        </div>

        <!-- 結果なし -->
        <div v-else class="text-center py-12">
          <PhMagnifyingGlass class="w-16 h-16 mx-auto text-text-muted/30 mb-4" />
          <p class="text-text-muted">
            「{{ lastSearchQuery }}」に一致する投稿が見つかりませんでした
          </p>
          <p class="text-sm text-text-muted mt-2">
            別のキーワードで検索してみてください
          </p>
        </div>
      </div>

      <!-- エラー表示 -->
      <div v-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PhMagnifyingGlass, PhSpinner, PhUser } from '@phosphor-icons/vue';
import { useSearch } from '../composables/useSearch';
import { getProfileImageUrl } from '../lib/storage';

const route = useRoute();
const router = useRouter();
const { searchPosts, loading, error, results } = useSearch();

const searchQuery = ref('');
const searchType = ref<'keyword' | 'vector' | 'hybrid'>('hybrid');
const hasSearched = ref(false);
const lastSearchQuery = ref('');

// URLクエリパラメータから初期値を設定
if (route.query.q) {
  searchQuery.value = route.query.q as string;
  handleSearch();
}

async function handleSearch() {
  const query = searchQuery.value.trim();
  if (!query) return;

  // URLを更新
  router.push({ query: { q: query } });

  lastSearchQuery.value = query;
  hasSearched.value = true;
  await searchPosts(query, searchType.value, 20);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>