<template>
  <footer class="relative z-10 bg-background">
    <div class="border-t backdrop-blur-md shadow-background/30 bg-surface-variant/70 border-border-light/60">
      <div class="container mx-auto px-5 py-8 md:px-6 md:pb-8">
        <div class="grid grid-cols-1 gap-8 mb-6 md:grid-cols-3">
          <!-- ロゴと説明 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center pt-4 mb-4 space-x-2">
              <PhInfo class="w-6 h-6 text-primary" />
              <span class="text-lg font-bold text-primary">Juna</span>
            </div>
            <p class="text-sm leading-relaxed mb-4 text-text-muted">
              見えない障害を持つ人々のための、経験や情報を共有するブログプラットフォームです。互いに支え合い、理解を深めるコミュニティを目指しています。
            </p>
          </div>

          <!-- リンクをまとめたセクション -->
          <div class="pt-4">
            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <!-- ナビゲーション -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-heading">ナビゲーション</h3>
                <ul class="space-y-3">
                  <li><router-link to="/" class="btn-link">ホーム</router-link></li>
                  <li><router-link to="/posts" class="btn-link">記事一覧</router-link></li>
                </ul>
              </div>
              
              <!-- サポート -->
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wider mb-3 text-heading">サポート</h3>
                <ul class="space-y-3">
                  <li><router-link to="/faq" class="btn-link">よくある質問</router-link></li>
                  <li><router-link to="/contact" class="btn-link">お問い合わせ</router-link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center justify-between pt-5 pb-3 border-t md:flex-row border-border-light">
          <p class="text-sm mb-3 md:mb-0 text-text-muted">
            &copy; {{ currentYear }} Juna. All rights reserved.
          </p>
          <div class="flex space-x-6">
            <router-link to="/privacy" class="btn-link">プライバシーポリシー</router-link>
            <router-link to="/terms" class="btn-link">利用規約</router-link>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PhInfo } from '@phosphor-icons/vue';

const currentYear = computed(() => new Date().getFullYear());
</script> 