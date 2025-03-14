<template>
  <footer class="relative z-10 bg-[rgb(var(--color-background))]">
    <div class="border-t backdrop-blur-md shadow-[0_4px_6px_rgb(var(--color-background)/0.3)] bg-[rgb(var(--color-surface-variant)/0.7)] border-[rgb(var(--color-border-light)/0.6)]">
      <div class="container mx-auto px-5 py-8 md:px-6 md:pb-8">
        <div class="grid grid-cols-1 gap-8 mb-6 md:grid-cols-3">
          <!-- ロゴと説明 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center pt-4 mb-4 space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 text-[rgb(var(--color-primary))]">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <span class="text-lg font-bold text-[rgb(var(--color-primary))]">Juna</span>
            </div>
            <p class="text-sm leading-relaxed mb-4 text-[rgb(var(--color-text-muted))]">
              見えない障害を持つ人々のための、経験や情報を共有するブログプラットフォームです。互いに支え合い、理解を深めるコミュニティを目指しています。
            </p>
          </div>

          <!-- リンクをまとめたセクション -->
          <div class="pt-4">
            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <!-- ナビゲーション -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-[rgb(var(--color-heading))]">ナビゲーション</h3>
                <ul class="space-y-3">
                  <li><router-link to="/" class="transition-colors duration-300 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">ホーム</router-link></li>
                  <li><router-link to="/posts" class="transition-colors duration-300 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">記事一覧</router-link></li>
                </ul>
              </div>
              
              <!-- サポート -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-[rgb(var(--color-heading))]">サポート</h3>
                <ul class="space-y-3">
                  <li><router-link to="/faq" class="transition-colors duration-300 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">よくある質問</router-link></li>
                  <li><router-link to="/contact" class="transition-colors duration-300 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">お問い合わせ</router-link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-between pt-5 pb-3 border-t md:flex-row border-[rgb(var(--color-border-light))]">
          <p class="text-sm mb-3 md:mb-0 text-[rgb(var(--color-text-muted))]">
            &copy; {{ currentYear }} Juna. All rights reserved.
          </p>
          <div class="flex space-x-6">
            <router-link to="/privacy" class="text-sm transition-colors text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">プライバシーポリシー</router-link>
            <router-link to="/terms" class="text-sm transition-colors text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-light))]">利用規約</router-link>
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