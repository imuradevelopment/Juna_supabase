<template>
  <div class="rich-text-editor">
    <!-- キーボードが非表示時のエディターメニュー -->
    <div 
      v-if="!isKeyboardVisible"
      ref="normalToolbar"
      class="glass-card flex flex-wrap gap-1 p-2 mb-2"
    >
      <!-- ツールバーの内容 -->
      <ToolbarButtons :editor="editor" @open-link-dialog="showLinkModalDialog" @open-file-dialog="openFileDialog" :uploading="uploading" />
    </div>
    
    <!-- エディター本体 -->
    <div 
      class="glass-card p-4"
      :class="{ 'ring-2 ring-primary ring-opacity-50': isFocused }"
    >
      <EditorContent 
        :editor="editor as Editor" 
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter.prevent="handleEnterKey"
        class="[&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-heading [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-heading [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:text-text [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_blockquote]:border-l-[3px] [&_.ProseMirror_blockquote]:border-border-light [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-text-muted [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_hr]:border-0 [&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-border-light [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:my-2 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline"
      />
    </div>
    
    <!-- リンクメニュー -->
    <div 
      v-if="showLinkMenu" 
      class="glass-card absolute z-20 rounded p-3 shadow-background/70"
      :style="{ left: `${linkMenuPosition.x}px`, top: `${linkMenuPosition.y}px` }"
    >
      <div class="flex items-center mb-2">
        <input 
          v-model="linkUrl"
          type="text"
          placeholder="URLを入力"
          class="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text"
        />
      </div>
      <div class="flex justify-end space-x-2">
        <button 
          @click="showLinkMenu = false"
          class="btn btn-secondary btn-sm"
        >
          キャンセル
        </button>
        <button 
          @click="removeLink"
          class="btn btn-error btn-sm"
          :disabled="!editor?.isActive('link')"
        >
          リンク解除
        </button>
        <button 
          @click="applyLink"
          class="btn btn-primary btn-sm"
          :disabled="!linkUrl"
        >
          適用
        </button>
      </div>
    </div>

    <!-- ファイル入力フィールドを改善（必須） -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      class="hidden w-px h-px opacity-0 absolute" 
      @change="uploadImage"
    />
  </div>
  
  <!-- キーボードが表示されていて、かつエディタがフォーカスされている場合のみツールバーをTeleportで移動 -->
  <Teleport to="body" v-if="isKeyboardVisible">
    <!-- キーボード表示時のエディターメニュー -->
    <div 
      ref="floatingToolbar"
      class="editor-toolbar glass-card flex flex-wrap gap-1 p-2 sticky-toolbar toolbar-active"
      :key="toolbarUpdateTrigger"
    >
      <!-- ツールバーの内容 -->
      <div class="flex flex-wrap gap-1">
        <!-- 見出し2ボタン -->
        <button
          type="button"
          class="btn-icon-info"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('heading', { level: 2 }) }"
          @touchend.prevent="toggleHeading2"
          title="見出し2"
        >
          <PhTextHTwo class="h-5 w-5" />
        </button>
        
        <!-- 見出し3ボタン -->
        <button
          class="btn-icon-info"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('heading', { level: 3 }) }"
          @touchend.prevent="toggleHeading3"
          title="見出し3"
        >
          <PhTextHThree class="h-5 w-5" />
        </button>

        <!-- 太字ボタン -->
        <button
          class="btn-icon-accent1"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('bold') }"
          @touchend.prevent="toggleBold"
          title="太字"
        >
          <PhTextBolder class="h-5 w-5" />
        </button>

        <!-- 斜体ボタン -->
        <button
          class="btn-icon-accent1"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('italic') }"
          @touchend.prevent="toggleItalic"
          title="斜体"
        >
          <PhTextItalic class="h-5 w-5" />
        </button>

        <!-- 取り消し線ボタン -->
        <button
          class="btn-icon-warning"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('strike') }"
          @touchend.prevent="toggleStrike"
          title="取り消し線"
        >
          <PhTextStrikethrough class="h-5 w-5" />
        </button>

        <!-- 箇条書きボタン -->
        <button
          class="btn-icon-accent2"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('bulletList') }"
          @touchend.prevent="toggleBulletList"
          title="箇条書き"
        >
          <PhListBullets class="h-5 w-5" />
        </button>

        <!-- 番号付きリストボタン -->
        <button
          class="btn-icon-accent2"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('orderedList') }"
          @touchend.prevent="toggleOrderedList"
          title="番号付きリスト"
        >
          <PhListNumbers class="h-5 w-5" />
        </button>

        <!-- 引用ボタン -->
        <button
          class="btn-icon-accent3"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('blockquote') }"
          @touchend.prevent="toggleBlockquote"
          title="引用"
        >
          <PhQuotes class="h-5 w-5" />
        </button>

        <!-- 水平線ボタン -->
        <button
          class="btn-icon-accent3"
          @touchend.prevent="setHorizontalRule"
          title="水平線"
        >
          <PhMinus class="h-5 w-5" />
        </button>

        <!-- リンクボタン -->
        <button
          class="btn-icon-primary"
          :class="{ 'bg-primary/20 text-primary': editor?.isActive('link') }"
          @touchend.prevent="showLinkModalDialog"
          title="リンク"
        >
          <PhLink class="h-5 w-5" />
        </button>

        <!-- 画像アップロードボタン -->
        <button
          class="btn-icon-success"
          @touchend.prevent="openFileDialog"
          title="画像"
          :disabled="uploading"
        >
          <PhSpinner v-if="uploading" class="h-5 w-5 animate-spin" />
          <PhImage v-else class="h-5 w-5" />
        </button>

        <!-- 元に戻すボタン -->
        <button
          class="btn-icon-secondary"
          @touchend.prevent="undoEdit"
          title="元に戻す"
        >
          <PhArrowCounterClockwise class="h-5 w-5" />
        </button>

        <!-- やり直しボタン -->
        <button
          class="btn-icon-secondary"
          @touchend.prevent="redoEdit"
          title="やり直し"
        >
          <PhArrowClockwise class="h-5 w-5" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, h, defineComponent } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { v4 as uuidv4 } from 'uuid';
import { 
  // 見出し用アイコン
  PhTextHTwo,
  PhTextHThree,
  // 書式用アイコン
  PhTextBolder,
  PhTextItalic,
  PhTextStrikethrough,
  // リスト用アイコン
  PhListBullets,
  PhListNumbers,
  // ブロック操作用アイコン
  PhQuotes,
  PhMinus,
  // リンク用アイコン
  PhLink,
  // 画像用アイコン
  PhImage,
  // 履歴操作用アイコン
  PhArrowCounterClockwise,
  PhArrowClockwise,
  // ローディング用アイコン
  PhSpinner
} from '@phosphor-icons/vue';
import { Teleport } from 'vue';

// エディターの型を修正
const editor = ref<Editor | undefined>(undefined);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const showLinkModal = ref(false);
const linkUrl = ref('');
const showLinkMenu = ref(false);
const linkMenuPosition = ref({ x: 0, y: 0 });
const isFocused = ref(false);

// キーボード表示状態を追跡
const isKeyboardVisible = ref(false);

// ツールバー参照
const floatingToolbar = ref<HTMLElement | null>(null);
const normalToolbar = ref<HTMLElement | null>(null);

// 画像を一時保存するための配列を追加
const pendingImages = ref<{file: File, id: string}[]>([]);

// モデル値
const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  placeholder: {
    type: String,
    default: '内容を入力してください...'
  },
  uploadingExternalImages: {
    type: Boolean,
    default: false
  }
});

// emitの定義を拡張
const emit = defineEmits([
  'update:modelValue', 
  'pending-images-updated',
  'upload-status-changed' // 新しいイベント
]);

// URL検出の正規表現（必要）
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// ToolbarButtonsコンポーネント - ツールバーの内容を共通化するためのコンポーネント
const ToolbarButtons = defineComponent({
  props: {
    editor: Object,
    uploading: Boolean
  },
  emits: ['open-link-dialog', 'open-file-dialog'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex flex-wrap gap-1' }, [
      // 見出し2ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-info', { 'bg-primary/20 text-primary': props.editor?.isActive('heading', { level: 2 }) }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleHeading({ level: 2 }).run();
        },
        title: '見出し2'
      }, [h(PhTextHTwo, { class: 'h-5 w-5' })]),
      
      // 見出し3ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-info', { 'bg-primary/20 text-primary': props.editor?.isActive('heading', { level: 3 }) }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleHeading({ level: 3 }).run();
        },
        title: '見出し3'
      }, [h(PhTextHThree, { class: 'h-5 w-5' })]),

      // 太字ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent1', { 'bg-primary/20 text-primary': props.editor?.isActive('bold') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleBold().run();
        },
        title: '太字'
      }, [h(PhTextBolder, { class: 'h-5 w-5' })]),

      // 斜体ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent1', { 'bg-primary/20 text-primary': props.editor?.isActive('italic') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleItalic().run();
        },
        title: '斜体'
      }, [h(PhTextItalic, { class: 'h-5 w-5' })]),

      // 取り消し線ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-warning', { 'bg-primary/20 text-primary': props.editor?.isActive('strike') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleStrike().run();
        },
        title: '取り消し線'
      }, [h(PhTextStrikethrough, { class: 'h-5 w-5' })]),

      // 箇条書きボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent2', { 'bg-primary/20 text-primary': props.editor?.isActive('bulletList') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleBulletList().run();
        },
        title: '箇条書き'
      }, [h(PhListBullets, { class: 'h-5 w-5' })]),

      // 番号付きリストボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent2', { 'bg-primary/20 text-primary': props.editor?.isActive('orderedList') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleOrderedList().run();
        },
        title: '番号付きリスト'
      }, [h(PhListNumbers, { class: 'h-5 w-5' })]),

      // 引用ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent3', { 'bg-primary/20 text-primary': props.editor?.isActive('blockquote') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().toggleBlockquote().run();
        },
        title: '引用'
      }, [h(PhQuotes, { class: 'h-5 w-5' })]),

      // 水平線ボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-accent3'],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().setHorizontalRule().run();
        },
        title: '水平線'
      }, [h(PhMinus, { class: 'h-5 w-5' })]),

      // リンクボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-primary', { 'bg-primary/20 text-primary': props.editor?.isActive('link') }],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          emit('open-link-dialog');
        },
        title: 'リンク'
      }, [h(PhLink, { class: 'h-5 w-5' })]),

      // 画像アップロードボタン（修正後）
      h('button', {
        type: 'button',
        class: ['btn-icon-success'],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          emit('open-file-dialog');
        },
        title: '画像',
        disabled: props.uploading
      }, [
        // v-ifとv-elseの代わりに条件演算子を使用
        props.uploading 
          ? h(PhSpinner, { class: 'h-5 w-5 animate-spin' })
          : h(PhImage, { class: 'h-5 w-5' })
      ]),

      // 元に戻すボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-secondary'],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().undo().run();
        },
        title: '元に戻す'
      }, [h(PhArrowCounterClockwise, { class: 'h-5 w-5' })]),

      // やり直しボタン
      h('button', {
        type: 'button',
        class: ['btn-icon-secondary'],
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          props.editor?.chain().focus().redo().run();
        },
        title: 'やり直し'
      }, [h(PhArrowClockwise, { class: 'h-5 w-5' })]),
    ]);
  }
});

// 既存のコードの下に追加
const toolbarUpdateTrigger = ref(0);

// エディター初期化を修正
onMounted(() => {
  try {
    const initialContent = props.modelValue || '';
    
    // カスタム画像拡張を定義
    const CustomImage = Image.extend({
      addAttributes() {
        // デフォルト属性を取得して拡張
        const defaultAttrs = {
          src: {
            default: null
          },
          alt: {
            default: null
          },
          title: {
            default: null
          }
        };
        
        // カスタム属性を追加
        return {
          ...defaultAttrs,
          'data-temp-id': {
            default: null,
            parseHTML: element => element.getAttribute('data-temp-id'),
            renderHTML: attributes => {
              if (!attributes['data-temp-id']) {
                return {};
              }
              return {
                'data-temp-id': attributes['data-temp-id'],
              };
            },
          },
        };
      },
    });
    
    editor.value = new Editor({
      content: initialContent,
      extensions: [
        StarterKit.configure({
          // Enterキーの動作を確実にするための設定
          hardBreak: {
            keepMarks: true
          }
        }),
        Placeholder.configure({
          placeholder: props.placeholder,
        }),
        CustomImage.configure({
          allowBase64: true,
          inline: true,
        }),
        Link.configure({
          openOnClick: false,
        }),
      ],
      editorProps: {
        // モバイル向けに追加設定
        handleKeyDown: (_view, event) => {
          // エンターキーが押されたとき
          if (event.key === 'Enter' && isKeyboardVisible.value) {
            // デフォルト処理に任せる（falseを返す）
            return false;
          }
          return false; // デフォルト処理を維持
        }
      },
      onUpdate: () => {
        if (editor.value) {
          const html = editor.value.getHTML();
          emit('update:modelValue', html);
        }
      },
      onFocus: () => {
        isFocused.value = true;
      },
      onBlur: () => {
        isFocused.value = false;
      }
    });

    // モバイル用のキーボード対応を追加
    if (typeof window.visualViewport !== 'undefined') {
      window.visualViewport?.addEventListener('resize', updateToolbarPosition);
      window.visualViewport?.addEventListener('scroll', updateToolbarPosition);
      // フォーカス時にも更新（念のため）
      if (editor.value) {
        editor.value.on('focus', updateToolbarPosition);
      }
    }

    // キーボード監視を改善
    const cleanupKeyboardWatchers = setupKeyboardWatchers();
    
    // cleanup関数をonBeforeUnmountに渡すための準備
    onBeforeUnmount(cleanupKeyboardWatchers);
    
    // 初期状態を適用
    updateToolbarPosition();
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

// アップロード状態の監視
watch(() => uploading.value, (newValue) => {
  // 親コンポーネントにアップロード状態の変更を通知
  emit('upload-status-changed', newValue);
});

// 画像アップロード機能を外部からも呼び出せるようにするためのメソッドを公開
defineExpose({
  // Base64エンコードを提供する関数
  encodeImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('画像のエンコードに失敗しました'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // 外部から画像を挿入するためのメソッド
  insertImage(imageUrl: string, tempId?: string) {
    if (!editor.value) return;
    
    const imageOptions: any = { src: imageUrl };
    if (tempId) {
      imageOptions['data-temp-id'] = tempId;
    }
    
    editor.value.chain().focus().setImage(imageOptions).run();
  }
});

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

// 画像アップロード処理を修正（即時アップロードせず一時保存）
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0 || !editor.value) return;
  
  const file = input.files[0];
  
  // ファイルサイズの上限チェック（2MB = 2 * 1024 * 1024 バイト）
  const maxSizeInBytes = 2 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    alert('画像サイズは最大2MBまでです');
    // ファイル選択をリセット
    if (fileInput.value) fileInput.value.value = '';
    return;
  }
  
  const imageId = uuidv4();
  
  try {
    // Base64エンコードして一時表示
    const reader = new FileReader();
    reader.onload = (e) => {
      if (editor.value && e.target?.result) {
        // 型アサーションを使用してTypeScriptエラーを回避
        const imageOptions = {
          src: e.target.result as string,
          'data-temp-id': imageId
        } as any; // 型アサーションでエラーを回避
        
        // 修正したオプションでエディタに画像を挿入
        editor.value.chain().focus().setImage(imageOptions).run();
        
        // 画像ファイルを一時保存
        pendingImages.value.push({
          file: file,
          id: imageId
        });
        
        // 親コンポーネントに通知
        emit('pending-images-updated', pendingImages.value);
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('画像処理エラー:', error);
    alert('画像の処理に失敗しました');
  } finally {
    // ファイル選択をリセット
    if (fileInput.value) fileInput.value.value = '';
  }
}

// ファイル選択ダイアログを開く - より堅牢な実装
function openFileDialog(e?: Event) {
  if (e) {
    e.preventDefault();
    e.stopPropagation(); // イベント伝播を停止
  }
  
  // モバイル環境でより確実に動作するよう変更
  setTimeout(() => {
    if (fileInput.value) {
      // iOS Safariで動作するよう直接クリックをシミュレート
      fileInput.value.click();
    } else {
      console.error('fileInput参照が見つかりません');
    }
  }, 10);
}

// 画像アップロード関数 - 引数をオプショナルに
function uploadImage(event: Event) {
  if (event) {
    event.preventDefault(); // イベントがある場合のみpreventDefault()を実行
    event.stopPropagation(); // イベント伝播を停止
  }
  handleImageUpload(event);
}

// ページのスクロール状態も監視するために追加
function setupKeyboardWatchers() {
  if (typeof window.visualViewport !== 'undefined' && window.visualViewport) {
    // 既存のリスナーを設定
    window.visualViewport.addEventListener('resize', updateToolbarPosition);
    window.visualViewport.addEventListener('scroll', updateToolbarPosition);
    
    // スクロールイベントも監視
    window.addEventListener('scroll', updateToolbarPosition);
    
    // iOS向けの追加対策
    window.addEventListener('orientationchange', () => {
      // 向き変更後に再計算
      setTimeout(updateToolbarPosition, 100);
    });
    
    // 定期的に位置を更新（iOS対策）
    const intervalId = setInterval(updateToolbarPosition, 300);
    
    // クリーンアップ用に返す
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateToolbarPosition);
        window.visualViewport.removeEventListener('scroll', updateToolbarPosition);
      }
      window.removeEventListener('scroll', updateToolbarPosition);
      window.removeEventListener('orientationchange', updateToolbarPosition);
      clearInterval(intervalId);
    };
  }
  return () => {}; // visualViewportがない場合は空の関数を返す
}

// キーボード表示状態の検出と位置更新を改善
function updateToolbarPosition() {
  if (typeof window.visualViewport === 'undefined' || !window.visualViewport) return;
  
  // キーボードの高さを計算
  const keyboardHeight = window.innerHeight - (window.visualViewport.height || window.innerHeight);
  
  // iOS/Androidのスクロール位置を考慮
  const viewportOffsetTop = window.visualViewport.offsetTop || 0;
  
  // キーボードの表示状態を更新
  isKeyboardVisible.value = keyboardHeight > 100; // 100px以上の差があれば確実にキーボード表示と判断
  
  // ツールバーの位置を更新
  if (isKeyboardVisible.value && floatingToolbar.value) {
    // フローティングツールバーのスタイルを設定
    floatingToolbar.value.style.position = 'fixed';
    floatingToolbar.value.style.bottom = `${keyboardHeight}px`;
    floatingToolbar.value.style.left = '0';
    floatingToolbar.value.style.right = '0';
    floatingToolbar.value.style.zIndex = '100';
    floatingToolbar.value.style.transform = `translateY(${viewportOffsetTop}px)`;
    floatingToolbar.value.style.padding = '8px';
    floatingToolbar.value.style.borderRadius = '0';
    
    // アニメーションを滑らかにするためにtransitionを調整
    floatingToolbar.value.style.transition = 'bottom 0.15s ease-out, transform 0.15s ease-out';
  }
}

// コンポーネントがアンマウントされる前にエディターとイベントリスナーを破棄
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  
  // イベントリスナーのクリーンアップ
  if (typeof window.visualViewport !== 'undefined') {
    window.visualViewport?.removeEventListener('resize', updateToolbarPosition);
    window.visualViewport?.removeEventListener('scroll', updateToolbarPosition);
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

// 各ツールバーボタンの関数を修正
function toggleHeading2() {
  if (editor.value) {
    editor.value.chain().focus().toggleHeading({ level: 2 }).run();
    forceToolbarUpdate();
  }
}

function toggleHeading3() {
  if (editor.value) {
    editor.value.chain().focus().toggleHeading({ level: 3 }).run();
    forceToolbarUpdate();
  }
}

function toggleBold() {
  if (editor.value) {
    editor.value.chain().focus().toggleBold().run();
    forceToolbarUpdate();
  }
}

function toggleItalic() {
  if (editor.value) {
    editor.value.chain().focus().toggleItalic().run();
    forceToolbarUpdate();
  }
}

function toggleStrike() {
  if (editor.value) {
    editor.value.chain().focus().toggleStrike().run();
    forceToolbarUpdate();
  }
}

function toggleBulletList() {
  if (editor.value) {
    editor.value.chain().focus().toggleBulletList().run();
    forceToolbarUpdate();
  }
}

function toggleOrderedList() {
  if (editor.value) {
    editor.value.chain().focus().toggleOrderedList().run();
    forceToolbarUpdate();
  }
}

function toggleBlockquote() {
  if (editor.value) {
    editor.value.chain().focus().toggleBlockquote().run();
    forceToolbarUpdate();
  }
}

function setHorizontalRule() {
  if (editor.value) {
    editor.value.chain().focus().setHorizontalRule().run();
  }
}

function undoEdit() {
  if (editor.value) {
    editor.value.chain().focus().undo().run();
  }
}

function redoEdit() {
  if (editor.value) {
    editor.value.chain().focus().redo().run();
  }
}

// ツールバーの強制更新関数を追加
function forceToolbarUpdate() {
  // Vue の反応性システムを利用して、ツールバーを再レンダリング
  toolbarUpdateTrigger.value += 1;
  
  // 100ms後にもう一度更新（状態の変更が非同期の場合のため）
  setTimeout(() => {
    toolbarUpdateTrigger.value += 1;
  }, 100);
}

// エディター本体の修正部分
function handleEnterKey(e: KeyboardEvent) {
  if (!editor.value) return;
  
  // モバイルキーボードでエンターキーが押されたとき
  if (isKeyboardVisible.value) {
    // エンターキーのデフォルト動作を防止
    e.preventDefault();
    
    // 手動で改行を挿入
    editor.value.commands.enter();
    
    // ツールバーの状態を更新（必要に応じて）
    forceToolbarUpdate();
  }
}

// watch関数でもキーボードの状態を監視
watch(() => isFocused.value, (newValue) => {
  if (newValue) {
    // フォーカスされたときに位置を更新
    updateToolbarPosition();
    // 少し遅れて再度更新（iOSの遅延対策）
    setTimeout(updateToolbarPosition, 300);
  }
});

// エディタの内容が変わったときにもツールバーの位置を更新
watch(() => editor.value?.getHTML(), () => {
  if (isKeyboardVisible.value) {
    updateToolbarPosition();
  }
});
</script>

<style scoped lang="postcss">
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: theme('colors.text-muted');
  pointer-events: none;
  height: 0;
}

.sticky-toolbar {
  transition: transform 0.15s ease-out, bottom 0.15s ease-out;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100%;
  /* iOSのノッチ対応 */
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.toolbar-active {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.editor-toolbar {
  transition: all 0.2s ease-out;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

/* タップ領域を広げる */
.editor-toolbar button {
  min-width: 40px;
  min-height: 40px;
  touch-action: manipulation;
  position: relative;
}

/* iOSでのハプティックフィードバック防止 */
.editor-toolbar button {
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
</style> 