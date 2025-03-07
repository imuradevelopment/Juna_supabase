<template>
  <div class="form-container p-6 rounded-lg">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- アラートメッセージ -->
      <div v-if="formError" class="alert alert-error p-3 rounded">
        {{ formError }}
      </div>
      
      <!-- 表示名 -->
      <div class="form-field">
        <label for="displayName" class="form-label block mb-1">表示名 <span class="text-required">*</span></label>
        <input 
          type="text" 
          id="displayName" 
          v-model="displayName" 
          class="form-input w-full p-2 rounded"
          required
        />
      </div>
      
      <!-- アカウントID -->
      <div class="form-field">
        <label for="accountId" class="form-label block mb-1">アカウントID</label>
        <div class="flex">
          <span class="input-addon px-3 py-2 rounded-l border border-gray-700 bg-gray-800 text-gray-300 flex items-center justify-center">@</span>
          <input 
            type="text" 
            id="accountId" 
            v-model="accountId" 
            class="form-input flex-1 p-2 rounded-r"
            pattern="[a-zA-Z0-9_]+"
            placeholder="英数字とアンダースコアのみ"
          />
        </div>
        <p class="text-xs mt-1 text-hint">
          空欄の場合は自動的に生成されます
        </p>
      </div>
      
      <!-- メールアドレス -->
      <div class="form-field">
        <label for="email" class="form-label block mb-1">メールアドレス <span class="text-required">*</span></label>
        <input 
          type="email" 
          id="email" 
          v-model="email" 
          class="form-input w-full p-2 rounded"
          required
        />
      </div>
      
      <!-- パスワード -->
      <div class="form-field">
        <label for="password" class="form-label block mb-1">パスワード <span class="text-required">*</span></label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          class="form-input w-full p-2 rounded"
          required
          minlength="8"
        />
      </div>
      
      <!-- パスワード確認 -->
      <div class="form-field">
        <label for="passwordConfirm" class="form-label block mb-1">パスワード（確認）</label>
        <input 
          id="passwordConfirm" 
          v-model="passwordConfirm" 
          type="password" 
          class="form-input w-full p-2 rounded"
          required
        />
      </div>
      
      <!-- 規約同意 -->
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input 
            id="terms" 
            v-model="agreeToTerms" 
            type="checkbox" 
            required
            class="form-checkbox"
          />
        </div>
        <label for="terms" class="form-label ml-2 text-sm">
          <span>
            <router-link to="/terms" class="link-primary">利用規約</router-link>と
            <router-link to="/privacy" class="link-primary">プライバシーポリシー</router-link>に同意します
          </span>
        </label>
      </div>
      
      <!-- 登録ボタン -->
      <div>
        <button 
          type="submit" 
          class="btn btn-primary w-full py-2 flex justify-center items-center"
          :disabled="loading || !isFormValid"
        >
          <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? '登録中...' : '登録する' }}
        </button>
      </div>
    </form>
    
    <!-- ログインリンク -->
    <div class="mt-6 text-center text-sm">
      <span class="text-hint">すでにアカウントをお持ちですか？</span>
      <router-link to="/login" class="link-primary ml-1">ログイン</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 通知表示関数を取得
const showNotification = inject('showNotification') as (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;

// フォーム状態
const displayName = ref('');
const accountId = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const agreeToTerms = ref(false);
const formError = ref('');
const loading = ref(false);

// パスワード一致確認
const passwordsMatch = computed(() => {
  return password.value === passwordConfirm.value;
});

// フォームの有効性確認
const isFormValid = computed(() => {
  return (
    displayName.value.length > 0 && 
    email.value.length > 0 && 
    password.value.length >= 8 && 
    passwordsMatch.value && 
    agreeToTerms.value
  );
});

// 登録処理
async function handleSubmit() {
  if (!isFormValid.value) {
    if (!passwordsMatch.value) {
      formError.value = 'パスワードと確認用パスワードが一致しません';
    }
    return;
  }
  
  loading.value = true;
  formError.value = '';
  
  try {
    const { success, error } = await authStore.register(
      email.value, 
      password.value, 
      displayName.value,
      accountId.value
    );
    
    if (success) {
      // 登録成功通知を表示
      if (showNotification) {
        showNotification('success', '会員登録完了', '会員登録が完了しました。ログインしてください。');
      }
      // ログインページへリダイレクト
      router.push('/login');
    } else {
      formError.value = error || '登録に失敗しました';
      // エラー通知
      if (showNotification) {
        showNotification('error', '登録エラー', formError.value);
      }
    }
  } catch (err: any) {
    console.error('登録エラー:', err);
    formError.value = '登録中にエラーが発生しました';
    // エラー通知
    if (showNotification) {
      showNotification('error', '登録エラー', formError.value);
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

/* フォームフィールドのスタイル */
.form-field {
  margin-bottom: 1rem;
}

/* @マークのスタイルを強化 */
.input-addon {
  background-color: #2d3748 !important;
  color: #f1f5f9 !important;
  border-color: #475569 !important;
}

/* スコープ外のスタイル上書きを確実にするために */
html body .input-addon {
  background-color: #2d3748 !important;
  color: #f1f5f9 !important;
  border-color: #475569 !important;
}
</style> 