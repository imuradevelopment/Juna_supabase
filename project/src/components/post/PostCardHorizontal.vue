<template>
  <router-link :to="`/posts/${post.id}`" class="glass-card p-4 block transition-all hover:shadow-lg">
    <div class="flex">
      <!-- サムネイル -->
      <div class="flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mr-4">
        <img 
          v-if="post.cover_image_path" 
          :src="getImageUrl(post.cover_image_path)" 
          :alt="post.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      
      <!-- 内容 -->
      <div class="flex-1">
        <!-- ハイライト対応のタイトル -->
        <h3 class="text-lg font-semibold mb-2 line-clamp-2" v-if="post.title_highlight" v-html="post.title_highlight"></h3>
        <h3 class="text-lg font-semibold mb-2 line-clamp-2" v-else>{{ post.title }}</h3>
        
        <!-- ハイライト対応の抜粋 -->
        <p v-if="post.excerpt_highlight" class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2" v-html="post.excerpt_highlight"></p>
        <p v-else-if="post.excerpt" class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {{ post.excerpt }}
        </p>
        
        <div class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
          <div class="flex items-center">
            <span class="mr-3">{{ formatDate(post.published_at || post.created_at) }}</span>
            <span class="mr-1">{{ post.author_name || post.nickname }}</span>
          </div>
          
          <!-- 統計 -->
          <div class="flex space-x-3">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{{ post.views }}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{{ post.like_count || post.likes_count || 0 }}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>{{ post.comment_count || post.comments_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getCoverImageUrl } from '../../lib/storage';

// 型定義を追加
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  created_at: string;
  views?: number;
  author_name?: string | null;
  nickname?: string | null;
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  title_highlight?: string;
  excerpt_highlight?: string;
  avatar_url?: string | null;
}

const props = defineProps({
  post: {
    type: Object as () => Post,
    required: true
  }
});

// 日付フォーマット
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

// 画像URL取得
function getImageUrl(path: string): string {
  return getCoverImageUrl(path);
}
</script> 