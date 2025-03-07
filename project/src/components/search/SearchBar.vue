<template>
  <div class="search-bar">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        class="form-input w-full px-4 pr-10 py-2 rounded-full border focus:outline-none focus:ring-2"
        placeholder="検索..."
        @input="debouncedSearch"
      />
      <div class="absolute right-2 top-1/2 transform -translate-y-1/2">
        <svg 
          v-if="isSearching" 
          class="animate-spin h-5 w-5 text-gray-400" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <button
          v-else
          @click="handleSearch"
          class="text-gray-400 hover:text-primary transition-colors p-1 rounded-full"
          aria-label="検索"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const searchQuery = ref('');
const isSearching = ref(false);
const searchTimeout = ref<number | null>(null);

// 初期値をクエリパラメータから取得
searchQuery.value = route.query.q as string || '';

function debouncedSearch() {
  // 既存のタイムアウトをクリア
  if (searchTimeout.value !== null) {
    clearTimeout(searchTimeout.value);
  }
  
  // 新しいタイムアウトを設定
  if (searchQuery.value.trim()) {
    isSearching.value = true;
    searchTimeout.value = window.setTimeout(() => {
      handleSearch();
      searchTimeout.value = null;
    }, 300); // 300ms後に検索実行
  } else {
    isSearching.value = false;
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() }
    });
  }
  isSearching.value = false;
}
</script> 