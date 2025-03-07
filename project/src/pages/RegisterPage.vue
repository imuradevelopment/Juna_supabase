<template>
  <div class="max-w-md mx-auto py-8">
    <div class="glass-card p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">会員登録</h1>
      
      <RegisterForm />
      
      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>すでにアカウントをお持ちですか？</p>
        <router-link to="/login" class="text-primary hover:underline">ログインする</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RegisterForm from '../components/auth/RegisterForm.vue';
</script> 