<template>
  <router-link 
    :to="`/posts/${post.id}`" 
    class="glass-card relative block overflow-hidden rounded-xl transition-all"
    :class="[
      layout === 'vertical' ? 'flex-col' : 'p-4',
      hoverEffect ? 'duration-300 hover:shadow-primary/30' : '',
      layout === 'vertical' && hoverEffect ? 'hover:-translate-y-[5px] hover:shadow-primary-dark/40' : '',
      customClass
    ]"
  >
    <!-- 縦型レイアウト用アクセント装飾 -->
    <div 
      v-if="layout === 'vertical'" 
      class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-primary-light opacity-70"
    ></div>
    
    <div :class="layout === 'vertical' ? 'relative flex h-full flex-col' : 'flex'">
      <!-- 画像コンテナ - レイアウトに応じてサイズ変更 -->
      <div 
        :class="[
          'relative overflow-hidden',
          layout === 'vertical' ? 'aspect-video' : 'mr-4 flex-shrink-0 rounded-lg',
          layout === 'horizontal' ? 'h-24 w-24' : ''
        ]"
      >
        <img 
          v-if="post.cover_image_path" 
          :src="getImageUrl(post.cover_image_path)" 
          :alt="post.title"
          class="h-full w-full object-cover"
          :class="{ 'transition-transform duration-700 hover:scale-110': layout === 'vertical' }"
          loading="lazy"
        />
        <div 
          v-else 
          class="flex h-full w-full items-center justify-center bg-surface-variant/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
               :class="layout === 'vertical' ? 'h-12 w-12' : 'h-8 w-8'" 
               class="text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <!-- 日付オーバーレイ - 縦型レイアウトのみ -->
        <div 
          v-if="layout === 'vertical'" 
          class="absolute bottom-3 right-3 rounded px-2 py-1 text-xs backdrop-blur-sm bg-background/40 text-text-white"
        >
          {{ formatDate(post.published_at || post.created_at) }}
        </div>
      </div>
      
      <!-- コンテンツ部分 -->
      <div :class="layout === 'vertical' ? 'flex flex-1 flex-col p-5' : 'flex-1'">
        <!-- タイトル - ハイライト対応 -->
        <h3 
          :class="[
            'overflow-hidden',
            layout === 'vertical' ? 'mb-2 text-xl font-semibold text-heading' : 'mb-2 text-lg font-semibold text-heading'
          ]"
          :style="layout === 'vertical' ? {} : {'-webkit-line-clamp': 2, display: '-webkit-box', '-webkit-box-orient': 'vertical'}"
          v-if="post.title_highlight" 
          v-html="post.title_highlight"
        ></h3>
        <h3 
          :class="[
            'overflow-hidden',
            layout === 'vertical' ? 'mb-2 text-xl font-semibold text-heading' : 'mb-2 text-lg font-semibold text-heading'
          ]"
          :style="layout === 'vertical' ? {} : {'-webkit-line-clamp': 2, display: '-webkit-box', '-webkit-box-orient': 'vertical'}"
          v-else
        >{{ post.title }}</h3>
        
        <!-- 抜粋 - ハイライト対応 -->
        <p 
          v-if="post.excerpt_highlight" 
          :class="[
            'overflow-hidden',
            layout === 'vertical' ? 'mb-4 text-sm text-text-muted' : 'mb-2 text-sm text-text-muted'
          ]"
          :style="{'-webkit-line-clamp': layout === 'vertical' ? 3 : 2, display: '-webkit-box', '-webkit-box-orient': 'vertical'}"
          v-html="post.excerpt_highlight"
        ></p>
        <p 
          v-else-if="post.excerpt" 
          :class="[
            'overflow-hidden',
            layout === 'vertical' ? 'mb-4 text-sm text-text-muted' : 'mb-2 text-sm text-text-muted'
          ]"
          :style="{'-webkit-line-clamp': layout === 'vertical' ? 3 : 2, display: '-webkit-box', '-webkit-box-orient': 'vertical'}"
        >
          {{ post.excerpt }}
        </p>
        
        <!-- フッター部分 -->
        <div 
          v-if="layout === 'vertical'" 
          class="mt-auto flex items-center border-t border-border-light pt-3"
        >
          <!-- ユーザーアバター -->
          <div class="mr-3 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
            <img 
              v-if="post.profiles?.avatar_data || post.avatar_url" 
              :src="getAvatarUrl(post.profiles?.avatar_data || post.avatar_url!)" 
              :alt="getUserName()"
              class="h-full w-full rounded-full object-cover"
            />
            <div 
              v-else 
              class="flex h-full w-full items-center justify-center bg-primary-dark/30 text-text"
            >
              {{ getInitials(getUserName()) }}
            </div>
          </div>
          <span class="text-sm text-text">{{ getUserName() }}</span>
          
          <!-- 統計情報（オプション） -->
          <div v-if="showStats" class="ml-auto flex space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="text-text-muted">{{ post.views || 0 }}</span>
          </div>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-accent2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span class="text-text-muted">{{ post.like_count || post.likes_count || 0 }}</span>
          </div>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-accent3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span class="text-text-muted">{{ post.comment_count || post.comments_count || 0 }}</span>
          </div>
        </div>
        
        <!-- 横型レイアウト用フッター -->
        <div v-else class="flex items-center justify-between text-xs text-text-muted">
          <div class="flex items-center">
            <span class="mr-3">{{ formatDate(post.published_at || post.created_at) }}</span>
            <span class="mr-1">{{ getUserName() }}</span>
          </div>
          
          <!-- 統計情報（横型では常に表示） -->
          <div class="flex space-x-3">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{{ post.views || 0 }}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-accent2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{{ post.like_count || post.likes_count || 0 }}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4 text-accent3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl, getCoverImageUrl } from '../../lib/storage';

// 投稿の型定義
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  created_at: string;
  views?: number;
  profiles?: {
    nickname?: string | null;
    avatar_data?: string | null;
  };
  nickname?: string | null;
  author_name?: string | null;
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  title_highlight?: string;
  excerpt_highlight?: string;
  avatar_url?: string | null;
}

// プロップス定義
const props = defineProps({
  post: {
    type: Object as () => Post,
    required: true
  },
  layout: {
    type: String,
    default: 'vertical',
    validator: (value: string) => ['vertical', 'horizontal'].includes(value)
  },
  showStats: {
    type: Boolean,
    default: false
  },
  hoverEffect: {
    type: Boolean,
    default: true
  },
  customClass: {
    type: String,
    default: ''
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

// ユーザー名取得 - 様々な場所から名前を取得可能にする
function getUserName(): string {
  return props.post.profiles?.nickname || 
         props.post.author_name || 
         props.post.nickname || 
         '不明なユーザー';
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