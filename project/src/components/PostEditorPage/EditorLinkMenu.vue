<template>
  <div 
    v-if="visible" 
    ref="linkMenu"
    class="floating-link-menu glass-card rounded p-3 shadow-lg z-30 fixed"
    :style="menuStyle"
  >
    <div class="flex flex-col gap-2">
      <!-- リンクURL入力フィールド -->
      <div class="flex items-center">
        <input 
          ref="linkInput"
          v-model="url"
          type="text"
          placeholder="URLを入力"
          class="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="cancel"
        />
      </div>
      
      <!-- リンクテキスト入力フィールド -->
      <div class="flex items-center">
        <input 
          ref="linkTextInput"
          v-model="text"
          type="text"
          placeholder="リンクテキストを入力（省略可）"
          class="flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-text"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="cancel"
        />
      </div>
    </div>
    <div class="flex justify-end space-x-2 mt-3">
      <button 
        @click="cancel"
        class="btn btn-secondary btn-sm"
      >
        キャンセル
      </button>
      <button 
        @click="removeLink"
        class="btn btn-error btn-sm"
        :disabled="!isLinkActive"
      >
        リンク解除
      </button>
      <button 
        @click="applyLink"
        class="btn btn-primary btn-sm"
        :disabled="!url"
      >
        適用
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import type { Editor } from '@tiptap/vue-3';

// Props
const props = defineProps({
  editor: {
    type: Object as () => Editor | null | undefined,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object as () => { x: number, y: number },
    default: () => ({ x: 0, y: 0 })
  },
  isKeyboardVisible: {
    type: Boolean,
    default: false
  },
  selectedText: {
    type: String,
    default: ''
  },
  initialUrl: {
    type: String,
    default: ''
  },
  initialText: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['close', 'apply', 'remove', 'open']);

// ローカル状態
const linkMenu = ref<HTMLElement | null>(null);
const linkInput = ref<HTMLInputElement | null>(null);
const linkTextInput = ref<HTMLInputElement | null>(null);
const url = ref('');
const text = ref('');

// URL検出の正規表現
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

// リンクが現在アクティブかどうか
const isLinkActive = computed(() => props.editor?.isActive('link') ?? false);

// リンクメニューのスタイルを計算
const menuStyle = computed(() => {
  const { x, y } = props.position;
  
  // モバイル向け（キーボード表示時）
  if (props.isKeyboardVisible) {
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

// エディターからリンク範囲を検出する関数
function findLinkRange(state: any, pos: number) {
  try {
    // リンクマークのタイプを取得
    const linkType = state.schema.marks.link;
    if (!linkType) return null;
    
    // カーソル位置のノードを取得
    const node = state.doc.nodeAt(pos);
    const prevNode = pos > 0 ? state.doc.nodeAt(pos - 1) : null;
    
    // リンクマークを見つける
    let linkMark = null;
    if (node && node.marks) {
      linkMark = node.marks.find((m: any) => m.type.name === 'link');
    }
    if (!linkMark && prevNode && prevNode.marks) {
      linkMark = prevNode.marks.find((m: any) => m.type.name === 'link');
      if (linkMark) pos = pos - 1;
    }
    
    if (!linkMark) return null;
    
    // リンクのhref属性を記録
    const href = linkMark.attrs.href;
    
    // 前方と後方に検索してリンク範囲を特定
    let start = pos;
    let end = pos;
    
    // 前方検索
    let i = pos;
    while (i >= 0) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        i--;
        continue;
      }
      
      const hasLinkMark = nodeAtPos.marks.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        start = i;
        i--;
      } else {
        break;
      }
    }
    
    // 後方検索
    i = pos;
    while (i < state.doc.content.size) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        i++;
        continue;
      }
      
      const hasLinkMark = nodeAtPos.marks.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        end = i + 1;
        i++;
      } else {
        break;
      }
    }
    
    return {
      from: start,
      to: end
    };
  } catch (error) {
    console.error('リンク範囲検出エラー:', error);
    return null;
  }
}

// カーソルをリンクの後ろに移動し、リンクマークの影響を解除する
function moveCaretAfterLink(pos: number) {
  if (!props.editor) return;
  
  props.editor
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

// 初期値設定
onMounted(() => {
  // 表示と同時に値をセット
  url.value = props.initialUrl;
  text.value = props.initialText || props.selectedText;
  
  // 入力フィールドにフォーカス
  nextTick(() => {
    linkInput.value?.focus();
  });
});

// 可視性変更時に値を更新
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // メニューが表示されたときにpropsの値を反映
    url.value = props.initialUrl;
    text.value = props.initialText || props.selectedText;
    
    // 表示後にフォーカス
    nextTick(() => {
      linkInput.value?.focus();
    });
  }
});

// リンクメニューを表示する関数
function showLinkMenu() {
  if (!props.editor) return;
  
  // カーソル位置を取得
  const { state, view } = props.editor;
  const { from, to } = state.selection;
  
  // 選択テキスト
  const selectedText = state.doc.textBetween(from, to);
  
  // リンクURLとテキストの初期値
  let linkUrl = '';
  let linkText = '';
  
  if (selectedText.match(urlRegex)) {
    // 選択テキストがURLの場合
    linkUrl = selectedText;
  } else if (props.editor.isActive('link')) {
    // 既存のリンクがある場合はそのURLを取得
    const attrs = props.editor.getAttributes('link');
    linkUrl = attrs.href || '';
    
    // 選択範囲が空の場合、リンクテキストを取得
    if (from === to) {
      try {
        const linkRange = findLinkRange(state, from);
        if (linkRange) {
          linkText = state.doc.textBetween(linkRange.from, linkRange.to);
        } else {
          // リンク範囲が見つからない場合は選択テキストを使用
          linkText = selectedText;
        }
      } catch (error) {
        console.error('リンクテキスト取得エラー:', error);
        linkText = selectedText;
      }
    } else {
      // 選択範囲がある場合はその範囲のテキストを使用
      linkText = selectedText;
    }
  } else {
    // 新規リンク作成の場合
    linkText = selectedText;
  }
  
  // メニュー位置をカーソル位置に設定
  const coords = view.coordsAtPos(from);
  
  // 画面の端に近い場合の調整
  let x = coords.right;
  let y = coords.bottom + 10;
  
  // キーボードが表示されている場合は中央に表示
  if (props.isKeyboardVisible) {
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
  
  // 親コンポーネントにメニュー表示イベントを発行
  emit('open', {
    position: { x, y },
    initialUrl: linkUrl,
    initialText: linkText,
    selectedText: selectedText
  });
}

// リンク適用
function applyLink() {
  if (!props.editor || !url.value.trim()) {
    cancel();
    return;
  }
  
  // URLの形式を確認し、必要なら修正
  let finalUrl = url.value.trim();
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }
  
  // リンクテキストが空の場合、URLをテキストとして使用
  const finalText = text.value.trim() || finalUrl;
  
  // 親コンポーネントにデータを渡す
  emit('apply', {
    url: finalUrl,
    text: finalText
  });
  
  // 状態をリセットしてメニューを閉じる
  cancel();
}

// 単純なリンク挿入処理（新規作成/フォールバック用）
function insertSimpleLink(url: string, text: string) {
  if (!props.editor) return;
  
  const { state } = props.editor;
  const { from, to } = state.selection;
  const hasSelection = from !== to;
  
  if (hasSelection) {
    // 選択範囲がある場合: テキスト置換してリンク化
    props.editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(text)
      .setTextSelection({ from, to: from + text.length })
      .setLink({ href: url })
      .run();
      
    // カーソルをリンクの後ろに移動
    const newPos = from + text.length;
    setTimeout(() => {
      moveCaretAfterLink(newPos);
    }, 10);
  } else {
    // 選択範囲がない場合: テキスト挿入してリンク化
    const currentPos = props.editor.state.selection.from;
    
    props.editor.chain().focus().insertContent({
      type: 'text',
      text: text,
      marks: [
        {
          type: 'link',
          attrs: { href: url }
        }
      ]
    }).run();
    
    // カーソルをリンクの後ろに移動
    const newPos = currentPos + text.length;
    setTimeout(() => {
      moveCaretAfterLink(newPos);
    }, 10);
  }
}

// リンクの適用処理
function handleApplyLink(data: { url: string, text: string }) {
  if (!props.editor) return;
  
  const { url, text } = data;
  const { state } = props.editor;
  const { from } = state.selection;
  
  // 既存のリンクを編集する場合
  if (props.editor.isActive('link')) {
    const linkRange = findLinkRange(state, from);
    
    if (linkRange) {
      try {
        // ステップ1: リンク範囲を選択してリンクマークを解除
        props.editor
          .chain()
          .focus()
          .setTextSelection({ from: linkRange.from, to: linkRange.to })
          .unsetMark('link')
          .run();
        
        // ステップ2: リンクテキストを置換
        props.editor
          .chain()
          .focus()
          .deleteRange({ from: linkRange.from, to: linkRange.to })
          .insertContent(text)
          .run();
        
        // ステップ3: 新テキスト範囲を選択してリンクを設定
        props.editor
          .chain()
          .focus()
          .setTextSelection({ from: linkRange.from, to: linkRange.from + text.length })
          .setLink({ href: url })
          .run();
        
        // ステップ4: カーソルをリンクの後ろに移動
        const newPos = linkRange.from + text.length;
        setTimeout(() => {
          moveCaretAfterLink(newPos);
        }, 10);
      } catch (error) {
        console.error('リンク編集エラー:', error);
        // エラー時は単純なリンク挿入
        insertSimpleLink(url, text);
      }
    } else {
      // リンク範囲が見つからない場合は通常挿入
      insertSimpleLink(url, text);
    }
  } else {
    // 新規リンク挿入の場合
    insertSimpleLink(url, text);
  }
}

// リンク削除
function removeLink() {
  if (!props.editor) return;
  
  // リンク削除イベント発行
  emit('remove');
  
  // 状態をリセットしてメニューを閉じる
  cancel();
}

// キャンセル
function cancel() {
  // 状態をリセット
  url.value = '';
  text.value = '';
  
  // メニューを閉じる
  emit('close');
}

// 外部に公開するメソッド
defineExpose({
  showLinkMenu,
  handleApplyLink,
  insertSimpleLink,
  findLinkRange,
  moveCaretAfterLink
});
</script>

<style scoped lang="postcss">
.floating-link-menu {
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  /* モバイル向け最適化 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

/* モバイルでのタッチ操作最適化 */
input, button {
  touch-action: manipulation;
}

/* 視認性向上のためのスタイル追加 */
.btn {
  transition: all 0.15s ease-in-out;
}

/* フォーカス時のアウトライン強化 */
input:focus {
  outline: 2px solid var(--color-primary-light, #4f46e5);
  outline-offset: 1px;
}
</style> 