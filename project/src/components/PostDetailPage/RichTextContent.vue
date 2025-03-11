<template>
  <div class="rich-text-content max-w-none" v-html="content"></div>
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

// コンテンツ処理を改善：JSONBオブジェクトの構造をより適切に処理する
const sanitizedContent = computed(() => {
  if (!props.content) return '';
  
  // コンテンツがJSONBオブジェクトの場合
  if (typeof props.content === 'object') {
    try {
      // スキーマのpostsテーブルからJSONB形式のコンテンツを処理
      if (props.content.type === 'doc' && props.content.content) {
        // ProseMirror/Tiptap形式の処理
        return DOMPurify.sanitize(renderTiptapContent(props.content));
      } else if (props.content.html) {
        // html形式をそのまま利用
        return DOMPurify.sanitize(props.content.html, {
          ADD_ATTR: ['target'],
          ADD_TAGS: ['iframe'],
          ALLOWED_ATTR: ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
        });
      } else if (props.content.text) {
        // テキスト形式
        return DOMPurify.sanitize(props.content.text);
      }
      
      // その他の形式：JSON文字列として表示
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

// TiptapコンテンツをHTML文字列に変換する補助関数
function renderTiptapContent(doc: any): string {
  // シンプルなテキストを抽出する基本実装
  // 実際のプロジェクトでは、より高度なTiptap/ProseMirror処理が必要になる場合あり
  try {
    let html = '';
    
    if (Array.isArray(doc.content)) {
      doc.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
          html += '<p>';
          if (Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                let text = textNode.text || '';
                if (textNode.marks) {
                  textNode.marks.forEach((mark: any) => {
                    if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                    if (mark.type === 'italic') text = `<em>${text}</em>`;
                  });
                }
                html += text;
              }
            });
          }
          html += '</p>';
        } else if (node.type === 'heading') {
          const level = node.attrs?.level || 1;
          html += `<h${level}>`;
          if (node.content) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') html += textNode.text || '';
            });
          }
          html += `</h${level}>`;
        }
      });
    }
    
    return html;
  } catch (e) {
    console.error('Tiptapコンテンツレンダリングエラー:', e);
    return '';
  }
}

// コンテンツを表示
const content = computed(() => sanitizedContent.value);
</script>

<style>
.rich-text-content {
  /* proseの代わりに基本的なリッチテキスト用スタイルを追加 */
  color: rgb(var(--color-text));
  line-height: 1.75;
  font-size: 1rem;
}

.rich-text-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: rgb(var(--color-heading));
}

.rich-text-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: rgb(var(--color-heading));
}

.rich-text-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: rgb(var(--color-heading));
}

.rich-text-content p {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.rich-text-content ul, .rich-text-content ol {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.rich-text-content ul {
  list-style-type: disc;
}

.rich-text-content ol {
  list-style-type: decimal;
}

.rich-text-content li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.rich-text-content img {
  max-width: 100%;
  border-radius: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.rich-text-content a {
  color: rgb(var(--color-primary));
}
.rich-text-content a:hover {
  text-decoration: underline;
}

.rich-text-content blockquote {
  border-left-width: 4px;
  border-left-color: rgb(var(--color-primary));
  padding-left: 1rem;
  font-style: italic;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.rich-text-content code {
  background-color: rgb(var(--color-surface-variant));
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.rich-text-content pre {
  background-color: rgb(var(--color-surface-variant));
  padding: 1rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-family: monospace;
}

/* ダークモード固有のスタイルは不要（すでにダークテーマがデフォルト） */
</style> 