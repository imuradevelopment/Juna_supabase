<template>
  <div class="rich-text-content prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none" v-html="content"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// @ts-ignore - DOMPurifyの型定義がない場合
import DOMPurify from 'dompurify';

const props = defineProps({
  content: {
    type: [String, Object],  // 文字列とオブジェクト両方を受け入れる
    default: ''
  }
});

// XSS対策のため、コンテンツをサニタイズ
const sanitizedContent = computed(() => {
  if (!props.content) return '';
  
  // コンテンツがJSONBオブジェクトの場合
  if (typeof props.content === 'object') {
    try {
      // Tiptapのコンテンツからテキスト抽出（例）
      if (props.content.text) {
        return DOMPurify.sanitize(props.content.text);
      }
      return DOMPurify.sanitize(JSON.stringify(props.content));
    } catch (e) {
      console.error('コンテンツ処理エラー:', e);
      return '';
    }
  }
  
  // 文字列の場合は直接サニタイズ
  return DOMPurify.sanitize(props.content, {
    ADD_ATTR: ['target'],
    ADD_TAGS: ['iframe'],
    ALLOWED_ATTR: ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
  });
});

// コンテンツを表示
const content = computed(() => sanitizedContent.value);
</script>

<style>
.rich-text-content img {
  @apply max-w-full rounded-lg my-4;
}

.rich-text-content a {
  @apply text-primary hover:underline;
}

.rich-text-content blockquote {
  @apply border-l-4 border-primary pl-4 italic;
}

.rich-text-content code {
  @apply bg-gray-100 dark:bg-gray-800 px-1 rounded;
}

.rich-text-content pre {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto;
}
</style> 