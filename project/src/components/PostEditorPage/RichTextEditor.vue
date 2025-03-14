<template>
  <div class="rich-text-editor">
    <!-- エディターメニュー -->
    <div class="glass-card p-2 mb-2 flex flex-wrap gap-1">
      <!-- 見出し -->
      <button
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('heading', { level: 2 }) }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="見出し2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('heading', { level: 3 }) }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="見出し3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- 太字、斜体、取り消し線 -->
      <button
        @click="editor?.chain().focus().toggleBold().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('bold') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="太字"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleItalic().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('italic') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="斜体"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleStrike().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('strike') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="取り消し線"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- リスト -->
      <button
        @click="editor?.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('bulletList') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="箇条書き"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('orderedList') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="番号付きリスト"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- ブロック操作 -->
      <button
        @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('blockquote') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="引用"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().setHorizontalRule().run()"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="水平線"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- リンク -->
      <button
        @click="showLinkModalDialog"
        :class="{ 'bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]': editor?.isActive('link') }"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="リンク"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- 画像アップロード -->
      <button
        @click="openFileDialog"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="画像"
        :disabled="uploading"
      >
        <svg v-if="!uploading" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <svg v-else class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <input 
          ref="fileInput"
          type="file" 
          accept="image/*" 
          class="hidden" 
          @change="uploadImage"
        />
      </button>
      
      <!-- 元に戻す、やり直し -->
      <button
        @click="editor?.chain().focus().undo().run()"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="元に戻す"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="editor?.chain().focus().redo().run()"
        class="p-1.5 rounded hover:bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text-muted))]"
        title="やり直し"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <!-- エディター本体 -->
    <div 
      class="glass-card p-4"
      :class="{ 'ring-2 ring-[rgb(var(--color-primary))] ring-opacity-50': isFocused }"
    >
      <EditorContent 
        :editor="editor as Editor" 
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="[&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-[rgb(var(--color-heading))] [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-[rgb(var(--color-heading))] [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:text-[rgb(var(--color-text))] [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_blockquote]:border-l-[3px] [&_.ProseMirror_blockquote]:border-[rgb(var(--color-border-light))] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-[rgb(var(--color-text-muted))] [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_hr]:border-0 [&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-[rgb(var(--color-border-light))] [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:my-2 [&_.ProseMirror_a]:text-[rgb(var(--color-primary))] [&_.ProseMirror_a]:underline"
      />
    </div>
    
    <!-- リンクメニュー -->
    <div 
      v-if="showLinkMenu" 
      class="glass-card p-3 absolute z-20 shadow-[0_4px_10px_rgb(var(--color-background)/0.7)] rounded"
      :style="{ left: `${linkMenuPosition.x}px`, top: `${linkMenuPosition.y}px` }"
    >
      <div class="flex items-center mb-2">
        <input 
          v-model="linkUrl"
          type="text"
          placeholder="URLを入力"
          class="px-2 py-1 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] text-sm flex-1"
        />
      </div>
      <div class="flex justify-end space-x-2">
        <button 
          @click="showLinkMenu = false"
          class="px-2 py-1 text-xs rounded bg-[rgb(var(--color-surface-accent))] hover:bg-[rgb(var(--color-surface-variant))] text-[rgb(var(--color-text))]"
        >
          キャンセル
        </button>
        <button 
          @click="removeLink"
          class="px-2 py-1 text-xs rounded bg-[rgb(var(--color-error)/0.3)] text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error)/0.5)]"
          :disabled="!editor?.isActive('link')"
        >
          リンク解除
        </button>
        <button 
          @click="applyLink"
          class="px-2 py-1 text-xs rounded bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-white))] hover:bg-[rgb(var(--color-primary-dark))]"
          :disabled="!linkUrl"
        >
          適用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';

// エディターの型を修正
const editor = ref<Editor | undefined>(undefined);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const showLinkModal = ref(false);
const linkUrl = ref('');
const showLinkMenu = ref(false);
const linkMenuPosition = ref({ x: 0, y: 0 });
const isFocused = ref(false);
const authStore = useAuthStore();

// アップロードした画像を記録（投稿作成時に使用）
const uploadedImages = ref<{path: string, userId: string}[]>([]);

// アップロードした画像の情報をemitするイベント
const emit = defineEmits(['update:modelValue', 'imagesUploaded']);

// URL検出の正規表現
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// モデル値
const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  placeholder: {
    type: String,
    default: '内容を入力してください...'
  }
});

// エディター初期化
onMounted(() => {
  try {
    // モデル値が空の場合の対応
    const initialContent = props.modelValue || '';
    
    editor.value = new Editor({
      content: initialContent,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: props.placeholder,
        }),
        Image.configure({
          allowBase64: true,
          inline: true,
        }),
        Link.configure({
          openOnClick: false,
        }),
      ],
      onUpdate: () => {
        if (editor.value) {
          // HTMLテキストとして出力
          const html = editor.value.getHTML();
          // HTMLをそのまま親コンポーネントに渡す
          emit('update:modelValue', html);
        }
      },
      onFocus: () => {
        // クラス追加の処理を削除
        isFocused.value = true;
      },
      onBlur: () => {
        // クラス削除の処理を削除
        isFocused.value = false;
      }
    });
  } catch (error) {
    console.error('エディタの初期化に失敗しました:', error);
  }
});

// watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (!editor.value || !newValue) return;
  
  const editorContent = editor.value.getHTML();
  // 現在のエディタ内容と新しい値が異なる場合のみ更新
  if (typeof newValue === 'object') {
    // JSONBオブジェクトの場合
    const currentJson = editor.value.getJSON();
    if (JSON.stringify(currentJson) !== JSON.stringify(newValue)) {
      editor.value.commands.setContent(newValue);
    }
  } else if (typeof newValue === 'string' && newValue !== editorContent) {
    // 文字列（HTML）の場合
    editor.value.commands.setContent(newValue);
  }
}, { deep: true });

// リンク挿入モーダルを表示
function showLinkModalDialog() {
  if (!editor.value) return;
  
  // カーソル位置を取得
  const { state, view } = editor.value;
  const { from, to } = state.selection;
  
  // 選択テキストがURLの場合は初期値として設定
  const selectedText = state.doc.textBetween(from, to);
  
  if (selectedText.match(urlRegex)) {
    linkUrl.value = selectedText;
  } else {
    linkUrl.value = '';
  }
  
  // リンクメニューを表示
  showLinkMenu.value = true;
  
  // メニュー位置をカーソル位置に設定
  const coords = view.coordsAtPos(from);
  linkMenuPosition.value = { x: coords.right, y: coords.bottom + 10 };
}

// リンク挿入
function insertLink() {
  if (!editor.value || !linkUrl.value.trim()) {
    showLinkModal.value = false;
    return;
  }
  
  // URLの形式を確認し、必要なら修正
  let url = linkUrl.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  editor.value.chain().focus().setLink({ href: url }).run();
  showLinkModal.value = false;
  linkUrl.value = '';
}

// 画像アップロードとエディタへの挿入
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0 || !editor.value) return;
  
  const file = input.files[0];
  uploading.value = true;
  
  try {
    // ファイル名をUUIDに置き換えて拡張子を保持
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const userId = authStore.user?.id;
    
    if (!userId) {
      throw new Error('ユーザーIDが取得できません');
    }
    
    // RLSポリシーに対応するため、ユーザーIDをフォルダ構造に含める
    const filePath = `${userId}/${fileName}`;
    
    // Supabaseストレージにアップロード
    const { error: uploadError } = await supabase.storage
      .from('post_images')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // 画像のパブリックURLを取得
    const { data } = supabase.storage
      .from('post_images')
      .getPublicUrl(filePath);
    
    // エディタに画像を挿入
    if (data && data.publicUrl) {
      editor.value.chain().focus().setImage({ src: data.publicUrl }).run();
      
      // アップロード済み画像として記録
      uploadedImages.value.push({
        path: filePath,
        userId: userId
      });
      
      // 親コンポーネントに画像情報を渡す
      emit('imagesUploaded', uploadedImages.value);
    }
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    alert('画像のアップロードに失敗しました');
  } finally {
    uploading.value = false;
    // ファイル選択をリセット
    if (fileInput.value) fileInput.value.value = '';
  }
}

// 画像選択ダイアログを開く
function openFileDialog() {
  fileInput.value?.click();
}

// コンポーネントがアンマウントされる前にエディターを破棄
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// リンク関連の関数追加
function applyLink() {
  // リンクを適用する処理
  insertLink();
}

function removeLink() {
  // リンクを削除する処理
  if (!editor.value) return;
  editor.value.chain().focus().unsetLink().run();
  showLinkMenu.value = false;
}

// 画像アップロード関数
function uploadImage(event: Event) {
  handleImageUpload(event);
}
</script>

<style scoped lang="postcss">
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgb(var(--color-text-muted));
  pointer-events: none;
  height: 0;
}
</style> 