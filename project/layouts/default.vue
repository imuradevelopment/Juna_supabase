<template>
  <div class="flex flex-col min-h-screen bg-primary-100 text-gray-700" data-testid="default-layout">
    <header class="bg-primary-300 text-secondary-500 shadow-md p-4 flex justify-between items-center" data-testid="header-placeholder">
      <!-- ヘッダーコンテンツ（例：ロゴ、ナビゲーション） -->
      <NuxtLink to="/" class="text-xl font-bold hover:text-secondary-700" data-testid="header-home-link">
        Blog
      </NuxtLink>
      <nav data-testid="header-nav">
        <ul class="flex space-x-4 items-center">
          <li>
            <NuxtLink
              to="/register"
              class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium"
              data-testid="header-register-link"
            >
              新規登録
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/login"
              class="text-gray-700 hover:text-secondary-500 px-3 py-2 rounded-md text-sm font-medium"
              data-testid="header-login-link"
            >
              ログイン
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-grow container mx-auto p-6" data-testid="main-content">
      <slot />
    </main>

    <footer class="bg-primary-300 text-gray-500 p-4 text-center mt-auto" data-testid="footer-placeholder">
      <!-- フッターコンテンツ -->
      <p>&copy; {{ new Date().getFullYear() }} Blog. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* スコープ付きスタイルは Tailwind でカバーされるため基本不要 */
</style> 