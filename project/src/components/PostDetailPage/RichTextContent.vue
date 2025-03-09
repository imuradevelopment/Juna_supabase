<template>
  <div class="rich-text-content prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none" v-html="content"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  max-width: 100%;
  border-radius: 0.5rem; /* rounded-lg */
  margin-top: 1rem;
  margin-bottom: 1rem; /* my-4 */
}

.rich-text-content a {
  color: var(--primary); /* text-primary */
}
.rich-text-content a:hover {
  text-decoration: underline;
}

.rich-text-content blockquote {
  border-left-width: 4px;
  border-left-color: var(--primary);
  padding-left: 1rem;
  font-style: italic;
}

.rich-text-content code {
  background-color: rgba(243, 244, 246, 1); /* bg-gray-100 */
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  border-radius: 0.25rem;
}
.dark .rich-text-content code {
  background-color: rgba(31, 41, 55, 1); /* dark:bg-gray-800 */
}

.rich-text-content pre {
  background-color: rgba(243, 244, 246, 1); /* bg-gray-100 */
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
}
.dark .rich-text-content pre {
  background-color: rgba(31, 41, 55, 1); /* dark:bg-gray-800 */
}
</style> 