<template>
  <!-- ユーザー登録フォームのコンテナ -->
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-primary-100">
    <!-- フォーム要素を配置するカード -->
    <div class="w-full max-w-md p-8 space-y-6 bg-primary-300 rounded-lg shadow-xl">
      <!-- フォームタイトル -->
      <h2 class="text-3xl font-bold text-center text-secondary-500">ユーザー登録</h2>
      <!-- 登録フォーム要素 -->
      <form data-testid="register-form" class="space-y-6" @submit.prevent="handleRegister" novalidate>
        <!-- ニックネーム入力フィールド -->
        <div>
          <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <input
            id="nickname"
            v-model="nickname"
            type="text"
            data-testid="nickname-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.nickname }"
            aria-describedby="nickname-error-message"
          />
          <!-- ニックネームのバリデーションエラーメッセージ -->
          <p v-if="registerValidationErrors.nickname" id="nickname-error-message" class="mt-1 text-sm text-error-500" data-testid="nickname-error">{{ registerValidationErrors.nickname }}</p>
        </div>
        <!-- アカウントID入力フィールド -->
        <div>
          <label for="account-id" class="block text-sm font-medium text-gray-700 mb-1">アカウントID</label>
          <input
            id="account-id"
            v-model="accountId"
            type="text"
            pattern="^[a-zA-Z0-9_]+$"
            title="アカウントIDは半角英数字とアンダースコア(_)のみ使用できます"
            data-testid="account-id-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.accountId }"
            aria-describedby="account-id-error-message"
          />
           <!-- アカウントIDのバリデーションエラーメッセージ -->
           <p v-if="registerValidationErrors.accountId" id="account-id-error-message" class="mt-1 text-sm text-error-500" data-testid="account-id-error">{{ registerValidationErrors.accountId }}</p>
        </div>
        <!-- メールアドレス入力フィールド -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            data-testid="email-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.email }"
            aria-describedby="email-error-message"
          />
          <!-- メールアドレスのバリデーションエラーメッセージ -->
          <p v-if="registerValidationErrors.email" id="email-error-message" class="mt-1 text-sm text-error-500" data-testid="email-error">{{ registerValidationErrors.email }}</p>
        </div>
        <!-- パスワード入力フィールド -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            minlength="8"
            data-testid="password-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.password }"
            aria-describedby="password-error-message"
          />
          <!-- パスワードのバリデーションエラーメッセージ -->
          <p v-if="registerValidationErrors.password" id="password-error-message" class="mt-1 text-sm text-error-500" data-testid="password-error">{{ registerValidationErrors.password }}</p>
        </div>
        <!-- パスワード確認入力フィールド -->
        <div>
          <label for="password-confirm" class="block text-sm font-medium text-gray-700 mb-1">パスワード確認</label>
          <input
            id="password-confirm"
            v-model="passwordConfirm"
            type="password"
            data-testid="password-confirm-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.passwordConfirm }"
            aria-describedby="password-confirm-error-message"
          />
          <!-- パスワード確認のバリデーションエラーメッセージ -->
          <p v-if="registerValidationErrors.passwordConfirm" id="password-confirm-error-message" class="mt-1 text-sm text-error-500" data-testid="password-confirm-error">{{ registerValidationErrors.passwordConfirm }}</p>
        </div>

        <!-- 登録処理全体のエラーメッセージ -->
        <p v-if="registrationError" class="text-sm text-error-500 p-3 bg-error-100 rounded-md" data-testid="registration-error">{{ registrationError }}</p>
        <!-- 登録成功メッセージ (成功時に表示) -->
        <p v-if="registrationSuccess" class="text-sm text-success-700 p-3 bg-success-100 rounded-md" data-testid="registration-success-message">登録が完了しました。ログインページに移動します...</p>

        <!-- 送信ボタン -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            data-testid="register-button"
            class="flex justify-center w-full px-4 py-2 text-sm font-medium text-primary-100 bg-secondary-500 border border-transparent rounded-md shadow-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-500 disabled:text-gray-700 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <!-- ローディング表示 -->
            <span v-if="loading" class="flex items-center">
              <NuxtIcon name="svg-spinners:180-ring" class="w-5 h-5 mr-3 -ml-1 text-primary-100 animate-spin" />
              登録中...
            </span>
            <!-- 通常時のボタンテキスト -->
            <span v-else>登録する</span>
          </button>
        </div>
      </form>

      <!-- ログインページへのリンク -->
      <div class="text-center mt-4">
        <p class="text-sm text-gray-500">
          アカウントをお持ちですか？
          <NuxtLink to="/login" class="font-medium text-secondary-500 hover:text-secondary-700" data-testid="register-login-link">
            ログイン
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue と Nuxt の Composition API 関数をインポート
import { ref, nextTick } from 'vue'
// useRegister composable をインポート
import { useRegister } from '~/composables/auth/useRegister'

// ページタイトル設定
useHead({ title: 'ユーザー登録' })

// ニックネーム入力用のリアクティブな参照
const nickname = ref('')
// アカウントID入力用のリアクティブな参照
const accountId = ref('')
// メールアドレス入力用のリアクティブな参照
const email = ref('')
// パスワード入力用のリアクティブな参照
const password = ref('')
// パスワード確認入力用のリアクティブな参照
const passwordConfirm = ref('')
// 登録成功状態を示すリアクティブな参照
const registrationSuccess = ref(false)
// バリデーションエラーメッセージを格納するリアクティブな参照
const registerValidationErrors = ref<{ [key: string]: string }>({})
// 登録処理全体のエラーメッセージを格納するリアクティブな参照
const registrationError = ref<string | null>(null)

// useRegister composable から registerUser 関数と loading 状態を取得
const { registerUser, loading } = useRegister()

// フォームの入力値を検証する関数
const validateForm = (): boolean => {
  // バリデーションエラーと登録エラーを初期化
  registerValidationErrors.value = {};
  registrationError.value = null;
  // 検証結果を格納する変数 (初期値は true)
  let isValid = true

  // ニックネームの検証
  if (!nickname.value) {
    registerValidationErrors.value.nickname = 'ニックネームは必須です。'
    isValid = false
  }

  // アカウントIDの検証
  if (!accountId.value) {
    registerValidationErrors.value.accountId = 'アカウントIDは必須です。'
    isValid = false
  // アカウントIDの形式検証 (半角英数字とアンダースコアのみ)
  } else if (!/^[a-zA-Z0-9_]+$/.test(accountId.value)) {
      registerValidationErrors.value.accountId = 'アカウントIDは半角英数字とアンダースコア(_)のみ使用できます。'
      isValid = false
  }

  // メールアドレスの検証
  if (!email.value) {
    registerValidationErrors.value.email = 'メールアドレスは必須です。'
    isValid = false
  // メールアドレスの形式検証
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      registerValidationErrors.value.email = '有効なメールアドレスを入力してください。'
      isValid = false
  }

  // パスワードの検証
  if (!password.value) {
    registerValidationErrors.value.password = 'パスワードは必須です。'
    isValid = false
  // パスワードの最小文字数検証 (8文字以上)
  } else if (password.value.length < 6) {
    registerValidationErrors.value.password = 'パスワードは6文字以上である必要があります。'
    isValid = false
  }

  // パスワード確認の検証
  if (!passwordConfirm.value) {
    registerValidationErrors.value.passwordConfirm = 'パスワード確認は必須です。'
    isValid = false
  // パスワードとパスワード確認が一致するか検証
  } else if (password.value !== passwordConfirm.value) {
    registerValidationErrors.value.passwordConfirm = 'パスワードが一致しません。'
    isValid = false
  }

  // 最終的な検証結果を返す
  return isValid
}

// フォーム送信時の処理を行う非同期関数
const handleRegister = async () => {
  // 登録成功状態、バリデーションエラー、登録エラーを初期化
  registrationSuccess.value = false
  registerValidationErrors.value = {}
  registrationError.value = null

  // フォームのバリデーションを実行し、無効な場合は処理を中断
  if (!validateForm()) {
    // DOM の更新を待ってから処理を終了 (エラーメッセージ表示のため)
    await nextTick();
    return;
  }

  // useRegister composable の registerUser 関数を呼び出し
  const result = await registerUser({
    nickname: nickname.value,
    account_id: accountId.value,
    email: email.value,
    password: password.value,
    created_at: '', // DB側で設定
    updated_at: '', // DB側で設定
  })

  // 登録が成功した場合
  if (result.success) {
    // 成功状態を true に設定
    registrationSuccess.value = true;
    // フォームの入力値をクリア
    nickname.value = '';
    accountId.value = '';
    email.value = '';
    password.value = '';
    passwordConfirm.value = '';
    // 2秒後にログインページへ遷移 (成功メッセージを見せるため)
    setTimeout(() => {
      navigateTo('/login');
    }, 2000);
  // 登録が失敗した場合
  } else {
    // エラータイプがバリデーションエラーの場合
    if (result.error.type === 'validation') {
      // バリデーションエラーメッセージを設定
      registerValidationErrors.value = result.error.errors;
    // エラータイプが一般的なエラーの場合
    } else if (result.error.type === 'general') {
      // 登録エラーメッセージを設定
      registrationError.value = result.error.error.message || '不明なエラーが発生しました。';
      // エラーをコンソールに出力 (スタックトレースを含む)
      console.error('登録失敗 (一般エラー):', result.error.error.stack || result.error.error);
    }
  }

  // エラーメッセージなどの表示を確実にするために DOM 更新を待機
  await nextTick();
};
</script>

<style scoped>
/* スコープ付きスタイルは Tailwind でカバーされるため基本不要 */
</style>
