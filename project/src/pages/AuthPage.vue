<template>
  <div class="mx-auto py-4 sm:py-6 md:py-8 max-w-md">
    <div class="glass-card p-4 sm:p-6">
      <!-- タブ切り替えボタン -->
      <div class="flex mb-4 sm:mb-6 border-b border-[rgb(var(--color-border))]">
        <button 
          @click="activeTab = 'login'"
          :class="[
            'py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium focus:outline-none',
            activeTab === 'login' 
              ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' 
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          ]"
        >
          ログイン
        </button>
        <button 
          @click="activeTab = 'register'"
          :class="[
            'py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium focus:outline-none',
            activeTab === 'register' 
              ? 'border-b-2 border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]' 
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
          ]"
        >
          会員登録
        </button>
      </div>
      
      <!-- ログインフォーム -->
      <div v-if="activeTab === 'login'">
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-[rgb(var(--color-heading))]">ログイン</h2>
        
        <form @submit.prevent="handleLoginSubmit" class="space-y-4 sm:space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="loginFormError" class="px-3 py-2 sm:px-4 sm:py-3 rounded bg-[rgb(var(--color-error-dark))/30] border border-[rgb(var(--color-error))] text-[rgb(var(--color-error))]">
            {{ loginFormError }}
          </div>
          
          <!-- メールアドレス/アカウントID -->
          <div>
            <label for="identifier" class="block mb-1 text-xs sm:text-sm font-medium text-[rgb(var(--color-text))]">メールアドレスまたはアカウントID</label>
            <input 
              type="text" 
              id="identifier" 
              v-model="loginData.identifier" 
              class="w-full px-3 py-2 sm:px-4 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
            />
          </div>
          
          <!-- パスワード -->
          <div>
            <label for="password" class="block mb-1 text-xs sm:text-sm font-medium text-[rgb(var(--color-text))]">パスワード</label>
            <input 
              type="password" 
              id="password" 
              v-model="loginData.password" 
              class="w-full px-3 py-2 sm:px-4 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
            />
          </div>
          
          <!-- 送信ボタン -->
          <div>
            <button 
              type="submit" 
              class="flex w-full py-2 justify-center items-center rounded font-medium transition-colors bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-white))] hover:bg-[rgb(var(--color-primary-dark))]"
              :disabled="loginLoading"
            >
              <svg v-if="loginLoading" class="h-4 w-4 mr-2 sm:h-5 sm:w-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loginLoading ? 'ログイン中...' : 'ログイン' }}
            </button>
          </div>
          
          <!-- パスワード忘れた場合 -->
          <div class="text-center">
            <router-link to="/forgot-password" class="text-xs sm:text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))]">
              パスワードをお忘れですか？
            </router-link>
          </div>
        </form>
        
        <!-- 登録リンク -->
        <div class="mt-4 sm:mt-6 text-center">
          <span class="text-xs sm:text-sm text-[rgb(var(--color-text-muted))]">アカウントをお持ちでないですか？</span>
          <button @click="activeTab = 'register'" class="text-xs sm:text-sm ml-1 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))]">会員登録</button>
        </div>
      </div>
      
      <!-- 会員登録フォーム -->
      <div v-else>
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-[rgb(var(--color-heading))]">会員登録</h2>
        
        <form @submit.prevent="handleRegisterSubmit" class="space-y-4 sm:space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="registerFormError" class="p-2 sm:p-3 rounded bg-[rgb(var(--color-error-dark))/30] border border-[rgb(var(--color-error))] text-[rgb(var(--color-error))]">
            {{ registerFormError }}
          </div>
          
          <!-- 表示名 -->
          <div class="mb-2 sm:mb-4">
            <label for="displayName" class="block mb-1 text-xs sm:text-sm text-[rgb(var(--color-text))]">表示名 <span class="text-[rgb(var(--color-error))]">*</span></label>
            <input 
              type="text" 
              id="displayName" 
              v-model="registerData.displayName" 
              class="w-full p-2 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
            />
          </div>
          
          <!-- アカウントID -->
          <div class="mb-2 sm:mb-4">
            <label for="accountId" class="block mb-1 text-xs sm:text-sm text-[rgb(var(--color-text))]">アカウントID</label>
            <div class="flex">
              <span class="flex px-2 py-2 sm:px-3 items-center justify-center rounded-l border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-accent))] text-[rgb(var(--color-text))]">@</span>
              <input 
                type="text" 
                id="accountId" 
                v-model="registerData.accountId" 
                class="flex-1 p-2 rounded-r border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
                pattern="[a-zA-Z0-9_]+"
                placeholder="英数字とアンダースコアのみ"
              />
            </div>
            <p class="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
              空欄の場合は自動的に生成されます
            </p>
          </div>
          
          <!-- メールアドレス -->
          <div class="mb-2 sm:mb-4">
            <label for="email" class="block mb-1 text-xs sm:text-sm text-[rgb(var(--color-text))]">メールアドレス <span class="text-[rgb(var(--color-error))]">*</span></label>
            <input 
              type="email" 
              id="email" 
              v-model="registerData.email" 
              class="w-full p-2 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
            />
          </div>
          
          <!-- パスワード -->
          <div class="mb-2 sm:mb-4">
            <label for="registerPassword" class="block mb-1 text-xs sm:text-sm text-[rgb(var(--color-text))]">パスワード <span class="text-[rgb(var(--color-error))]">*</span></label>
            <input 
              type="password" 
              id="registerPassword" 
              v-model="registerData.password" 
              class="w-full p-2 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
              minlength="8"
            />
          </div>
          
          <!-- パスワード確認 -->
          <div class="mb-2 sm:mb-4">
            <label for="passwordConfirm" class="block mb-1 text-xs sm:text-sm text-[rgb(var(--color-text))]">パスワード（確認）</label>
            <input 
              id="passwordConfirm" 
              v-model="registerData.passwordConfirm" 
              type="password" 
              class="w-full p-2 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))]"
              required
            />
          </div>
          
          <!-- 規約同意 -->
          <div class="flex items-start">
            <div class="flex h-5 items-center">
              <input 
                id="terms" 
                v-model="registerData.agreeToTerms" 
                type="checkbox" 
                required
                class="h-4 w-4 rounded border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] focus:ring-[rgb(var(--color-primary))]"
              />
            </div>
            <label for="terms" class="ml-2 text-xs sm:text-sm text-[rgb(var(--color-text))]">
              <span>
                <router-link to="/terms" class="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))]">利用規約</router-link>と
                <router-link to="/privacy" class="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))]">プライバシーポリシー</router-link>に同意します
              </span>
            </label>
          </div>
          
          <!-- 登録ボタン -->
          <div>
            <button 
              type="submit" 
              class="flex w-full py-2 justify-center items-center rounded font-medium transition-colors bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text-white))] hover:bg-[rgb(var(--color-primary-dark))]"
              :disabled="registerLoading || !isRegisterFormValid"
            >
              <svg v-if="registerLoading" class="h-4 w-4 mr-2 sm:h-5 sm:w-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ registerLoading ? '登録中...' : '登録する' }}
            </button>
          </div>
        </form>
        
        <!-- ログインリンク -->
        <div class="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
          <span class="text-[rgb(var(--color-text-muted))]">すでにアカウントをお持ちですか？</span>
          <button @click="activeTab = 'login'" class="ml-1 text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))]">ログイン</button>
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
  -webkit-box-shadow: 0 0 0 30px rgb(var(--color-surface)) inset !important;
  -webkit-text-fill-color: rgb(var(--color-text)) !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: rgb(var(--color-text));
}
</style> 