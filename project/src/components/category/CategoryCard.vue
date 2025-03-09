<template>
  <router-link 
    :to="`/categories/${category.id}`" 
    class="category-card glass-card p-6 text-center transition-all hover:shadow-lg hover:scale-105 duration-300 rounded-xl group relative overflow-hidden"
  >
    <!-- 装飾的な背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    
    <!-- アイコンをより大きく魅力的に -->
    <div class="relative z-10">
      <CategoryIcon :name="category.name" class="mx-auto mb-4 transform group-hover:scale-110 transition-transform" />
      <h3 class="font-medium text-lg text-white group-hover:text-primary-light transition-colors">{{ category.name }}</h3>
    </div>
    
    <!-- ホバー時のアクセント -->
    <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
  </router-link>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import CategoryIcon from './CategoryIcon.vue';

defineProps({
  category: {
    type: Object,
    required: true
  }
});
</script> 