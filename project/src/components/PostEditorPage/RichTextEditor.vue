<template>
  <div class="rich-text-editor">
    <!-- キーボードが非表示時のエディターメニュー -->
    <div 
      v-if="!isKeyboardVisible"
      ref="normalToolbar"
      class="glass-card flex flex-wrap gap-1 p-2 mb-2"
    >
      <!-- ツールバーを新しいコンポーネントに置き換え -->
      <EditorToolbar 
        :editor="editor" 
        :uploading="uploading" 
        @open-link-dialog="showLinkModalDialog" 
        @open-file-dialog="openFileDialog"
      />
    </div>
    
    <!-- エディター本体 -->
    <div 
      class="glass-card p-4"
      :class="{ 'ring-2 ring-primary ring-opacity-50': isFocused }"
    >
      <EditorContent 
        :editor="editor" 
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter.prevent="handleEnterKey"
        class="[&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-heading [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-heading [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:text-text [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_blockquote]:border-l-[3px] [&_.ProseMirror_blockquote]:border-border-light [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-text-muted [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_hr]:border-0 [&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-border-light [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:my-2 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline"
      />
    </div>
    
    <!-- ファイル入力フィールド -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      class="hidden w-px h-px opacity-0 absolute" 
      @change="uploadImage"
    />
  </div>
  
  <!-- キーボードが表示されていて、かつエディタがフォーカスされている場合のみツールバーをTeleportで移動 -->
  <Teleport to="body" v-if="isKeyboardVisible && (isFocused || showLinkMenu)">
    <!-- キーボード表示時のエディターメニュー -->
    <div 
      ref="floatingToolbar"
      class="sticky-toolbar toolbar-active editor-toolbar glass-card flex flex-wrap gap-1 p-2"
      @pointerdown.stop.prevent="preventBlur"
      @touchstart.stop.prevent="preventBlur"
      @mousedown.stop.prevent="preventBlur"
    >
      <!-- ツールバーを新しいコンポーネントに置き換え -->
      <EditorToolbar 
        :editor="editor" 
        :uploading="uploading" 
        @open-link-dialog="showLinkModalDialog" 
        @open-file-dialog="openFileDialog"
      />
    </div>
  </Teleport>

  <!-- リンクメニューを常にTeleportで表示する -->
  <Teleport to="body">
    <!-- EditorLinkMenuコンポーネントを使用し、必要なイベントを設定 -->
    <EditorLinkMenu
      ref="linkMenuRef"
      :editor="editor"
      :visible="showLinkMenu"
      :position="linkMenuPosition"
      :is-keyboard-visible="isKeyboardVisible"
      :selected-text="selectedText"
      :initial-url="linkUrl"
      :initial-text="linkText"
      @close="showLinkMenu = false"
      @apply="handleLinkApplied"
      @remove="handleLinkRemoved"
      @open="handleLinkMenuOpen"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { v4 as uuidv4 } from 'uuid';
import EditorToolbar from './EditorToolbar.vue';
import EditorLinkMenu from './EditorLinkMenu.vue';

// エディターの型を修正
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
// リンク関連の状態を単純化
const showLinkMenu = ref(false);
const linkMenuPosition = ref({ x: 0, y: 0 });
const isFocused = ref(false);
const selectedText = ref('');
// リンク初期値
const linkUrl = ref('');
const linkText = ref('');

// リンクメニューの参照
const linkMenuRef = ref<InstanceType<typeof EditorLinkMenu> | null>(null);

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

// useEditorを使用してエディタを作成
const editor = useEditor({
  content: props.modelValue || '',
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
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    emit('update:modelValue', html);
    
    // リンクマークの不適切な残存を確認・修正
    if (editor.isActive('link')) {
      const { state } = editor;
      const { from, to } = state.selection;
      
      // 選択範囲が空（カーソル位置）かリンクの中身が空かを確認
      if (from === to) {
        const node = state.doc.nodeAt(from);
        // リンクの内容が空（またはリンク内のテキストなし）の場合
        const isEmpty = node?.isText && node.text === '';
        
        // カーソル位置の前後のノードを確認して空リンクを検出
        const prevPos = Math.max(0, from - 1);
        const prevNode = state.doc.nodeAt(prevPos);
        const prevMarks = prevNode ? prevNode.marks.filter(mark => mark.type.name === 'link') : [];
        
        const nextPos = Math.min(state.doc.content.size, to + 1);
        const nextNode = state.doc.nodeAt(nextPos);
        const nextMarks = nextNode ? nextNode.marks.filter(mark => mark.type.name === 'link') : [];
        
        // 空のリンクやリンクの境界にいる場合はリンクマークを解除
        if (isEmpty || (prevMarks.length === 0 && nextMarks.length === 0)) {
          editor.chain().focus().unsetMark('link').run();
        }
      }
    }
  },
  onFocus: () => {
    isFocused.value = true;
  },
  onBlur: () => {
    isFocused.value = false;
  }
});

// エディター初期化後の処理
onMounted(() => {
  try {
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

// リンクダイアログを表示する関数
function showLinkModalDialog() {
  if (!editor.value) return;
  
  // EditorLinkMenuコンポーネントのshowLinkMenu関数を呼び出す
  if (linkMenuRef.value) {
    linkMenuRef.value.showLinkMenu();
  }
}

// リンクメニューを開く処理
function handleLinkMenuOpen(data: { 
  position: { x: number, y: number }, 
  initialUrl: string, 
  initialText: string, 
  selectedText: string 
}) {
  // リンクメニューのデータを設定
  linkMenuPosition.value = data.position;
  linkUrl.value = data.initialUrl;
  linkText.value = data.initialText;
  selectedText.value = data.selectedText;
  
  // リンクメニューを表示
  showLinkMenu.value = true;
}

// リンク適用時のハンドラ
function handleLinkApplied(data: { url: string, text: string }) {
  if (!editor.value) return;
  
  // EditorLinkMenuコンポーネントのhandleApplyLink関数を呼び出す
  if (linkMenuRef.value) {
    linkMenuRef.value.handleApplyLink(data);
  }
  
  // リンクメニューを閉じる
  showLinkMenu.value = false;
}

// リンク削除時のハンドラ
function handleLinkRemoved() {
  if (!editor.value) return;
  editor.value.chain().focus().unsetLink().run();
  
  // リンクメニューを閉じる
  showLinkMenu.value = false;
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
  
  // キーボードの表示状態を更新（前の値と比較）
  const wasKeyboardVisible = isKeyboardVisible.value;
  isKeyboardVisible.value = keyboardHeight > 100; // 100px以上の差があれば確実にキーボード表示と判断
  
  // キーボード表示状態が変わったときのみ再レンダリング
  if (wasKeyboardVisible !== isKeyboardVisible.value) {
  }
  
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
    floatingToolbar.value.style.userSelect = 'none';
  }
}

// フォーカス喪失を防止する関数
function preventBlur(e: Event) {
  // デフォルトのフォーカス喪失を防止
  e.preventDefault();
  
  // タップ後、エディタに再フォーカスする
  if (editor.value) {
    // 即時フォーカスすると他のイベントが干渉するため、少し遅延させる
    setTimeout(() => {
      editor.value?.commands.focus();
    }, 10);
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

// ツールバーの強制更新関数
function forceToolbarUpdate() {
  // 実行中の場合はスキップ
  if (updatingToolbar) return;
  
  // 更新中フラグをセット
  updatingToolbar = true;
  
  try {
    // エディタにフォーカスを戻す
    if (editor.value) {
      setTimeout(() => {
        try {
          editor.value?.commands.focus();
        } catch (e) {
          console.error('エディタフォーカス時エラー:', e);
        }
      }, 10);
    }
  } finally {
    // 更新フラグをリセット（少し遅延させる）
    setTimeout(() => {
      updatingToolbar = false;
    }, 100);
  }
}

// ツールバー更新中フラグ
let updatingToolbar = false;

// watch関数でもキーボードの状態を監視
watch(() => isFocused.value, (newValue) => {
  if (newValue) {
    // フォーカスされたときに位置を更新
    updateToolbarPosition();
    // 少し遅れて再度更新（iOSの遅延対策）
    setTimeout(updateToolbarPosition, 300);
  } else {
    // フォーカスが外れた後、少し待ってからキーボード表示状態をリセット
    // ツールバーボタンタップでのフォーカス喪失後にも十分な時間を確保
    setTimeout(() => {
      if (!isFocused.value) {
        isKeyboardVisible.value = false;
      }
    }, 250);
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
  /* タッチイベントをキャプチャ */
  touch-action: none;
}

.toolbar-active {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.editor-toolbar {
  transition: none; /* アニメーション無効化 */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}
</style> 