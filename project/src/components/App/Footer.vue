<template>
  <footer class="bg-[rgb(var(--color-background))] relative z-10">
    <div class="bg-[rgb(var(--color-surface-variant)/0.7)] backdrop-blur-md border-t border-[rgb(var(--color-border-light)/0.6)] shadow-[0_4px_6px_rgb(var(--color-background)/0.3)]">
      <div class="container mx-auto py-8 px-5 md:px-6 md:pb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <!-- ロゴと説明 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center space-x-2 mb-4 pt-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-6 w-6 text-[rgb(var(--color-primary))]">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <span class="text-lg font-bold text-[rgb(var(--color-primary))]">Juna</span>
            </div>
            <p class="text-sm text-[rgb(var(--color-text-muted))] mb-4 leading-relaxed">
              見えない障害を持つ人々のための、経験や情報を共有するブログプラットフォームです。互いに支え合い、理解を深めるコミュニティを目指しています。
            </p>
          </div>

          <!-- リンクをまとめたセクション -->
          <div class="pt-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <!-- ナビゲーション -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-[rgb(var(--color-heading))]">ナビゲーション</h3>
                <ul class="space-y-3">
                  <li><router-link to="/" class="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors duration-300">ホーム</router-link></li>
                  <li><router-link to="/posts" class="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors duration-300">記事一覧</router-link></li>
                </ul>
              </div>
              
              <!-- サポート -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-[rgb(var(--color-heading))]">サポート</h3>
                <ul class="space-y-3">
                  <li><router-link to="/faq" class="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors duration-300">よくある質問</router-link></li>
                  <li><router-link to="/contact" class="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors duration-300">お問い合わせ</router-link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-[rgb(var(--color-border-light))] pt-5 pb-3 flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm text-[rgb(var(--color-text-muted))] mb-3 md:mb-0">
            &copy; {{ currentYear }} Juna. All rights reserved.
          </p>
          <div class="flex space-x-6">
            <router-link to="/privacy" class="text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors">プライバシーポリシー</router-link>
            <router-link to="/terms" class="text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))] transition-colors">利用規約</router-link>
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