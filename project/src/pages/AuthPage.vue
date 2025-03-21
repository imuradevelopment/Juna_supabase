<template>
  <div class="mx-auto py-4 sm:py-6 md:py-8 max-w-md">
    <div class="glass-card p-4 sm:p-6">
      <!-- タブ切り替えボタン -->
      <div class="flex mb-4 sm:mb-6 border-b border-border">
        <button 
          @click="activeTab = 'login'"
          :class="[
            'py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium focus:outline-none flex items-center',
            activeTab === 'login' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-text-muted hover:text-text'
          ]"
        >
          <PhSignIn class="h-4 w-4 mr-1" />
          ログイン
        </button>
        <button 
          @click="activeTab = 'register'"
          :class="[
            'py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium focus:outline-none flex items-center',
            activeTab === 'register' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-text-muted hover:text-text'
          ]"
        >
          <PhUserPlus class="h-4 w-4 mr-1" />
          会員登録
        </button>
      </div>
      
      <!-- ログインフォーム -->
      <div v-if="activeTab === 'login'">
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-heading">ログイン</h2>
        
        <form @submit.prevent="handleLoginSubmit" class="space-y-4 sm:space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="loginFormError" class="px-3 py-2 sm:px-4 sm:py-3 rounded bg-error-dark/30 border border-error text-error">
            {{ loginFormError }}
          </div>
          
          <!-- メールアドレス/アカウントID -->
          <div>
            <label for="identifier" class="block mb-1 text-xs sm:text-sm font-medium text-text">メールアドレスまたはアカウントID</label>
            <input 
              type="text" 
              id="identifier" 
              v-model="loginData.identifier" 
              class="w-full px-3 py-2 sm:px-4 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <!-- パスワード -->
          <div>
            <label for="password" class="block mb-1 text-xs sm:text-sm font-medium text-text">パスワード</label>
            <input 
              type="password" 
              id="password" 
              v-model="loginData.password" 
              class="w-full px-3 py-2 sm:px-4 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <!-- 送信ボタン -->
          <div>
            <button 
              type="submit" 
              class="btn btn-primary flex w-full justify-center items-center"
              :disabled="loginLoading"
            >
              <PhSpinner v-if="loginLoading" class="h-4 w-4 mr-2 sm:h-5 sm:w-5 animate-spin" />
              {{ loginLoading ? 'ログイン中...' : 'ログイン' }}
            </button>
          </div>
          
          <!-- パスワード忘れた場合 -->
          <div class="text-center">
            <router-link to="/forgot-password" class="btn-link">
              パスワードをお忘れですか？
            </router-link>
          </div>
        </form>
        
        <!-- 登録リンク -->
        <div class="mt-4 sm:mt-6 text-center">
          <span class="text-xs sm:text-sm text-text-muted">アカウントをお持ちでないですか？</span>
          <button @click="activeTab = 'register'" class="btn-link">会員登録</button>
        </div>
      </div>
      
      <!-- 会員登録フォーム -->
      <div v-else>
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-heading">会員登録</h2>
        
        <form @submit.prevent="handleRegisterSubmit" class="space-y-4 sm:space-y-6">
          <!-- アラートメッセージ -->
          <div v-if="registerFormError" class="p-2 sm:p-3 rounded bg-error-dark/30 border border-error text-error">
            {{ registerFormError }}
          </div>
          
          <!-- 表示名 -->
          <div class="mb-2 sm:mb-4">
            <label for="nickname" class="block mb-1 text-xs sm:text-sm text-text">表示名 <span class="text-error">*</span></label>
            <input 
              type="text" 
              id="nickname" 
              v-model="registerData.nickname" 
              class="w-full p-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <!-- アカウントID -->
          <div class="mb-2 sm:mb-4">
            <label for="accountId" class="block mb-1 text-xs sm:text-sm text-text">アカウントID</label>
            <div class="flex">
              <span class="flex px-2 py-2 sm:px-3 items-center justify-center rounded-l border border-border bg-surface-accent text-text">@</span>
              <input 
                type="text" 
                id="accountId" 
                v-model="registerData.accountId" 
                class="flex-1 p-2 rounded-r border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                pattern="[a-zA-Z0-9_]+"
                placeholder="英数字とアンダースコアのみ"
              />
            </div>
            <p class="mt-1 text-xs text-text-muted">
              空欄の場合は自動的に生成されます
            </p>
          </div>
          
          <!-- メールアドレス -->
          <div class="mb-2 sm:mb-4">
            <label for="email" class="block mb-1 text-xs sm:text-sm text-text">メールアドレス <span class="text-error">*</span></label>
            <input 
              type="email" 
              id="email" 
              v-model="registerData.email" 
              class="w-full p-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <!-- パスワード -->
          <div class="mb-2 sm:mb-4">
            <label for="registerPassword" class="block mb-1 text-xs sm:text-sm text-text">パスワード <span class="text-error">*</span></label>
            <input 
              type="password" 
              id="registerPassword" 
              v-model="registerData.password" 
              class="w-full p-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
              minlength="8"
            />
          </div>
          
          <!-- パスワード確認 -->
          <div class="mb-2 sm:mb-4">
            <label for="passwordConfirm" class="block mb-1 text-xs sm:text-sm text-text">パスワード（確認）</label>
            <input 
              id="passwordConfirm" 
              v-model="registerData.passwordConfirm" 
              type="password" 
              class="w-full p-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                class="h-4 w-4 rounded border-border bg-surface focus:ring-primary"
              />
            </div>
            <label for="terms" class="ml-2 text-xs sm:text-sm text-text">
              <span>
                <router-link to="/terms" class="btn-link">利用規約</router-link>と
                <router-link to="/privacy" class="btn-link">プライバシーポリシー</router-link>に同意します
              </span>
            </label>
          </div>
          
          <!-- 登録ボタン -->
          <div>
            <button 
              type="submit" 
              class="btn btn-primary flex w-full justify-center items-center"
              :disabled="registerLoading || !isRegisterFormValid"
            >
              <PhSpinner v-if="registerLoading" class="h-4 w-4 mr-2 sm:h-5 sm:w-5 animate-spin" />
              {{ registerLoading ? '登録中...' : '登録する' }}
            </button>
          </div>
        </form>
        
        <!-- ログインリンク -->
        <div class="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
          <span class="text-text-muted">すでにアカウントをお持ちですか？</span>
          <button @click="activeTab = 'login'" class="btn-link">ログイン</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotification } from '../composables/useNotification';
import { PhSpinner, PhSignIn, PhUserPlus } from '@phosphor-icons/vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 通知表示関数を取得
const { showNotification } = useNotification();

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
  nickname: '',
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
    registerData.value.nickname.length > 0 && 
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
      showNotification('success', 'ログイン成功', 'ようこそ、' + authStore.displayName + 'さん');
      // リダイレクト先が指定されていればそこへ、なければホームへ
      const redirectPath = route.query.redirect as string || '/';
      router.push(redirectPath);
    } else {
      loginFormError.value = error || 'ログインに失敗しました';
      // エラー通知
      showNotification('error', 'ログインエラー', loginFormError.value);
    }
  } catch (err: any) {
    console.error('ログインエラー:', err);
    loginFormError.value = 'ログイン中にエラーが発生しました';
    // エラー通知
    showNotification('error', 'ログインエラー', loginFormError.value);
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
      registerData.value.nickname,
      registerData.value.accountId
    );
    
    if (success) {
      // 登録成功通知を表示
      showNotification('success', '会員登録完了', '会員登録が完了しました。ログインしてください。');
      // ログインタブに切り替え
      activeTab.value = 'login';
    } else {
      registerFormError.value = error || '登録に失敗しました';
      // エラー通知
      showNotification('error', '登録エラー', registerFormError.value);
    }
  } catch (err: any) {
    console.error('登録エラー:', err);
    registerFormError.value = '登録中にエラーが発生しました';
    // エラー通知
    showNotification('error', '登録エラー', registerFormError.value);
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
  -webkit-box-shadow: 0 0 0 30px theme('colors.surface') inset !important;
  -webkit-text-fill-color: theme('colors.text') !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: theme('colors.text');
}
</style> 