<template>
  <div class="py-16 text-center">
    <PhWarning class="mx-auto mb-4 h-24 w-24 text-warning" />
    <h1 class="mb-4 text-8xl text-primary">404</h1>
    <p class="mb-8 text-2xl text-text-muted">ページが見つかりませんでした</p>
    <router-link 
      to="/" 
      class="btn btn-primary btn-lg px-8 mx-auto inline-flex items-center"
    >
      <PhHouse class="mr-2 h-5 w-5" />
      ホームに戻る
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { PhWarning, PhHouse } from '@phosphor-icons/vue';
</script>