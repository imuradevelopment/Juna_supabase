<template>
  <div class="flex flex-wrap gap-1">
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

    <!-- 箇条書きボタン -->
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

// プロパティの定義
const props = defineProps({
  editor: {
    type: Object as () => any,
    required: true
  },
  uploading: {
    type: Boolean,
    default: false
  }
});

// イベント定義
const emit = defineEmits([
  'open-link-dialog',
  'open-file-dialog',
  'update-toolbar'
]);

// 見出し切り替え
function toggleHeading(level: 2 | 3) {
  if (props.editor) {
    props.editor.chain().focus().toggleHeading({ level }).run();
  }
}

// 太字切り替え
function toggleBold() {
  if (props.editor) {
    props.editor.chain().focus().toggleBold().run();
  }
}

// 斜体切り替え
function toggleItalic() {
  if (props.editor) {
    props.editor.chain().focus().toggleItalic().run();
  }
}

// 取り消し線切り替え
function toggleStrike() {
  if (props.editor) {
    props.editor.chain().focus().toggleStrike().run();
  }
}

// 箇条書きリスト切り替え
function toggleBulletList() {
  if (props.editor) {
    props.editor.chain().focus().toggleBulletList().run();
  }
}

// 番号付きリスト切り替え
function toggleOrderedList() {
  if (props.editor) {
    props.editor.chain().focus().toggleOrderedList().run();
  }
}

// 引用ブロック切り替え
function toggleBlockquote() {
  if (props.editor) {
    props.editor.chain().focus().toggleBlockquote().run();
  }
}

// 水平線挿入
function setHorizontalRule() {
  if (props.editor) {
    props.editor.chain().focus().setHorizontalRule().run();
  }
}

// 元に戻す
function undoEdit() {
  if (props.editor) {
    props.editor.chain().focus().undo().run();
  }
}

// やり直し
function redoEdit() {
  if (props.editor) {
    props.editor.chain().focus().redo().run();
  }
}
</script>

<style scoped lang="postcss">
/* タップ領域を広げる */
button {
  min-width: 40px;
  min-height: 40px;
  touch-action: manipulation;
  position: relative;
  z-index: 10; /* ボタンを前面に */
  
  /* アクティブ状態を視覚的に表示 */
  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

/* iOSでのハプティックフィードバック防止 */
button {
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

.editor-toolbar {
  transition: all 0.2s ease-out;
}
</style> 