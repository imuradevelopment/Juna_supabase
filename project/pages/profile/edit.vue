<template>
  <!-- プロフィール編集ページのルート要素 -->
  <div class="max-w-lg mx-auto bg-primary-300 shadow-lg rounded-lg p-6" data-testid="profile-edit-page">
    <!-- ページタイトル -->
    <h1 class="text-2xl font-bold text-secondary-500 mb-6" data-testid="profile-edit-title">プロフィール編集</h1>

    <!-- 初期データ読み込み中の表示 -->
    <div v-if="initialLoading" class="text-center text-gray-500 py-10" data-testid="profile-edit-loading">
      <!-- ローディングアイコン -->
      <NuxtIcon name="svg-spinners:180-ring" class="w-8 h-8 text-secondary-500 mx-auto" />
      <!-- ローディングメッセージ -->
      <p>読み込み中...</p>
    </div>

    <!-- 初期データ読み込みエラー時の表示 -->
    <div v-else-if="initialFetchError" class="bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative mb-4" role="alert" data-testid="profile-edit-fetch-error">
      <!-- エラータイトル -->
      <strong class="font-bold">読み込みエラー:</strong>
      <!-- エラーメッセージ -->
      <span class="block sm:inline">プロフィールの読み込みに失敗しました。</span>
      <!-- 詳細なエラーメッセージ -->
       <p class="text-sm mt-1">{{ initialFetchError.message }}</p>
       <!-- 再試行ボタン -->
       <button @click="fetchProfile" class="mt-2 px-3 py-1 bg-error-300 text-error-900 text-xs font-medium rounded hover:bg-error-400">再試行</button>
    </div>

    <!-- プロフィール編集フォーム (初期読み込み完了後、エラーがない場合) -->
    <form v-else-if="editableProfile" @submit.prevent="handleUpdateProfile" class="space-y-4" data-testid="profile-edit-form" novalidate>
      <!-- ニックネーム入力欄 -->
      <div>
        <label for="nickname" class="block text-sm font-medium text-gray-400">ニックネーム <span class="text-error-500">*</span></label>
        <input
          type="text"
          id="nickname"
          v-model="editableProfile.nickname"
          class="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
          :class="{ 'border-error-500 focus:ring-error-500 focus:border-error-500': validationErrors.nickname }"
          data-testid="profile-edit-nickname"
          required
          aria-describedby="nickname-validation-error"
        />
        <!-- ニックネームのバリデーションエラーメッセージ表示 -->
        <p v-if="validationErrors.nickname" id="nickname-validation-error" class="mt-1 text-sm text-error-500" data-testid="profile-edit-nickname-error">{{ validationErrors.nickname }}</p>
      </div>

      <!-- アカウントID表示 (編集不可) -->
      <div>
        <label for="account_id" class="block text-sm font-medium text-gray-500">アカウントID</label>
        <input
          type="text"
          id="account_id"
          :value="profile?.account_id || '読み込み中...'"
          class="mt-1 block w-full rounded-md border-gray-700 shadow-sm bg-primary-500 text-gray-400 cursor-not-allowed sm:text-sm"
          data-testid="profile-edit-account-id"
          disabled
          readonly
        />
        <p class="mt-1 text-xs text-gray-500">アカウントIDは変更できません。</p>
      </div>

      <!-- 自己紹介入力欄 -->
      <div>
        <label for="bio" class="block text-sm font-medium text-gray-400">自己紹介</label>
        <textarea
          id="bio"
          v-model="editableProfile.bio"
          rows="4"
          class="mt-1 block w-full rounded-md shadow-sm sm:text-sm"
          data-testid="profile-edit-bio"
        ></textarea>
      </div>

      <!-- 更新処理エラー表示エリア -->
      <div v-if="updateErrorDisplay" class="bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative" role="alert" data-testid="profile-edit-update-error">
        <strong class="font-bold">更新エラー:</strong>
        <span class="block sm:inline">{{ updateErrorDisplay }}</span>
      </div>

      <!-- フォーム操作ボタンエリア -->
      <div class="flex justify-end space-x-3 pt-4">
        <!-- キャンセルボタン (プロフィール表示ページへ戻る) -->
        <NuxtLink
          to="/profile"
          class="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-300 focus:ring-gray-500 transition duration-150 ease-in-out"
          data-testid="profile-edit-cancel-link"
        >
          キャンセル
        </NuxtLink>
        <!-- 保存ボタン -->
        <button
          type="submit"
          :disabled="isUpdating"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-100 bg-secondary-500 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-300 focus:ring-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          data-testid="profile-edit-save-button"
        >
          <!-- 更新処理中のアイコン -->
          <NuxtIcon v-if="isUpdating" name="svg-spinners:180-ring" class="w-4 h-4 mr-2" />
          <!-- ボタンラベル (状態によって変化) -->
          {{ isUpdating ? '保存中...' : '保存する' }}
        </button>
      </div>
    </form>

    <!-- プロフィールが見つからない場合の表示 (初期読み込み後) -->
    <div v-else class="text-center text-gray-500 py-10" data-testid="profile-edit-not-found">
       <p>プロフィール情報が見つかりません。</p>
       <p class="text-sm mt-1">前のページに戻って再試行してください。</p>
       <!-- プロフィール表示ページへのリンク -->
       <NuxtLink to="/profile" class="mt-4 inline-block px-3 py-1 bg-gray-500 text-gray-100 text-xs font-medium rounded hover:bg-gray-600">プロフィールへ戻る</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 必要なモジュールをインポート
import { ref, onMounted, reactive, watch } from 'vue';
import { useProfile } from '~/composables/profile/useProfile';
import type { ProfileUpdatePayload, ProfileData } from '~/types';
import { useRouter, useRoute } from '#imports';

/**
 * プロフィール編集ページ。
 * useProfile Composable から取得したグローバルなプロフィール状態を初期値として
 * ローカルの編集可能状態 (editableProfile) にコピーし、ユーザーによる変更を管理する。
 * フォーム送信時にバリデーションを行い、問題なければ useProfile の updateProfile 関数を呼び出す。
 */

// useProfile Composable から必要な状態と関数を取得
const {
  profile,          // グローバルなプロフィール状態 (リアクティブ)
  loading: profileLoading, // useProfile の fetch/update ローディング状態 (リアクティブ)
  error: profileError,   // useProfile の fetch/update エラー状態 (リアクティブ)
  fetchProfile,       // プロフィール取得関数
  updateProfile,      // プロフィール更新関数
  userId            // ユーザーID (リアクティブ)
} = useProfile();
// Vue Router インスタンスを取得 (ページ遷移用)
const router = useRouter();

// 編集フォーム用のローカルリアクティブ状態
// グローバル状態 (profile) とは別に変更を保持する
const editableProfile = reactive<ProfileUpdatePayload>({
  nickname: '', // 初期値は空文字。マウント後に profile から設定
  bio: '',      // 初期値は空文字。マウント後に profile から設定
});

// ページ初期読み込み時の状態管理用 ref
const initialLoading = ref(true); // ページ全体の初期データ読み込み中フラグ
const initialFetchError = ref<Error | null>(null); // 初期データ読み込みエラー

// プロフィール更新処理中のローディング状態用 ref
const isUpdating = ref(false);
// フォームに表示する更新エラーメッセージ用 ref (APIエラー等)
const updateErrorDisplay = ref<string | null>(null);
// フォーム項目ごとのバリデーションエラーメッセージ用 ref
const validationErrors = ref<{ nickname?: string }>({});

// コンポーネントマウント時のライフサイクルフック
onMounted(async () => {
  initialLoading.value = true; // ローディング開始
  initialFetchError.value = null; // エラークリア

  // ユーザーIDが存在する場合のみ処理
  if (userId.value) {
    // グローバル状態 (profile) が未設定の場合、まず fetchProfile を呼び出す
    // これにより、ブラウザリロードなどで直接編集ページに来た場合に対応
    if (profile.value === null) {
        await fetchProfile(); // useProfile 内のグローバル状態を更新
    }
    // フェッチ後 (または既に存在した場合) にフォームの初期値を設定
    if (profile.value) {
      setFormValues(profile.value); // グローバル状態からフォームへコピー
    } else {
      // fetch しても profile が null のまま = 取得失敗
      // console.error は残す
      console.error('[ProfileEditPage][onMounted] Failed to fetch profile or profile is null after fetch.');
      initialFetchError.value = profileError.value ?? new Error('プロフィールの読み込みに失敗しました。');
      // console.error は残す
      console.error('[ProfileEditPage][onMounted] 初期プロフィール読み込みエラー:', initialFetchError.value.stack || initialFetchError.value);
    }
  } else {
     // ユーザーIDがない = 未ログイン状態
     // console.error は残す
     console.error('[ProfileEditPage][onMounted] User ID not found. User might be logged out.');
     initialFetchError.value = new Error('ログインしていません。');
     // console.error は残す
     console.error('[ProfileEditPage][onMounted] 未ログインエラー:', initialFetchError.value.stack || initialFetchError.value);
  }
  initialLoading.value = false; // ローディング完了
});

// グローバルなプロフィール状態 (profile) が変更された場合、フォームに再反映する
// 例: 別タブで更新された場合など (リアルタイム性は低いが基本的な同期)
watch(profile, (newProfileData) => {
  // 初期読み込み中や更新処理中は反映しない (ユーザーの編集中断を防ぐため)
  if (newProfileData && !initialLoading.value && !isUpdating.value) {
    setFormValues(newProfileData);
  }
}, { deep: true }); // ネストされたプロパティの変更も検知

/**
 * グローバルなプロフィールデータ (ProfileData) を編集フォームのローカル状態 (editableProfile) にコピーする。
 * @param data コピー元のプロフィールデータ (null許容)
 */
function setFormValues(data: ProfileData | null) {
  if (data) {
    // nullish coalescing operator (??) を使用して、null または undefined の場合に空文字を設定
    editableProfile.nickname = data.nickname ?? '';
    editableProfile.bio = data.bio ?? '';
  }
}

/**
 * 編集フォームの入力値バリデーションを行う。
 * @returns バリデーションが成功した場合は true、失敗した場合は false。
 *          失敗した場合、validationErrors にエラーメッセージが設定される。
 */
function validateForm(): boolean {
  validationErrors.value = {}; // エラーメッセージをリセット
  let isValid = true;
  // ニックネームが空文字または空白のみでないかチェック
  if (!editableProfile.nickname || editableProfile.nickname.trim() === '') {
    validationErrors.value.nickname = 'ニックネームは必須です。';
    // console.error は残す
    console.error('[ProfileEditPage][validateForm] バリデーションエラー:', validationErrors.value.nickname);
    isValid = false;
  }
  // 他の項目 (bioなど) のバリデーションが必要な場合はここに追加
  return isValid;
}

/**
 * プロフィール更新処理を実行する。
 * フォームのバリデーションを行い、成功すれば useProfile の updateProfile を呼び出す。
 * 処理結果に応じてローディング状態やエラー表示を更新し、成功時にはプロフィール表示ページへ遷移する。
 */
async function handleUpdateProfile() {
  // フォームバリデーションを実行
  if (!validateForm()) {
    return; // バリデーション失敗時は処理中断
  }

  isUpdating.value = true; // 更新処理開始
  updateErrorDisplay.value = null; // 更新エラー表示をクリア

  try {
    // useProfile の更新関数を呼び出し
    const success = await updateProfile({
      nickname: (editableProfile.nickname ?? '').trim(),
      bio: (editableProfile.bio ?? '').trim(),
    });

    // 更新成功時
    if (success) {
      // プロフィール表示ページへ遷移
      router.push('/profile');
    } else {
      // 更新失敗時 (useProfile 側でエラーが設定されているはず)
      // グローバルエラーが存在すればそれを表示、なければ汎用メッセージ
      updateErrorDisplay.value = profileError.value?.message || 'プロフィールの更新に失敗しました。時間をおいて再試行してください。';
      // console.error は残す (profileError.value は useProfile 内で出力済みの可能性あり)
      console.error('[ProfileEditPage][handleUpdateProfile] 更新失敗:', updateErrorDisplay.value);
    }
  } catch (err) {
    // updateProfile 関数自体で例外が発生した場合 (通常は useProfile 内で捕捉されるはず)
    const error = err instanceof Error ? err : new Error(String(err));
    // console.error は残す
    console.error('[ProfileEditPage][handleUpdateProfile] 更新処理中に予期せぬ例外:', error.stack || error);
    updateErrorDisplay.value = `予期せぬエラーが発生しました: ${error.message}`;
  } finally {
    isUpdating.value = false; // 更新処理完了 (成功/失敗問わず)
  }
}

</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
</style>
