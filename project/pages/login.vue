<template>
  <!-- ログインフォームコンテナ -->
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-primary-100">
    <!-- フォーム要素を囲むカード -->
    <div class="w-full max-w-md p-8 space-y-6 bg-primary-300 rounded-lg shadow-xl">
      <!-- ページタイトル -->
      <h2 class="text-3xl font-bold text-center text-secondary-500">ログイン</h2>
      <!-- ログインフォーム -->
      <form data-testid="login-form" class="space-y-6" @submit.prevent="handleLogin" novalidate>
        <!-- メールアドレス/アカウントID入力 -->
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
          <!-- 識別子バリデーションエラーメッセージ -->
          <p v-if="validationErrors.identifier" id="identifier-error-message" class="mt-1 text-sm text-error-500" data-testid="identifier-error">{{ validationErrors.identifier }}</p>
        </div>
        <!-- パスワード入力 -->
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
          <!-- パスワードバリデーションエラーメッセージ -->
          <p v-if="validationErrors.password" id="password-error-message" class="mt-1 text-sm text-error-500" data-testid="password-error">{{ validationErrors.password }}</p>
        </div>

        <!-- ログイン処理全体のエラーメッセージ -->
        <p v-if="loginError" class="text-sm text-error-500 p-3 bg-error-100 rounded-md" data-testid="login-general-error">{{ loginError }}</p>
        <!-- ログイン成功メッセージはリダイレクトするため不要 -->

        <!-- ログインボタン -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            data-testid="login-button"
            class="flex justify-center w-full px-4 py-2 text-sm font-medium text-primary-100 bg-secondary-500 border border-transparent rounded-md shadow-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-500 disabled:text-gray-700 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <!-- ローディング表示 -->
            <span v-if="loading" class="flex items-center">
              <NuxtIcon name="svg-spinners:180-ring" class="w-5 h-5 mr-3 -ml-1 text-primary-100" />
              ログイン中...
            </span>
            <!-- 通常表示 -->
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
// --- Vue と Nuxt のインポート --- // 必要な関数やコンポーザブルをインポートします。
import { ref, nextTick } from 'vue'; // Vue のリアクティビティ関数と DOM 更新待機関数をインポートします。
import { useLogin } from '~/composables/auth/useLogin'; // ログインロジックを持つ Composable をインポートします。

// --- ページのメタ情報設定 --- // ブラウザタブのタイトルなどを設定します。
useHead({ title: 'ログイン' }); // Nuxt の useHead を使ってページのタイトルを 'ログイン' に設定します。

// --- リアクティブな状態変数 --- // ログインフォームの入力と状態を管理します。
const identifier = ref(''); // メールアドレスまたはアカウントID入力フィールドの v-model ターゲットです。
const password = ref(''); // パスワード入力フィールドの v-model ターゲットです。
const loginError = ref<string | null>(null); // ログイン処理全体のエラーメッセージを保持します（初期値は null）。
const validationErrors = ref<{ [key: string]: string }>({}); // 各フィールドのバリデーションエラーメッセージを格納するオブジェクトです。

// --- Composable の利用 --- // 外部のログインロジックを利用します。
const { loginUser, loading } = useLogin(); // useLogin Composable からログインを実行する関数と、処理中の状態を示すフラグを取得します。

// --- フォーム送信ハンドラ --- // ログインフォームが送信された際の処理を定義します。
const handleLogin = async () => { // ログインボタンクリック時に実行される非同期関数です。
  loginError.value = null; // 以前のエラーメッセージをクリアします。
  validationErrors.value = {}; // 以前のバリデーションエラーをクリアします。

  // Composable の loginUser 関数を呼び出し、入力された情報でログインを試みます。
  const result = await loginUser({
    identifier: identifier.value, // 入力されたメールアドレスまたはアカウントIDを渡します。
    password: password.value, // 入力されたパスワードを渡します。
  });

  // ログイン処理の結果をハンドリングします。
  if (result.success) { // ログイン成功の場合
    try {
      // ホームページ ('/') へリダイレクトします。
      await navigateTo('/');
    } catch (navError) { // リダイレクト中にエラーが発生した場合
        // ★ ログ: リダイレクト失敗のエラー詳細をコンソールに出力します。
        console.error('[handleLogin] Navigation error:', navError); // ★理由: ホームページへのリダイレクトが失敗した場合の原因調査のため。
        // ユーザーにエラーメッセージを表示します。
        loginError.value = 'ホームページへの遷移中にエラーが発生しました。';
    }
  } else { // ログイン失敗の場合
    // エラーの種類に応じて処理を分岐します。
    switch (result.error.type) {
      case 'validation': // バリデーションエラーの場合
        // 各フィールドのエラーメッセージを validationErrors に設定します。
        validationErrors.value = result.error.errors;
        break;
      case 'authentication': // 認証エラー (ID/パスワード間違いなど) の場合
      case 'network': // ネットワークエラー (Edge Function 呼び出し失敗など) の場合
        // 一般的なログインエラーメッセージを設定します。
        loginError.value = result.error.error.message || 'ログイン中に不明なエラーが発生しました。';
        // ★ ログ: 認証またはネットワークエラーの詳細をコンソールに出力します。
        console.error(`ログイン失敗 (${result.error.type}):`, result.error.error.stack || result.error.error); // ★理由: ID/パスワード間違い、またはサーバー通信の問題が発生した場合の原因特定のため。
        break;
      default: // 上記以外の予期せぬエラーの場合
        // 一般的な予期せぬエラーメッセージを設定します。
        loginError.value = 'ログイン中に予期せぬエラーが発生しました。';
        // エラーオブジェクトを型ガードし、詳細情報をログに出力します。
        const unknownError = result.error as { error?: Error };
        // ★ ログ: 未ハンドリングのエラー詳細をコンソールに出力します。
        console.error('未ハンドルのログインエラータイプ:', unknownError?.error?.stack || unknownError?.error || unknownError); // ★理由: 予期しない種類のエラーレスポンスが返ってきた場合の原因調査のため。
    }
  }
  // エラーメッセージの表示更新を確実にするために nextTick を待ちます。
  await nextTick();
};
</script>

<style scoped>
/* スタイルは Tailwind CSS によって管理されるため、<style> ブロックは通常空です。 */
</style> 