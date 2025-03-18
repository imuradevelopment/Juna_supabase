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
        :editor="editor || undefined" 
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
        :editor="editor as Editor" 
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
        :editor="editor || undefined" 
        :uploading="uploading" 
        @open-link-dialog="showLinkModalDialog" 
        @open-file-dialog="openFileDialog"
      />
    </div>
  </Teleport>

  <!-- リンクメニューを常にTeleportで表示する -->
  <Teleport to="body">
    <!-- リンクメニュー -->
    <div 
      v-if="showLinkMenu" 
      ref="linkMenu"
      class="floating-link-menu glass-card rounded p-3 shadow-lg z-30 fixed"
      :style="linkMenuStyle"
    >
      <div class="flex flex-col gap-2">
        <!-- リンクURL入力フィールド -->
        <div class="flex items-center">
          <input 
            ref="linkInput"
            v-model="linkUrl"
            type="text"
            placeholder="URLを入力"
            class="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text"
            @keydown.enter.prevent="applyLink"
            @keydown.esc.prevent="showLinkMenu = false"
          />
        </div>
        
        <!-- リンクテキスト入力フィールド -->
        <div class="flex items-center">
          <input 
            ref="linkTextInput"
            v-model="linkText"
            type="text"
            placeholder="リンクテキストを入力（省略可）"
            class="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text"
            @keydown.enter.prevent="applyLink"
            @keydown.esc.prevent="showLinkMenu = false"
          />
        </div>
      </div>
      <div class="flex justify-end space-x-2 mt-3">
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, computed, nextTick } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { v4 as uuidv4 } from 'uuid';
import EditorToolbar from './EditorToolbar.vue';

// エディターの型を修正
const editor = ref<Editor | undefined>(undefined);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const linkUrl = ref('');
const linkText = ref(''); // リンクテキスト用の新しい状態変数
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
          
          // リンクマークの不適切な残存を確認・修正
          if (editor.value.isActive('link')) {
            const { state } = editor.value;
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
                editor.value.chain().focus().unsetMark('link').run();
              }
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

// リンクメニュー関連を追加
const linkMenu = ref<HTMLElement | null>(null);
const linkInput = ref<HTMLInputElement | null>(null);
const linkTextInput = ref<HTMLInputElement | null>(null);

// リンクメニューのスタイルを動的に計算
const linkMenuStyle = computed(() => {
  if (!linkMenuPosition.value) return {};

  const { x, y } = linkMenuPosition.value;
  
  // モバイル向け（キーボード表示時）
  if (isKeyboardVisible.value) {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '90vw',
      width: '320px'
    };
  }
  
  // デスクトップまたはキーボード非表示モバイル向け
  return {
    left: `${x}px`,
    top: `${y}px`,
    maxWidth: '320px',
    width: 'auto'
  };
});

// リンク挿入モーダルを表示（更新）
function showLinkModalDialog() {
  if (!editor.value) return;
  
  // カーソル位置を取得
  const { state, view } = editor.value;
  const { from, to } = state.selection;
  
  // 選択テキストがURLの場合は初期値として設定
  const selectedText = state.doc.textBetween(from, to);
  
  if (selectedText.match(urlRegex)) {
    linkUrl.value = selectedText;
    linkText.value = ''; // URLが選択されている場合はテキスト欄をクリア
  } else if (editor.value.isActive('link')) {
    // 既存のリンクがある場合はその値を取得
    const attrs = editor.value.getAttributes('link');
    linkUrl.value = attrs.href || '';
    
    // リンクマークの範囲を最も正確に取得するためにProseMirror APIのみを使用
    console.log('リンクテキスト検出開始:', { pos: from });
    
    // リンク範囲を取得
    const linkRange = findLinkRange(state, from);
    if (linkRange) {
      // 範囲が見つかった場合は、その範囲のテキストを取得
      const linkTextContent = state.doc.textBetween(linkRange.from, linkRange.to);
      console.log('リンク範囲から検出:', { 
        text: linkTextContent, 
        from: linkRange.from, 
        to: linkRange.to,
        range: linkRange.to - linkRange.from
      });
      
      linkText.value = linkTextContent;
    } else {
      // リンク範囲が見つからない場合は選択テキストを使用
      linkText.value = selectedText;
    }
  } else {
    linkUrl.value = '';
    // リンクテキストは選択されたテキストを保持
    linkText.value = selectedText;
  }
  
  // リンクメニューを表示
  showLinkMenu.value = true;
  
  // メニュー位置をカーソル位置に設定
  const coords = view.coordsAtPos(from);
  
  // 画面の端に近い場合の調整
  let x = coords.right;
  let y = coords.bottom + 10;
  
  // キーボードが表示されている場合は中央に表示
  if (isKeyboardVisible.value) {
    x = window.innerWidth / 2;
    y = window.innerHeight / 2 - 100; // キーボードの上に表示
  } else {
    // 右端に近い場合は左側に表示
    if (x + 320 > window.innerWidth) {
      x = Math.max(10, coords.left - 320);
    }
    
    // 下端に近い場合は上に表示
    if (y + 150 > window.innerHeight) {
      y = coords.top - 150;
    }
  }
  
  linkMenuPosition.value = { x, y };
  
  // 次のティックでフォーカス
  nextTick(() => {
    linkInput.value?.focus();
  });
}

// リンクマークの範囲を特定する関数 - シンプル化
function findLinkRange(state: any, pos: number) {
  try {
    // リンクマークのタイプを取得
    const linkType = state.schema.marks.link;
    
    // リンクマークがなければnullを返す
    if (!linkType) return null;
    
    // まず前の位置を確認（カーソルがリンクテキストの末尾の場合）
    // これを最優先する
    let linkMark = null;
    if (pos > 0) {
      const prevNode = state.doc.nodeAt(pos - 1);
      if (prevNode && prevNode.marks && prevNode.marks.length) {
        linkMark = prevNode.marks.find((m: any) => m.type.name === 'link');
        if (linkMark) {
          pos = pos - 1;
          console.log('リンクの末尾カーソルを検出:', { pos });
        }
      }
    }
    
    // 前の位置にリンクマークがない場合は現在位置を確認
    if (!linkMark) {
      // ドキュメント内のカーソル位置にあるノードを直接取得
      const node = state.doc.nodeAt(pos);
      if (node && node.marks) {
        linkMark = node.marks.find((m: any) => m.type.name === 'link');
      }
      
      // 現在位置にリンクマークがなければ、次の位置を確認
      if (!linkMark && pos < state.doc.content.size - 1) {
        const nextNode = state.doc.nodeAt(pos + 1);
        if (nextNode && nextNode.marks) {
          linkMark = nextNode.marks.find((m: any) => m.type.name === 'link');
          if (linkMark) pos = pos + 1;
        }
      }
    }
    
    if (!linkMark) {
      console.warn('リンクマークが見つかりませんでした:', { pos });
      return null;
    }
    
    // リンクのhref属性を記録
    const href = linkMark.attrs.href;

    // ドキュメント内のすべてのテキストノードと位置をチェックして、リンク範囲を検出
    let startPos = pos;
    let endPos = pos;
    
    // 前方検索: カーソル位置から左側にリンクの始点を探す
    let i = pos;
    while (i >= 0) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        // テキストノードでない場合はスキップして前に進む
        i--;
        continue;
      }
      
      const marksAtPos = nodeAtPos.marks || [];
      const hasLinkMark = marksAtPos.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        startPos = i;
        i--;
      } else {
        break;
      }
    }
    
    // 後方検索: カーソル位置から右側にリンクの終点を探す
    i = pos;
    while (i < state.doc.content.size) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        // テキストノードでない場合はスキップして次に進む
        i++;
        continue;
      }
      
      const marksAtPos = nodeAtPos.marks || [];
      const hasLinkMark = marksAtPos.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        endPos = i + 1; // 位置は文字の後なので+1
        i++;
      } else {
        break;
      }
    }
    
    // 範囲が正しいか確認
    if (endPos <= startPos) {
      console.warn('無効なリンク範囲を検出:', {startPos, endPos});
      return null;
    }
    
    // リンクの範囲を返す
    const text = state.doc.textBetween(startPos, endPos);
    console.log('リンク範囲検出成功:', {
      from: startPos,
      to: endPos,
      text: text
    });
    
    return {
      from: startPos,
      to: endPos
    };
  } catch (error) {
    console.error('リンク範囲の検出中にエラーが発生しました:', error);
    return null;
  }
}

// リンク挿入
function insertLink() {
  if (!editor.value || !linkUrl.value.trim()) {
    showLinkMenu.value = false;
    return;
  }
  
  // URLの形式を確認し、必要なら修正
  let url = linkUrl.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  // リンクテキストが空の場合、URLをテキストとして使用
  const effectiveLinkText = linkText.value.trim() || url;
  
  // 既存のリンクを編集中かどうか確認
  const isEditingExistingLink = editor.value.isActive('link');
  
  if (isEditingExistingLink) {
    // 既存リンクを編集する場合
    const { state } = editor.value;
    const { from } = state.selection;
    
    // リンク範囲を取得
    const linkRange = findLinkRange(state, from);
    
    console.log('リンク編集:', { 
      linkRange: linkRange ? { 
        from: linkRange.from, 
        to: linkRange.to, 
        text: state.doc.textBetween(linkRange.from, linkRange.to)
      } : null 
    });
    
    if (linkRange) {
      try {
        // ステップ1: 正確なリンク範囲を選択してリンクマークを解除
        editor.value
          .chain()
          .focus()
          .setTextSelection({ from: linkRange.from, to: linkRange.to })
          .unsetMark('link')
          .run();
        
        // ステップ2: リンクテキストだけを置換
        editor.value
          .chain()
          .focus()
          .deleteRange({ from: linkRange.from, to: linkRange.to })
          .insertContent(effectiveLinkText)
          .run();
        
        // ステップ3: 新しく挿入したテキスト範囲を選択してリンクを設定
        editor.value
          .chain()
          .focus()
          .setTextSelection({ from: linkRange.from, to: linkRange.from + effectiveLinkText.length })
          .setLink({ href: url })
          .run();
        
        // ステップ4: カーソルをリンクの後ろに移動
        const newPos = linkRange.from + effectiveLinkText.length;
        setTimeout(() => {
          moveCaretAfterLink(newPos);
        }, 10);
      } catch (error) {
        console.error('リンク編集中にエラーが発生しました:', error);
        insertNormalLink(url);
      }
    } else {
      // リンク範囲が見つからない場合は通常挿入
      console.log('リンク範囲が見つからないため、通常挿入を実行します');
      insertNormalLink(url);
    }
  } else {
    // 新規リンク挿入の場合
    insertNormalLink(url, effectiveLinkText);
  }
  
  showLinkMenu.value = false;
  linkUrl.value = '';
  linkText.value = '';
}

// カーソルをリンクの後ろに移動し、リンクマークの影響を解除する
function moveCaretAfterLink(pos: number) {
  if (!editor.value) return;
  
  editor.value
    .chain()
    .focus()
    .setTextSelection(pos)
    // 空白スペースを挿入してリンクから確実に脱出
    .insertContent(' ')
    .deleteRange({ from: pos, to: pos + 1 })
    // 明示的にリンクマークの影響を無効化
    .unsetMark('link')
    .run();
}

// 通常のリンク挿入処理（新規作成時）
function insertNormalLink(url: string, effectiveLinkText?: string) {
  if (!editor.value) return;
  
  const { state } = editor.value;
  const { from, to } = state.selection;
  const selectedText = state.doc.textBetween(from, to);
  const linkDisplayText = effectiveLinkText || linkText.value.trim() || url;
  
  // リンクテキストが指定されていて、かつ選択範囲がある場合
  if (linkDisplayText && selectedText) {
    // 選択テキストをリンクテキストで置き換えてからリンクを適用
    editor.value
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(linkDisplayText)
      .setTextSelection({ from, to: from + linkDisplayText.length })
      .setLink({ href: url })
      .run();
      
    // リンク適用後、カーソルをリンクの後ろに移動
    const newPos = from + linkDisplayText.length;
    setTimeout(() => {
      moveCaretAfterLink(newPos);
    }, 10);
  } 
  // リンクテキストが指定されていないが選択範囲がある場合
  else if (selectedText) {
    // 選択範囲にリンクを適用
    editor.value.chain().focus().setLink({ href: url }).run();
    
    // リンク適用後、カーソルをリンクの後ろに移動
    setTimeout(() => {
      moveCaretAfterLink(to);
    }, 10);
  } 
  // 選択範囲がない場合はURLをテキストとして挿入してリンク化
  else {
    const displayText = linkDisplayText;
    const currentPos = editor.value.state.selection.from;
    
    editor.value.chain().focus().insertContent({
      type: 'text',
      text: displayText,
      marks: [
        {
          type: 'link',
          attrs: { href: url }
        }
      ]
    }).run();
    
    // リンク適用後、カーソルをリンクの後ろに移動
    const newPos = currentPos + displayText.length;
    setTimeout(() => {
      moveCaretAfterLink(newPos);
    }, 10);
  }
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

.floating-link-menu {
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}
</style> 