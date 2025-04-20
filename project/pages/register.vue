<template>
  <!-- ユーザー登録ページのルート要素 -->
  <!-- flex コンテナ: 垂直方向の中央揃え (min-hでビューポート基準の高さを確保), 横方向中央揃え, 背景色 -->
  <div class="flex items-center justify-center min-h-[calc(100vh-12rem)] bg-primary-100">
    <!-- フォームコンテナ: 幅制限(max-w-md), パディング(p-8), 要素間の垂直スペース(space-y-6), 背景色, 角丸, 影 -->
    <div class="w-full max-w-md p-8 space-y-6 bg-primary-300 rounded-lg shadow-xl">
      <!-- フォームタイトル: テキストサイズ, 太字, 中央揃え, テキスト色 -->
      <h2 class="text-3xl font-bold text-center text-secondary-500">ユーザー登録</h2>
      <!-- 登録フォーム: テスト用ID, 要素間の垂直スペース, 送信イベントハンドラ(@submit.prevent), ブラウザ標準バリデーション無効化(novalidate) -->
      <form data-testid="register-form" class="space-y-6" @submit.prevent="handleRegister" novalidate>
        <!-- ニックネーム入力セクション -->
        <div>
          <!-- ニックネームラベル: input要素(id='nickname')と関連付け, スタイル -->
          <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
          <!-- ニックネーム入力欄: id属性, v-modelでリアクティブ変数`nickname`と双方向バインド, type属性, テスト用ID, HTML5必須属性, スタイルクラス, エラー時に動的クラス(:class)を適用, aria属性でエラーメッセージ領域と関連付け -->
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
          <!-- ニックネームバリデーションエラーメッセージ: v-ifで表示制御, id, スタイル, testid -->
          <p v-if="registerValidationErrors.nickname" id="nickname-error-message" class="mt-1 text-sm text-error-500" data-testid="nickname-error">{{ registerValidationErrors.nickname }}</p>
        </div>
        <!-- アカウントID入力セクション -->
        <div>
          <!-- アカウントIDラベル -->
          <label for="account-id" class="block text-sm font-medium text-gray-700 mb-1">アカウントID</label>
          <!-- アカウントID入力欄: id, v-model, type, pattern(形式制限), title(形式ヒント), testid, 必須, スタイル, エラー時スタイル, aria属性 -->
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
           <!-- アカウントIDバリデーションエラーメッセージ: v-if, id, スタイル, testid -->
           <p v-if="registerValidationErrors.accountId" id="account-id-error-message" class="mt-1 text-sm text-error-500" data-testid="account-id-error">{{ registerValidationErrors.accountId }}</p>
        </div>
        <!-- メールアドレス入力セクション -->
        <div>
          <!-- メールアドレスラベル -->
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <!-- メールアドレス入力欄: id, v-model, type="email", testid, 必須, スタイル, エラー時スタイル, aria属性 -->
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
          <!-- メールアドレスバリデーションエラーメッセージ: v-if, id, スタイル, testid -->
          <p v-if="registerValidationErrors.email" id="email-error-message" class="mt-1 text-sm text-error-500" data-testid="email-error">{{ registerValidationErrors.email }}</p>
        </div>
        <!-- パスワード入力セクション -->
        <div>
          <!-- パスワードラベル -->
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <!-- パスワード入力欄: id, v-model, type="password", minlength, testid, 必須, スタイル, エラー時スタイル, aria属性 -->
          <input
            id="password"
            v-model="password"
            type="password"
            minlength="6" 
            data-testid="password-input"
            required
            class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
            :class="{ 'border-error-500 focus:ring-error-500': registerValidationErrors.password }"
            aria-describedby="password-error-message"
          />
          <!-- パスワードバリデーションエラーメッセージ: v-if, id, スタイル, testid -->
          <p v-if="registerValidationErrors.password" id="password-error-message" class="mt-1 text-sm text-error-500" data-testid="password-error">{{ registerValidationErrors.password }}</p>
        </div>
        <!-- パスワード確認入力セクション -->
        <div>
          <!-- パスワード確認ラベル -->
          <label for="password-confirm" class="block text-sm font-medium text-gray-700 mb-1">パスワード確認</label>
          <!-- パスワード確認入力欄: id, v-model, type="password", testid, 必須, スタイル, エラー時スタイル, aria属性 -->
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
          <!-- パスワード確認バリデーションエラーメッセージ: v-if, id, スタイル, testid -->
          <p v-if="registerValidationErrors.passwordConfirm" id="password-confirm-error-message" class="mt-1 text-sm text-error-500" data-testid="password-confirm-error">{{ registerValidationErrors.passwordConfirm }}</p>
        </div>

        <!-- 登録処理全体のエラーメッセージ表示エリア: v-ifで表示制御, スタイル, testid -->
        <p v-if="registrationError" class="text-sm text-error-500 p-3 bg-error-100 rounded-md" data-testid="registration-error">{{ registrationError }}</p>
        <!-- 登録成功メッセージ表示エリア: v-ifで表示制御, スタイル, testid -->
        <p v-if="registrationSuccess" class="text-sm text-success-700 p-3 bg-success-100 rounded-md" data-testid="registration-success-message">登録が完了しました。ログインページに移動します...</p>

        <!-- 送信ボタンセクション -->
        <div>
          <!-- 送信ボタン: type="submit", :disabledでローディング中に無効化, testid, スタイル, 無効時スタイル, トランジション -->
          <button
            type="submit"
            :disabled="loading"
            data-testid="register-button"
            class="flex justify-center w-full px-4 py-2 text-sm font-medium text-primary-100 bg-secondary-500 border border-transparent rounded-md shadow-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-500 disabled:text-gray-700 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <!-- ローディング中表示: v-ifで表示制御, スタイル -->
            <span v-if="loading" class="flex items-center">
              <!-- スピナーアイコン (NuxtIcon): name(アイコン名), スタイル, アニメーション -->
              <NuxtIcon name="svg-spinners:180-ring" class="w-5 h-5 mr-3 -ml-1 text-primary-100 animate-spin" />
              登録中...
            </span>
            <!-- 通常時のボタンテキスト: v-elseで表示制御 -->
            <span v-else>登録する</span>
          </button>
        </div>
      </form>

      <!-- ログインページへのリンク表示エリア: 中央揃え, 上マージン -->
      <div class="text-center mt-4">
        <!-- テキスト: スタイル -->
        <p class="text-sm text-gray-500">
          アカウントをお持ちですか？
          <!-- ログインページへの NuxtLink: to(遷移先パス), スタイル, testid -->
          <NuxtLink to="/login" class="font-medium text-secondary-500 hover:text-secondary-700" data-testid="register-login-link">
            ログイン
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue の Composition API 関数 (ref: リアクティブ参照, nextTick: DOM更新待機) をインポート
import { ref, nextTick } from 'vue'
// ユーザー登録ロジックを提供する Composable 関数をインポート
import { useRegister } from '~/composables/auth/useRegister'
// Nuxt の useRouter Composable をインポート (ページ遷移用)
import { useRouter } from '#app'

// Nuxt の useHead Composable を使用してページのメタ情報 (タイトル) を設定
useHead({ title: 'ユーザー登録' })

// --- リアクティブな状態変数 --- // フォーム入力と状態を管理するリアクティブ変数
// ニックネーム入力フィールドの v-model ターゲット
const nickname = ref('')
// アカウントID入力フィールドの v-model ターゲット
const accountId = ref('')
// メールアドレス入力フィールドの v-model ターゲット
const email = ref('')
// パスワード入力フィールドの v-model ターゲット
const password = ref('')
// パスワード確認入力フィールドの v-model ターゲット
const passwordConfirm = ref('')
// 登録成功メッセージの表示制御用フラグ
const registrationSuccess = ref(false)
// 各フィールドのバリデーションエラーメッセージを格納するオブジェクト
const registerValidationErrors = ref<{ [key: string]: string }>({})
// フォーム送信時や API 通信時の全体的なエラーメッセージ
const registrationError = ref<string | null>(null)

// --- Composable とルーターの利用 --- 
// useRegister Composable を呼び出し、登録関数とローディング状態を取得
const { registerUser, loading } = useRegister()
// Nuxt のルーターインスタンスを取得
const router = useRouter()

// --- クライアントサイドバリデーション --- // フォーム入力値を検証する関数群
// フォーム送信前に実行される入力値検証関数
const validateForm = (): boolean => { // 入力フォームのバリデーションを実行
  // 前回のバリデーションエラーと登録エラーをリセット
  registerValidationErrors.value = {};
  registrationError.value = null;
  // フォーム全体の有効性を示すフラグ (初期値: 有効)
  let isValid = true

  // ニックネームが空でないか検証
  if (!nickname.value) {
    registerValidationErrors.value.nickname = 'ニックネームは必須です。'
    isValid = false // 無効に設定
  }

  // アカウントIDが空でないか検証
  if (!accountId.value) {
    registerValidationErrors.value.accountId = 'アカウントIDは必須です。'
    isValid = false // 無効に設定
  // アカウントIDの形式 (半角英数字とアンダースコアのみ) を正規表現で検証
  } else if (!/^[a-zA-Z0-9_]+$/.test(accountId.value)) {
      registerValidationErrors.value.accountId = 'アカウントIDは半角英数字とアンダースコア(_)のみ使用できます。'
      isValid = false // 無効に設定
  }

  // メールアドレスが空でないか検証
  if (!email.value) {
    registerValidationErrors.value.email = 'メールアドレスは必須です。'
    isValid = false // 無効に設定
  // メールアドレスの形式 (@が含まれ、ドメイン部分があるか) を簡単な正規表現で検証
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      registerValidationErrors.value.email = '有効なメールアドレスを入力してください。'
      isValid = false // 無効に設定
  }

  // パスワードが空でないか検証
  if (!password.value) {
    registerValidationErrors.value.password = 'パスワードは必須です。'
    isValid = false // 無効に設定
  // パスワードの最小文字数 (6文字) を検証
  } else if (password.value.length < 6) {
    registerValidationErrors.value.password = 'パスワードは6文字以上である必要があります。'
    isValid = false // 無効に設定
  }

  // パスワード確認が空でないか検証
  if (!passwordConfirm.value) {
    registerValidationErrors.value.passwordConfirm = 'パスワード確認は必須です。'
    isValid = false // 無効に設定
  // パスワードとパスワード確認が一致するか検証
  } else if (password.value !== passwordConfirm.value) {
    registerValidationErrors.value.passwordConfirm = 'パスワードが一致しません。'
    isValid = false // 無効に設定
  }

  // 最終的な検証結果 (true: 有効, false: 無効) を返す
  return isValid
}

// --- フォーム送信ハンドラ --- // フォーム送信時の処理
// フォームの submit イベントに対応するハンドラ関数
const handleRegister = async () => { // 登録フォーム送信時の処理ハンドラ
  // クライアントサイドバリデーションを実行し、無効であれば処理を中断
  if (!validateForm()) return

  // 成功/エラー状態をリセット
  registrationSuccess.value = false
  registerValidationErrors.value = {}
  registrationError.value = null

  // useRegister Composable の registerUser 関数を呼び出して登録処理を実行
  const result = await registerUser({
    email: email.value,
    password: password.value,
    nickname: nickname.value || null, // 空文字列は null に変換
    account_id: accountId.value || null, // 空文字列は null に変換
  })

  // 登録処理の結果 (Result 型) をハンドリング
  if (result.success) {
    // 登録成功時の処理
    registrationSuccess.value = true // 成功メッセージ表示フラグを true に設定
    // ★理由: 登録成功のフィードバックをユーザーに明確に示し、次のアクション（リダイレクト）までの待機時間を理解させるため。
    console.log('登録成功:', result.data) // 開発者向けログ: 成功データを出力

    // 成功メッセージを表示するために少し待機してからリダイレクト
    await nextTick() // DOM 更新を待機
    setTimeout(() => {
      // ログインページへ遷移
      router.push('/login') 
    }, 1500) // 1.5秒後に実行

  } else {
    // 登録失敗時の処理
    // Result オブジェクトの error プロパティ (RegisterError 型) を取得
    const errorData = result.error
    // ★理由: 登録処理が失敗した場合の具体的なエラー原因 (バリデーション、サーバー、ネットワーク等) を特定し、適切なフィードバックをユーザーに提供するため。
    console.error('登録失敗:', errorData) // 開発者向けログ: エラー詳細を出力

    // エラーの種類 (type) に応じてエラーメッセージを設定
    if (errorData.type === 'validation') {
      // バリデーションエラーの場合: 各フィールドのエラーメッセージを registerValidationErrors に設定
      registerValidationErrors.value = errorData.errors
      // ★理由: どの入力フィールドに問題があったかをユーザーに具体的に示し、修正を促すため。
      // フォーム全体のエラーメッセージは設定しない（各フィールドに表示されるため）
      registrationError.value = null;
      // TODO: 必要に応じて、エラーのある最初の入力フィールドにフォーカスを当てる処理を追加
    } else {
      // バリデーション以外の一般的なエラーの場合 (type: 'general')
      // 全体的なエラーメッセージを registrationError に設定
      registrationError.value = errorData.error.message || '登録中に不明なエラーが発生しました。'
      // ★理由: サーバー側の問題やネットワークの問題など、特定の入力フィールドに起因しないエラーが発生したことをユーザーに伝えるため。
      // 個別のバリデーションエラーはクリア
      registerValidationErrors.value = {};
    }
    // 成功フラグを false に設定 (念のため)
    registrationSuccess.value = false
  }
}
</script>

<style scoped>
/* このコンポーネント固有のスタイルは Tailwind CSS で記述されているため、
   <style scoped> ブロックは通常空になります。
   Tailwind で表現できない特別なスタイルが必要な場合にのみ使用します。 */
</style>
