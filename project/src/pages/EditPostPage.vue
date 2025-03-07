<template>
  <div class="max-w-3xl mx-auto py-8">
    <PostForm :post-id="postId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import PostForm from '../components/post/PostForm.vue';

const route = useRoute();
const postId = computed(() => route.params.id as string);
</script> 