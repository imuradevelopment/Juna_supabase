<template>
  <footer>
    <div class="glass border-t border-gray-200 dark:border-gray-700">
      <div class="container mx-auto py-8 px-5 md:px-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <!-- ロゴと説明 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center space-x-2 mb-4 pt-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6 text-primary">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <span class="text-lg font-bold text-primary">Juna</span>
            </div>
            <p class="text-sm text-gray-400 mb-4 leading-relaxed">
              見えない障害を持つ人々のための、経験や情報を共有するブログプラットフォームです。互いに支え合い、理解を深めるコミュニティを目指しています。
            </p>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- リンク1 -->
          <div class="pt-2">
            <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-300">ナビゲーション</h3>
            <ul class="space-y-3">
              <li><router-link to="/" class="text-gray-400 hover:text-primary-light transition-colors">ホーム</router-link></li>
              <li><router-link to="/categories" class="text-gray-400 hover:text-primary-light transition-colors">カテゴリ</router-link></li>
              <li><router-link to="/search" class="text-gray-400 hover:text-primary-light transition-colors">検索</router-link></li>
              <li><router-link to="/about" class="text-gray-400 hover:text-primary-light transition-colors">サイトについて</router-link></li>
            </ul>
          </div>

          <!-- リンク2 -->
          <div class="pt-2">
            <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-300">サポート</h3>
            <ul class="space-y-3">
              <li><router-link to="/faq" class="text-gray-400 hover:text-primary-light transition-colors">よくある質問</router-link></li>
              <li><router-link to="/contact" class="text-gray-400 hover:text-primary-light transition-colors">お問い合わせ</router-link></li>
              <li><router-link to="/privacy" class="text-gray-400 hover:text-primary-light transition-colors">プライバシーポリシー</router-link></li>
              <li><router-link to="/terms" class="text-gray-400 hover:text-primary-light transition-colors">利用規約</router-link></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-4 pb-3 flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm text-gray-400 mb-3 md:mb-0">
            &copy; {{ currentYear }} Juna. All rights reserved.
          </p>
          <div class="flex space-x-6">
            <a href="#" class="text-sm text-gray-400 hover:text-primary-light transition-colors">プライバシーポリシー</a>
            <a href="#" class="text-sm text-gray-400 hover:text-primary-light transition-colors">利用規約</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
footer {
  background-color: var(--color-background);
  position: relative;
  z-index: 10;
}

.footer-link {
  color: rgba(156, 163, 175, 1); /* text-gray-400 */
  transition-property: color;
  transition-duration: 300ms;
}

.footer-link:hover {
  color: var(--color-primary-light); /* hover:text-primary-light */
}

@media (max-width: 768px) {
  footer .container {
    padding-bottom: 2rem;
  }
}
</style> 