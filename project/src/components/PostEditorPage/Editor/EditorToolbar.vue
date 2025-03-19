<!-- エディターツールバーコンポーネント -->
<template>
  <!-- タッチやマウスイベント時のフォーカス喪失を防止 -->
  <div 
    class="flex flex-wrap gap-1"
    @pointerdown.stop.prevent="preventBlur"
    @touchstart.stop.prevent="preventBlur"
    @mousedown.stop.prevent="preventBlur"
  >
    <!-- 見出し2ボタン -->
    <button
      type="button"
      class="btn-icon-info"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('heading', { level: 2 }) }"
      @click.prevent="toggleHeading(2)"
      @touchend.prevent="toggleHeading(2)"
      title="見出し2"
    >
      <PhTextHTwo class="h-5 w-5" />
    </button>
    
    <!-- 見出し3ボタン -->
    <button
      class="btn-icon-info"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('heading', { level: 3 }) }"
      @click.prevent="toggleHeading(3)"
      @touchend.prevent="toggleHeading(3)"
      title="見出し3"
    >
      <PhTextHThree class="h-5 w-5" />
    </button>

    <!-- 太字ボタン -->
    <button
      class="btn-icon-accent1"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('bold') }"
      @click.prevent="toggleBold"
      @touchend.prevent="toggleBold"
      title="太字"
    >
      <PhTextBolder class="h-5 w-5" />
    </button>

    <!-- 斜体ボタン -->
    <button
      class="btn-icon-accent1"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('italic') }"
      @click.prevent="toggleItalic"
      @touchend.prevent="toggleItalic"
      title="斜体"
    >
      <PhTextItalic class="h-5 w-5" />
    </button>

    <!-- 取り消し線ボタン -->
    <button
      class="btn-icon-accent1"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('strike') }"
      @click.prevent="toggleStrike"
      @touchend.prevent="toggleStrike"
      title="取り消し線"
    >
      <PhTextStrikethrough class="h-5 w-5" />
    </button>

    <!-- 箇条書きリストボタン -->
    <button
      class="btn-icon-accent2"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('bulletList') }"
      @click.prevent="toggleBulletList"
      @touchend.prevent="toggleBulletList"
      title="箇条書き"
    >
      <PhListBullets class="h-5 w-5" />
    </button>

    <!-- 番号付きリストボタン -->
    <button
      class="btn-icon-accent2"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('orderedList') }"
      @click.prevent="toggleOrderedList"
      @touchend.prevent="toggleOrderedList"
      title="番号付きリスト"
    >
      <PhListNumbers class="h-5 w-5" />
    </button>

    <!-- 引用ボタン -->
    <button
      class="btn-icon-accent3"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('blockquote') }"
      @click.prevent="toggleBlockquote"
      @touchend.prevent="toggleBlockquote"
      title="引用"
    >
      <PhQuotes class="h-5 w-5" />
    </button>

    <!-- 水平線ボタン -->
    <button
      class="btn-icon-accent3"
      @click.prevent="setHorizontalRule"
      @touchend.prevent="setHorizontalRule"
      title="水平線"
    >
      <PhMinus class="h-5 w-5" />
    </button>

    <!-- リンクボタン -->
    <button
      class="btn-icon-primary"
      :class="{ 'bg-primary/20 text-primary': editor?.isActive('link') }"
      @click.prevent="$emit('open-link-dialog')"
      @touchend.prevent="$emit('open-link-dialog')"
      title="リンク"
    >
      <PhLink class="h-5 w-5" />
    </button>

    <!-- 画像アップロードボタン -->
    <button
      class="btn-icon-success"
      @click.prevent="$emit('open-file-dialog')"
      @touchend.prevent="$emit('open-file-dialog')"
      title="画像"
      :disabled="uploading"
    >
      <PhSpinner v-if="uploading" class="h-5 w-5 animate-spin" />
      <PhImage v-else class="h-5 w-5" />
    </button>

    <!-- 元に戻すボタン -->
    <button
      class="btn-icon-secondary"
      @click.prevent="undoEdit"
      @touchend.prevent="undoEdit"
      title="元に戻す"
    >
      <PhArrowCounterClockwise class="h-5 w-5" />
    </button>

    <!-- やり直しボタン -->
    <button
      class="btn-icon-secondary"
      @click.prevent="redoEdit"
      @touchend.prevent="redoEdit"
      title="やり直し"
    >
      <PhArrowClockwise class="h-5 w-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { 
  PhTextHTwo,
  PhTextHThree,
  PhTextBolder,
  PhTextItalic,
  PhTextStrikethrough,
  PhListBullets,
  PhListNumbers,
  PhQuotes,
  PhMinus,
  PhLink,
  PhImage,
  PhArrowCounterClockwise,
  PhArrowClockwise,
  PhSpinner
} from '@phosphor-icons/vue';

// コンポーネントのプロパティ定義
const props = defineProps({
  editor: {
    type: Object as () => import('@tiptap/vue-3').Editor | null | undefined,
    default: undefined
  },
  uploading: {
    type: Boolean,
    default: false
  },
  isFloating: {
    type: Boolean,
    default: false
  },
  isFocused: {
    type: Boolean,
    default: false
  },
  toolbarElement: {
    type: Object as () => HTMLElement | null,
    default: null
  }
});

// イベント定義
const emit = defineEmits([
  'open-link-dialog',
  'open-file-dialog',
  'update-toolbar',
  'keyboard-visibility-changed'
]);

// キーボード表示関連の状態
const isKeyboardVisible = ref(false);
const keyboardHeight = ref(0);
const viewportOffsetTop = ref(0);

let updatingToolbar = false;

/**
 * ツールバーの位置を更新する
 * 仮想ビューポートを活用してモバイルキーボード表示時の位置を調整
 */
function updateToolbarPosition() {
  if (typeof window.visualViewport === 'undefined' || !window.visualViewport) return;
  
  keyboardHeight.value = window.innerHeight - (window.visualViewport.height || window.innerHeight);
  
  viewportOffsetTop.value = window.visualViewport.offsetTop || 0;
  
  const wasKeyboardVisible = isKeyboardVisible.value;
  isKeyboardVisible.value = keyboardHeight.value > 100;
  
  if (wasKeyboardVisible !== isKeyboardVisible.value) {
    emit('keyboard-visibility-changed', isKeyboardVisible.value);
  }
  
  updateFloatingToolbarPosition();
}

/**
 * フローティングツールバーの位置更新
 * モバイルキーボード表示時にツールバーをキーボード上部に配置
 */
function updateFloatingToolbarPosition() {
  if (props.isFloating && props.toolbarElement && isKeyboardVisible.value) {
    const toolbar = props.toolbarElement;
    
    toolbar.style.bottom = `${keyboardHeight.value}px`;
    toolbar.style.transform = `translateY(${viewportOffsetTop.value}px)`;
    
    toolbar.classList.add('floating-toolbar');
  }
}

/**
 * キーボード表示監視機能のセットアップ
 * visualViewportのリサイズや移動を監視してツールバー位置を調整
 */
function setupKeyboardWatchers() {
  if (typeof window.visualViewport !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateToolbarPosition);
    window.visualViewport.addEventListener('scroll', updateToolbarPosition);
    
    window.addEventListener('scroll', updateToolbarPosition);
    
    window.addEventListener('orientationchange', () => {
      setTimeout(updateToolbarPosition, 100);
    });
    
    let rafId: number;
    let lastKeyboardHeight = 0;
    
    // キーボード高さを定期的にチェックする関数
    function checkKeyboardHeight() {
      if (typeof window.visualViewport !== 'undefined' && window.visualViewport) {
        const currentKeyboardHeight = window.innerHeight - (window.visualViewport.height || window.innerHeight);
        if (Math.abs(currentKeyboardHeight - lastKeyboardHeight) > 20) {
          lastKeyboardHeight = currentKeyboardHeight;
          updateToolbarPosition();
        }
      }
      
      rafId = requestAnimationFrame(() => {
        setTimeout(checkKeyboardHeight, 100);
      });
    }
    
    checkKeyboardHeight();
    
    // クリーンアップ関数を返す
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateToolbarPosition);
        window.visualViewport.removeEventListener('scroll', updateToolbarPosition);
      }
      window.removeEventListener('scroll', updateToolbarPosition);
      window.removeEventListener('orientationchange', updateToolbarPosition);
      cancelAnimationFrame(rafId);
    };
  }
  return () => {};
}

/**
 * ツールバーの更新を強制する
 * エディタの状態変更後に呼び出されることを想定
 */
function forceToolbarUpdate() {
  if (updatingToolbar) return;
  
  updatingToolbar = true;
  
  try {
    if (props.editor) {
      setTimeout(() => {
        try {
          props.editor?.commands.focus();
        } catch (e) {
          console.error('エディタフォーカス時エラー:', e);
        }
      }, 10);
    }
    
    updateToolbarPosition();
  } finally {
    setTimeout(() => {
      updatingToolbar = false;
    }, 100);
  }
}

/**
 * エディタコマンド実行のヘルパー関数
 * エラーハンドリングを含む
 */
function executeCommand(callback: (chain: any) => any) {
  if (!props.editor) return;
  try {
    callback(props.editor.chain().focus());
  } catch (e) {
    console.error('エディタコマンド実行エラー:', e);
  }
}

// コンポーネントマウント時の初期化
onMounted(() => {
  try {
    const cleanupKeyboardWatchers = setupKeyboardWatchers();
    
    onBeforeUnmount(cleanupKeyboardWatchers);
    
    updateToolbarPosition();
  } catch (error) {
    console.error('ツールバーの初期化に失敗しました:', error);
  }
});

// ツールバー要素の変更を監視
watch(() => props.toolbarElement, (newElement) => {
  if (newElement && props.isFloating) {
    updateFloatingToolbarPosition();
  }
});

// フォーカス状態の変更を監視
watch(() => props.isFocused, (newValue) => {
  if (newValue) {
    updateToolbarPosition();
    setTimeout(updateToolbarPosition, 300);
  } else {
    setTimeout(() => {
      if (!props.isFocused) {
        isKeyboardVisible.value = false;
        emit('keyboard-visibility-changed', false);
      }
    }, 250);
  }
});

// フローティング状態の変更を監視
watch(() => props.isFloating, (isFloating) => {
  if (isFloating && props.toolbarElement) {
    updateFloatingToolbarPosition();
  }
});

// エディタ内容の変更を監視
watch(() => props.editor?.getHTML(), () => {
  if (isKeyboardVisible.value) {
    updateToolbarPosition();
  }
});

// 外部から呼び出し可能な関数を公開
defineExpose({
  updateToolbarPosition,
  updateFloatingToolbarPosition,
  forceToolbarUpdate,
  isKeyboardVisible,
  preventBlur
});

/**
 * 見出しの切り替え
 */
function toggleHeading(level: 2 | 3) {
  executeCommand(chain => chain.toggleHeading({ level }).run());
}

/**
 * 太字の切り替え
 */
function toggleBold() {
  executeCommand(chain => chain.toggleBold().run());
}

/**
 * 斜体の切り替え
 */
function toggleItalic() {
  executeCommand(chain => chain.toggleItalic().run());
}

/**
 * 取り消し線の切り替え
 */
function toggleStrike() {
  executeCommand(chain => chain.toggleStrike().run());
}

/**
 * 箇条書きリストの切り替え
 */
function toggleBulletList() {
  executeCommand(chain => chain.toggleBulletList().run());
}

/**
 * 番号付きリストの切り替え
 */
function toggleOrderedList() {
  executeCommand(chain => chain.toggleOrderedList().run());
}

/**
 * 引用の切り替え
 */
function toggleBlockquote() {
  executeCommand(chain => chain.toggleBlockquote().run());
}

/**
 * 水平線の挿入
 */
function setHorizontalRule() {
  executeCommand(chain => chain.setHorizontalRule().run());
}

/**
 * 編集を元に戻す
 */
function undoEdit() {
  executeCommand(chain => chain.undo().run());
}

/**
 * 編集をやり直す
 */
function redoEdit() {
  executeCommand(chain => chain.redo().run());
}

/**
 * タッチやクリック時のエディタフォーカス喪失を防止
 * モバイル環境でのUX向上に重要
 */
function preventBlur(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  
  if (props.editor) {
    setTimeout(() => {
      try {
        if (props.editor) {
          props.editor.commands.focus();
          
          if (isKeyboardVisible.value) {
            updateToolbarPosition();
          }
        }
      } catch (err) {
        console.error('フォーカス処理エラー:', err);
      }
    }, 10);
  }
}
</script>

<style scoped lang="postcss">
button {
  min-width: 40px;
  min-height: 40px;
  touch-action: manipulation;
  position: relative;
  z-index: 10;
  
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

button {
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

/* フローティングツールバーのスタイル */
.floating-toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 8px;
  border-radius: 0;
  user-select: none;
  touch-action: manipulation;
  will-change: transform;
  backface-visibility: hidden;
  width: 100%;
}
</style>