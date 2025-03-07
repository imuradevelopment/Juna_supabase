<template>
  <router-link :to="`/posts/${post.id}`" class="post-card glass-card overflow-hidden block transition-all hover:shadow-xl hover:translate-y-[-5px] duration-300 relative rounded-xl">
    <!-- カード上部のアクセント装飾 -->
    <div class="absolute top-0 left-0 w-full h-1 card-accent opacity-70"></div>
    
    <div class="relative h-full flex flex-col">
      <!-- 特徴画像 - アスペクト比固定とオーバーレイ効果 -->
      <div class="aspect-video image-background relative overflow-hidden">
        <img 
          v-if="post.cover_image_path" 
          :src="getImageUrl(post.cover_image_path)" 
          :alt="post.title"
          class="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          loading="lazy"
        />
        <div v-else class="w-full h-full flex items-center justify-center image-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <!-- 時間表示オーバーレイ -->
        <div class="absolute bottom-3 right-3 timestamp-overlay text-xs px-2 py-1 rounded backdrop-blur-sm">
          {{ formatDate(post.created_at) }}
        </div>
      </div>
      
      <!-- 投稿情報 - 整理されたレイアウト -->
      <div class="p-5 flex-1 flex flex-col">
        <h3 class="text-xl font-semibold mb-2 card-title line-clamp-2">{{ post.title }}</h3>
        <p class="text-sm mb-4 card-description line-clamp-3">{{ post.excerpt }}</p>
        
        <!-- ユーザー情報 -->
        <div class="flex items-center mt-auto pt-3 border-t">
          <div class="w-8 h-8 rounded-full avatar-container flex items-center justify-center mr-3 overflow-hidden">
            <img 
              v-if="post.profiles?.avatar_data" 
              :src="getAvatarUrl(post.profiles.avatar_data)" 
              :alt="post.profiles?.nickname || '不明なユーザー'"
              class="w-full h-full rounded-full object-cover"
            />
            <div v-else class="w-full h-full avatar-placeholder flex items-center justify-center">
              {{ getInitials(post.profiles?.nickname || '不明なユーザー') }}
            </div>
          </div>
          <span class="text-sm author-name">{{ post.profiles?.nickname || '不明なユーザー' }}</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl, getCoverImageUrl } from '../../lib/storage';

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});

// 日付フォーマット
function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

// イニシャル取得
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

// 画像URL取得
function getImageUrl(path: string): string {
  return getCoverImageUrl(path);
}

// アバターURL取得
function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}
</script> 