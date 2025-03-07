<template>
  <div class="glass-card p-6">
    <h2 class="text-2xl font-bold mb-6 text-center">ログイン</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- アラートメッセージ -->
      <div v-if="formError" class="alert alert-error px-4 py-3 rounded">
        {{ formError }}
      </div>
      
      <!-- メールアドレス/アカウントID -->
      <div>
        <label for="identifier" class="form-label block text-sm font-medium mb-1">メールアドレスまたはアカウントID</label>
        <input 
          type="text" 
          id="identifier" 
          v-model="identifier" 
          class="form-input w-full px-4 py-2 rounded border focus:outline-none focus:ring-2"
          required
        />
      </div>
      
      <!-- パスワード -->
      <div>
        <label for="password" class="form-label block text-sm font-medium mb-1">パスワード</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          class="form-input w-full px-4 py-2 rounded border focus:outline-none focus:ring-2"
          required
        />
      </div>
      
      <!-- 送信ボタン -->
      <div>
        <button 
          type="submit" 
          class="w-full btn btn-primary flex justify-center items-center py-2"
          :disabled="loading"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </div>
      
      <!-- パスワード忘れた場合 -->
      <div class="text-center">
        <router-link to="/forgot-password" class="text-sm link-primary">
          パスワードをお忘れですか？
        </router-link>
      </div>
    </form>
    
    <!-- 登録リンク -->
    <div class="mt-6 text-center text-sm">
      <span class="text-hint">アカウントをお持ちでないですか？</span>
      <router-link to="/register" class="link-primary ml-1">会員登録</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { inject } from 'vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 通知表示関数を取得
const showNotification = inject('showNotification') as (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;

// メールアドレスまたはアカウントIDに変更
const identifier = ref('');
const password = ref('');
const loading = ref(false);
const formError = ref('');

// ログイン処理
async function handleSubmit() {
  loading.value = true;
  formError.value = '';
  
  try {
    // identifierがメールアドレスまたはアカウントIDのどちらでも対応可能なlogin関数を呼び出す
    const { success, error } = await authStore.login(identifier.value, password.value);
    
    if (success) {
      // ログイン成功
      // 成功通知を表示
      if (showNotification) {
        showNotification('success', 'ログイン成功', 'ようこそ、' + authStore.displayName + 'さん');
      }
      // リダイレクト先が指定されていればそこへ、なければホームへ
      const redirectPath = route.query.redirect as string || '/';
      router.push(redirectPath);
    } else {
      formError.value = error || 'ログインに失敗しました';
      // エラー通知
      if (showNotification) {
        showNotification('error', 'ログインエラー', formError.value);
      }
    }
  } catch (err: any) {
    console.error('ログインエラー:', err);
    formError.value = 'ログイン中にエラーが発生しました';
    // エラー通知
    if (showNotification) {
      showNotification('error', 'ログインエラー', formError.value);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style>
/* ブラウザの自動入力スタイルをオーバーライド */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
  -webkit-text-fill-color: #f1f5f9 !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: #f1f5f9;
}

/* ダークモードでの自動入力スタイル */
.dark input:-webkit-autofill,
.dark input:-webkit-autofill:hover,
.dark input:-webkit-autofill:focus,
.dark input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
}
</style> 