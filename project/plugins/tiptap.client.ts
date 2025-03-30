// Tiptapはクライアントサイドでのみ実行されるプラグイン
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Typography from '@tiptap/extension-typography'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'

export default defineNuxtPlugin(() => {
  // デフォルトの拡張機能をまとめた関数
  const createTiptapExtensions = (options = {}) => {
    return [
      StarterKit.configure(),
      Link.configure({
        openOnClick: false,
        // リンクの設定
        HTMLAttributes: {
          class: 'tiptap-link',
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
      Image.configure({
        // 画像の設定
        allowBase64: true,
        HTMLAttributes: {
          class: 'tiptap-image'
        }
      }),
      Typography.configure(),
      CodeBlock.configure({
        // コードブロックの設定
        HTMLAttributes: {
          class: 'tiptap-codeblock'
        }
      }),
      Placeholder.configure({
        // プレースホルダーの設定
        placeholder: useRuntimeConfig().public.tiptap?.defaultOptions?.placeholder || 'ここに内容を入力してください...'
      })
    ]
  }

  // アプリケーション全体で使用できるようにする
  return {
    provide: {
      tiptap: {
        createTiptapExtensions,
      }
    }
  }
}) 