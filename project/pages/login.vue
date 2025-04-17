<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-primary-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-primary-300 rounded-lg shadow-xl">
      <h2 class="text-3xl font-bold text-center text-secondary-500">ログイン</h2>
      <form data-testid="login-form" class="space-y-6" @submit.prevent="handleLogin" novalidate>
        <div>
          <label for="identifier" class="block text-sm font-medium text-gray-700 mb-1">メールアドレスまたはアカウントID</label>
          <input
            id="identifier"
            v-model="identifier"
            type="text"
            data-testid="identifier-input"
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': validationErrors.identifier }"
            aria-describedby="identifier-error-message"
          />
          <p v-if="validationErrors.identifier" id="identifier-error-message" class="mt-1 text-sm text-error-500" data-testid="identifier-error">{{ validationErrors.identifier }}</p>
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            data-testid="password-input"
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': validationErrors.password }"
            aria-describedby="password-error-message"
          />
          <p v-if="validationErrors.password" id="password-error-message" class="mt-1 text-sm text-error-500" data-testid="password-error">{{ validationErrors.password }}</p>
        </div>

        <p v-if="loginError" class="text-sm text-error-500 p-3 bg-error-100 rounded-md" data-testid="login-general-error">{{ loginError }}</p>
        <!-- ログイン成功メッセージはリダイレクトするため不要 -->

        <div>
          <button
            type="submit"
            :disabled="loading"
            data-testid="login-button"
            class="flex justify-center w-full px-4 py-2 text-sm font-medium text-primary-100 bg-secondary-500 border border-transparent rounded-md shadow-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-500 disabled:text-gray-700 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <span v-if="loading" class="flex items-center">
              <NuxtIcon name="svg-spinners:180-ring" class="w-5 h-5 mr-3 -ml-1 text-primary-100" />
              ログイン中...
            </span>
            <span v-else>ログイン</span>
          </button>
        </div>
      </form>

      <!-- 新規登録ページへのリンク -->
      <div class="text-center mt-4">
        <p class="text-sm text-gray-500">
          アカウントをお持ちでないですか？
          <NuxtLink to="/register" class="font-medium text-secondary-500 hover:text-secondary-700" data-testid="login-register-link">
            新規登録
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useLogin } from '~/composables/auth/useLogin';

useHead({ title: 'ログイン' });

const identifier = ref('');
const password = ref('');
const loginError = ref<string | null>(null);
const validationErrors = ref<{ [key: string]: string }>({});

const { loginUser, loading } = useLogin();

const handleLogin = async () => {
  loginError.value = null;
  validationErrors.value = {};
  console.log('[handleLogin] Attempting login with:', identifier.value);

  console.log('[handleLogin] Calling loginUser...');
  const result = await loginUser({
    identifier: identifier.value,
    password: password.value,
  });
  console.log('[handleLogin] loginUser call finished.');

  console.log('[handleLogin] loginUser result:', JSON.stringify(result));

  if (result.success) {
    console.log('[handleLogin] Login successful. User ID:', result.data.userId);
    console.log('[handleLogin] Navigating to / ...');
    try {
      await navigateTo('/');
      console.log('[handleLogin] Navigation to / should have started.');
    } catch (navError) {
        console.error('[handleLogin] Navigation error:', navError);
        loginError.value = 'ホームページへの遷移中にエラーが発生しました。';
    }
  } else {
    console.log('[handleLogin] Login failed. Error type:', result.error.type);
    switch (result.error.type) {
      case 'validation':
        validationErrors.value = result.error.errors;
        break;
      case 'authentication':
      case 'network':
      case 'unknown':
        loginError.value = result.error.error.message || 'ログイン中に不明なエラーが発生しました。';
        console.error(`ログイン失敗 (${result.error.type}):`, result.error.error.stack || result.error.error);
        break;
      default:
        loginError.value = 'ログイン中に予期せぬエラーが発生しました。';
        const unknownError = result.error as { error?: Error };
        console.error('未ハンドルのログインエラータイプ:', unknownError?.error?.stack || unknownError?.error || unknownError);
    }
  }
  await nextTick();
};
</script>

<style scoped>
/* スコープ付きスタイルは Tailwind でカバーされるため基本不要 */
</style> 