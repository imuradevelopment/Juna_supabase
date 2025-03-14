<template>
  <div 
    class="rich-text-content max-w-none text-[rgb(var(--color-text))] leading-[1.75] text-base prose dark:prose-invert prose-img:rounded-lg prose-img:shadow-[0_4px_8px_rgb(var(--color-background)/0.5)] prose-headings:text-[rgb(var(--color-heading))] prose-a:text-[rgb(var(--color-primary))] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-[rgb(var(--color-primary))] prose-code:bg-[rgb(var(--color-surface-variant))] prose-pre:bg-[rgb(var(--color-surface-variant))] prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal prose-li:my-1"
    v-html="content"
  ></div>
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
          html += '<p class="my-4">';
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
          const headingClasses = level === 1 ? 'text-2xl font-bold mt-6 mb-4 text-[rgb(var(--color-heading))]' : 
                                level === 2 ? 'text-xl font-semibold mt-6 mb-3 text-[rgb(var(--color-heading))]' : 
                                'text-lg font-semibold mt-5 mb-2 text-[rgb(var(--color-heading))]';
          
          html += `<h${level} class="${headingClasses}">`;
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