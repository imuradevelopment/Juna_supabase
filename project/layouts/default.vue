<template>
  <div class="flex flex-col min-h-screen bg-primary-100 text-gray-700" data-testid="default-layout">
    <header class="bg-primary-300 text-gray-900 shadow-md p-4" data-testid="header-placeholder">
      <!-- ヘッダーコンテンツ（例：ロゴ、ナビゲーション） -->
      <p>Blog</p>
    </header>

    <main class="flex-grow container mx-auto p-4" data-testid="main-content">
      <slot />
    </main>

    <footer class="bg-primary-300 text-gray-900 p-4 text-center" data-testid="footer-placeholder">
      <!-- フッターコンテンツ -->
      <p>&copy; 2025 Blog</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
</style> 