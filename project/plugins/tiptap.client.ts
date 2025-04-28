// Tiptapはクライアントサイドでのみ実行されるプラグイン
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Typography from '@tiptap/extension-typography'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'

// デフォルトの拡張機能をまとめた関数をエクスポート
export const createTiptapExtensions = (options = {}) => {
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

export default defineNuxtPlugin(() => {
  // アプリケーション全体で使用できるようにする
  // provide は削除 (もし他に provide するものがなければ return も不要)
}) 