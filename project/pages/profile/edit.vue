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

    <!-- ★ アカウント削除セクション (表示条件を v-if に変更し、profile の存在をチェック) -->
    <div v-if="!initialLoading && !initialFetchError && profile" class="mt-8 pt-8 border-t border-red-200">
      <h3 class="text-lg font-semibold text-red-600">アカウント削除</h3>
      <p class="mt-2 text-sm text-gray-600">
        アカウントを削除すると、関連する全てのデータ（投稿、コメントなど）が削除され、元に戻すことはできません。
      </p>
      <!-- 削除処理エラー表示エリア -->
      <div v-if="deleteErrorDisplay" class="mt-3 bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative" role="alert" data-testid="profile-edit-delete-error">
        <strong class="font-bold">削除エラー:</strong>
        <span class="block sm:inline">{{ deleteErrorDisplay }}</span>
      </div>
      <div class="mt-5">
        <button
          type="button"
          @click="confirmAndDeleteAccount"
          :disabled="isDeleting"
          class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-300 focus:ring-error-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          data-testid="delete-account-button"
        >
          <NuxtIcon v-if="isDeleting" name="svg-spinners:180-ring" class="w-4 h-4 mr-2" />
          {{ isDeleting ? '削除中...' : 'アカウント削除' }}
        </button>
      </div>
    </div>

    <!-- プロフィールが見つからない場合の表示 (条件を調整) -->
    <div v-else-if="!initialLoading && !initialFetchError && !profile" class="text-center text-gray-500 py-10" data-testid="profile-edit-not-found">
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
import { useDeleteAccount } from '~/composables/account/useDeleteAccount';
import type { ProfileUpdatePayload, ProfileData, EdgeFunctionErrorResponse, CustomError } from '~/types';
import { useRouter, useRoute } from '#imports';
import type { User } from '@supabase/supabase-js';
import { useSupabaseClient, useSupabaseUser } from '#imports';

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

// ★ アカウント削除 Composable から状態と関数を取得 (分割代入を修正)
const { isDeleting, errorState: deleteError, deleteAccount } = useDeleteAccount();
// ★ 削除処理のエラー表示用 ref
const deleteErrorDisplay = ref<string | null>(null);

// 編集フォーム用のローカルリアクティブ状態
const editableProfile = reactive<ProfileUpdatePayload>({
  nickname: '',
  bio: '',
});

// ページ初期読み込み時の状態管理用 ref
const initialLoading = ref(true);
const initialFetchError = ref<CustomError | null>(null);

// プロフィール更新処理中のローディング状態用 ref
const isUpdating = ref(false);
const updateErrorDisplay = ref<string | null>(null);
const validationErrors = ref<{ nickname?: string }>({});

// コンポーネントマウント時のライフサイクルフック
onMounted(() => {
  console.log('[ProfileEditPage][onMounted] Component mounted.');
});

// ★ ユーザーID (useProfileから取得) の変更を監視してプロフィールを取得
watch(userId, async (newUserId, oldUserId) => {
  console.log(`[ProfileEditPage][watch userId] Changed from ${oldUserId} to ${newUserId}`);
  if (newUserId) {
    initialFetchError.value = null;
    initialLoading.value = true;
    console.log('[ProfileEditPage][watch userId] User ID available, fetching profile...');
    await fetchProfile();
  } else {
    console.log('[ProfileEditPage][watch userId] User ID is null. Setting not logged in error.');
    initialFetchError.value = { name: 'AuthenticationError', message: 'プロフィールを表示するにはログインが必要です。' };
    initialLoading.value = false;
  }
}, { immediate: true });

// グローバルなプロフィール状態 (profile) またはローディング状態 (profileLoading) の変更を監視
watch([profile, profileLoading], ([newProfile, newLoading], [oldProfile, oldLoading]) => {
  console.log('[ProfileEditPage][watch profile/loading] Changed.', 'NewProfile:', !!newProfile, 'NewLoading:', newLoading);
  if (!newLoading && oldLoading) {
    console.log('[ProfileEditPage][watch profile/loading] Loading finished.');
    if (newProfile) {
      console.log('[ProfileEditPage][watch profile/loading] Profile loaded, setting form values.');
      setFormValues(newProfile);
      initialFetchError.value = null;
    } else {
      console.error('[ProfileEditPage][watch profile/loading] Profile not loaded after fetch.', 'profileError:', profileError.value);
      initialFetchError.value = profileError.value ?? { name: 'NotFoundError', message: 'プロフィール情報が見つかりませんでした。' };
    }
    initialLoading.value = false;
  }
}, { deep: true });

/**
 * グローバルなプロフィールデータ (ProfileData) を編集フォームのローカル状態 (editableProfile) にコピーする。
 * @param data コピー元のプロフィールデータ (null許容)
 */
function setFormValues(data: ProfileData | null) {
  if (data) {
    editableProfile.nickname = data.nickname ?? '';
    editableProfile.bio = data.bio ?? '';
    console.log('[ProfileEditPage][setFormValues] Set editableProfile:', JSON.stringify(editableProfile));
  } else {
    console.warn('[ProfileEditPage][setFormValues] Received null data, skipping form set.');
  }
}

/**
 * 編集フォームの入力値バリデーションを行う。
 */
function validateForm(): boolean {
  validationErrors.value = {};
  let isValid = true;
  if (!editableProfile.nickname || editableProfile.nickname.trim() === '') {
    validationErrors.value.nickname = 'ニックネームは必須です。';
    console.error('[ProfileEditPage][validateForm] Validation error:', validationErrors.value.nickname);
    isValid = false;
  }
  return isValid;
}

/**
 * プロフィール更新処理を実行する。
 */
async function handleUpdateProfile() {
  if (!validateForm()) return;
  isUpdating.value = true;
  updateErrorDisplay.value = null;
  try {
    const success = await updateProfile({
      nickname: (editableProfile.nickname ?? '').trim(),
      bio: (editableProfile.bio ?? '').trim(),
    });
    if (success) {
      router.push('/profile');
    } else {
      updateErrorDisplay.value = profileError.value?.message || 'プロフィールの更新に失敗しました。';
      console.error('[ProfileEditPage][handleUpdateProfile] Update failed:', updateErrorDisplay.value);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[ProfileEditPage][handleUpdateProfile] Unexpected exception:', error.stack || error);
    updateErrorDisplay.value = `予期せぬエラーが発生しました: ${error.message}`;
  } finally {
    isUpdating.value = false;
  }
}

// アカウント削除確認と実行
const confirmAndDeleteAccount = async () => {
  if (window.confirm('アカウントを削除すると、関連する全てのデータ（投稿、コメントなど）が削除され、元に戻すことはできません。本当に削除しますか？')) {
    console.log('[ProfileEditPage] Starting account deletion...');
    await deleteAccount();
  }
};

// deleteError の変更を監視して deleteErrorDisplay に反映
watch(deleteError, (newErrorValue) => {
  if (newErrorValue) {
    console.error('[ProfileEditPage][watch deleteError] Detected error in useDeleteAccount:', newErrorValue);
    if (newErrorValue instanceof Error || (typeof newErrorValue === 'object' && newErrorValue !== null && 'message' in newErrorValue)) {
      deleteErrorDisplay.value = `${newErrorValue.message}`;
    } else {
       deleteErrorDisplay.value = 'アカウントの削除中に不明な形式のエラーが発生しました。';
       console.error('[ProfileEditPage][watch deleteError] Unexpected error format:', newErrorValue);
    }
  } else {
    deleteErrorDisplay.value = null;
  }
});

</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
</style>
