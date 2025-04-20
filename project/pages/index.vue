<!-- pages/index.vue -->
<!-- ホームページ（ルートパス '/'）に対応するページコンポーネント -->
<template>
  <!-- ページのルート要素。テスト用に data-testid を設定 -->
  <div data-testid="index-page-container">
    <!-- 現在の仕様ではホームページに表示する特定のコンテンツはない -->
    <!-- 必要に応じて、ブログ投稿一覧、サイト紹介などをここに追加 -->
    <p class="text-center text-lg text-gray-500 mt-10">ようこそ！</p>
  </div>
</template>

<script setup lang="ts">
// useHead Composable を使用してページのタイトルを設定
useHead({
  title: 'ホーム', // ブラウザのタブなどに表示されるタイトル
});

// このページ固有のロジックは現在なし
// 例: APIからデータを取得して表示するなど
</script>

<style scoped>
/* このページ固有のスタイルは現在なし */
/* 必要に応じて Tailwind 以外のスタイルをここに追加 */
</style> 