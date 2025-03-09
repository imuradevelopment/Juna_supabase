<template>
  <div class="max-w-md mx-auto py-8">
    <div class="auth-form glass-card p-6">
      <!-- タブ切り替えボタン -->
      <div class="flex border-b border-gray-700 mb-6">
        <button 
          @click="activeTab = 'login'"
          :class="[
            'py-2 px-4 font-medium text-sm focus:outline-none',
            activeTab === 'login' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-gray-500 hover:text-gray-300'
          ]"
        >
          ログイン
        </button>
        <button 
          @click="activeTab = 'register'"
          :class="[
            'py-2 px-4 font-medium text-sm focus:outline-none',
            activeTab === 'register' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-gray-500 hover:text-gray-300'
          ]"
        >
          会員登録
        </button>
      </div>
      
      <!-- ログインフォーム -->
      <div v-if="activeTab === 'login'">
        <h2 class="text-2xl font-bold mb-6 text-center">ログイン</h2>
        
        <form @submit.prevent="handleLoginSubmit" class="space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="loginFormError" class="alert alert-error px-4 py-3 rounded">
            {{ loginFormError }}
          </div>
          
          <!-- メールアドレス/アカウントID -->
          <div>
            <label for="identifier" class="form-label block text-sm font-medium mb-1">メールアドレスまたはアカウントID</label>
            <input 
              type="text" 
              id="identifier" 
              v-model="loginData.identifier" 
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
              v-model="loginData.password" 
              class="form-input w-full px-4 py-2 rounded border focus:outline-none focus:ring-2"
              required
            />
          </div>
          
          <!-- 送信ボタン -->
          <div>
            <button 
              type="submit" 
              class="w-full btn btn-primary flex justify-center items-center py-2"
              :disabled="loginLoading"
            >
              <svg v-if="loginLoading" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loginLoading ? 'ログイン中...' : 'ログイン' }}
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
          <button @click="activeTab = 'register'" class="link-primary ml-1">会員登録</button>
        </div>
      </div>
      
      <!-- 会員登録フォーム -->
      <div v-else>
        <h2 class="text-2xl font-bold mb-6 text-center">会員登録</h2>
        
        <form @submit.prevent="handleRegisterSubmit" class="space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="registerFormError" class="alert alert-error p-3 rounded">
            {{ registerFormError }}
          </div>
          
          <!-- 表示名 -->
          <div class="form-field">
            <label for="displayName" class="form-label block mb-1">表示名 <span class="text-required">*</span></label>
            <input 
              type="text" 
              id="displayName" 
              v-model="registerData.displayName" 
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
                v-model="registerData.accountId" 
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
              v-model="registerData.email" 
              class="form-input w-full p-2 rounded"
              required
            />
          </div>
          
          <!-- パスワード -->
          <div class="form-field">
            <label for="registerPassword" class="form-label block mb-1">パスワード <span class="text-required">*</span></label>
            <input 
              type="password" 
              id="registerPassword" 
              v-model="registerData.password" 
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
              v-model="registerData.passwordConfirm" 
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
                v-model="registerData.agreeToTerms" 
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
              :disabled="registerLoading || !isRegisterFormValid"
            >
              <svg v-if="registerLoading" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ registerLoading ? '登録中...' : '登録する' }}
            </button>
          </div>
        </form>
        
        <!-- ログインリンク -->
        <div class="mt-6 text-center text-sm">
          <span class="text-hint">すでにアカウントをお持ちですか？</span>
          <button @click="activeTab = 'login'" class="link-primary ml-1">ログイン</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 通知表示関数を取得
const showNotification = inject('showNotification') as (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;

// タブ切り替え
const activeTab = ref('login');

// ログインフォームの状態
const loginData = ref({
  identifier: '',
  password: ''
});
const loginLoading = ref(false);
const loginFormError = ref('');

// 登録フォームの状態
const registerData = ref({
  displayName: '',
  accountId: '',
  email: '',
  password: '',
  passwordConfirm: '',
  agreeToTerms: false
});
const registerLoading = ref(false);
const registerFormError = ref('');

// パスワード一致確認
const passwordsMatch = computed(() => {
  return registerData.value.password === registerData.value.passwordConfirm;
});

// 登録フォームの有効性確認
const isRegisterFormValid = computed(() => {
  return (
    registerData.value.displayName.length > 0 && 
    registerData.value.email.length > 0 && 
    registerData.value.password.length >= 8 && 
    passwordsMatch.value && 
    registerData.value.agreeToTerms
  );
});

// 初期化時にURLパラメータからアクティブタブを設定
onMounted(() => {
  if (route.query.mode === 'register') {
    activeTab.value = 'register';
  }
});

// URLクエリパラメータの変更を監視して、タブを切り替える
watch(() => route.query.mode, (newMode) => {
  if (newMode === 'register') {
    activeTab.value = 'register';
  } else {
    activeTab.value = 'login';
  }
});

// ログイン処理
async function handleLoginSubmit() {
  loginLoading.value = true;
  loginFormError.value = '';
  
  try {
    const { success, error } = await authStore.login(loginData.value.identifier, loginData.value.password);
    
    if (success) {
      // ログイン成功
      if (showNotification) {
        showNotification('success', 'ログイン成功', 'ようこそ、' + authStore.displayName + 'さん');
      }
      // リダイレクト先が指定されていればそこへ、なければホームへ
      const redirectPath = route.query.redirect as string || '/';
      router.push(redirectPath);
    } else {
      loginFormError.value = error || 'ログインに失敗しました';
      // エラー通知
      if (showNotification) {
        showNotification('error', 'ログインエラー', loginFormError.value);
      }
    }
  } catch (err: any) {
    console.error('ログインエラー:', err);
    loginFormError.value = 'ログイン中にエラーが発生しました';
    // エラー通知
    if (showNotification) {
      showNotification('error', 'ログインエラー', loginFormError.value);
    }
  } finally {
    loginLoading.value = false;
  }
}

// 登録処理
async function handleRegisterSubmit() {
  if (!isRegisterFormValid.value) {
    if (!passwordsMatch.value) {
      registerFormError.value = 'パスワードと確認用パスワードが一致しません';
    }
    return;
  }
  
  registerLoading.value = true;
  registerFormError.value = '';
  
  try {
    const { success, error } = await authStore.register(
      registerData.value.email, 
      registerData.value.password, 
      registerData.value.displayName,
      registerData.value.accountId
    );
    
    if (success) {
      // 登録成功通知を表示
      if (showNotification) {
        showNotification('success', '会員登録完了', '会員登録が完了しました。ログインしてください。');
      }
      // ログインタブに切り替え
      activeTab.value = 'login';
    } else {
      registerFormError.value = error || '登録に失敗しました';
      // エラー通知
      if (showNotification) {
        showNotification('error', '登録エラー', registerFormError.value);
      }
    }
  } catch (err: any) {
    console.error('登録エラー:', err);
    registerFormError.value = '登録中にエラーが発生しました';
    // エラー通知
    if (showNotification) {
      showNotification('error', '登録エラー', registerFormError.value);
    }
  } finally {
    registerLoading.value = false;
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