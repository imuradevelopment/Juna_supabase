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
        <span class="block sm:inline">{{ updateErrorDisplay.message }}</span>
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
          {{ isUpdating ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>

    <!-- ★ アカウント削除セクション -->
    <div v-if="!initialLoading && !initialFetchError && profile" class="mt-8 pt-8 border-t border-red-200">
      <h3 class="text-lg font-semibold text-red-600">アカウント削除</h3>
      <p class="mt-2 text-sm text-gray-600">
        アカウントを削除すると、関連する全てのデータ（投稿、コメントなど）が削除され、元に戻すことはできません。
      </p>
      <!-- 削除処理エラー表示エリア (deleteError を直接使用) -->
      <div v-if="deleteError" class="mt-3 bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative" role="alert" data-testid="profile-edit-delete-error">
        <strong class="font-bold">削除エラー:</strong>
        <span class="block sm:inline">{{ deleteError.message }}</span>
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
import { useAccount } from '~/composables/account/useAccount';
import type { ProfileUpdatePayload, ProfileData, EdgeFunctionErrorResponse, CustomError } from '~/types';
import { isCustomError } from '~/types'; // ★ isCustomError をインポート
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

// ★ useAccount から取得し、変数名を合わせる
const { isLoading: isDeleting, error: deleteError, deleteAccount } = useAccount();

// 編集フォーム用のローカルリアクティブ状態
const editableProfile = reactive<ProfileUpdatePayload>({
  nickname: '',
  bio: '',
});

// ページ初期読み込み時の状態管理用 ref
const initialLoading = ref(true);
// ★ initialFetchError の型を CustomError | null に変更
const initialFetchError = ref<CustomError | null>(null);

// プロフィール更新処理中のローディング状態用 ref
const isUpdating = ref(false);
// ★ updateErrorDisplay の型も CustomError | null に変更 (エラーオブジェクト全体を保持する)
const updateErrorDisplay = ref<CustomError | null>(null);
const validationErrors = ref<{ nickname?: string }>({});

// コンポーネントマウント時のライフサイクルフック
onMounted(() => {
  console.log('[ProfileEditPage][onMounted] Component mounted.');
});

// ★ ユーザーID (useProfileから取得) の変更を監視してプロフィールを取得
watch(userId, async (newUserId, oldUserId) => {
  console.log(`[ProfileEditPage][watch userId] Changed from ${oldUserId} to ${newUserId}`);
  if (newUserId) {
    initialFetchError.value = null; // エラーをリセット
    initialLoading.value = true;    // ローディング開始
    console.log('[ProfileEditPage][watch userId] User ID available, fetching profile...');
    await fetchProfile(); // プロフィール取得を開始
    // fetchProfile 完了後にローディング状態やフォーム値が更新されるのは下の watch で行う
  } else {
    // ユーザーIDが null になった場合 (ログアウトなど)
    console.log('[ProfileEditPage][watch userId] User ID is null. Resetting state.');
    initialLoading.value = false; // ローディング解除
    initialFetchError.value = null; // エラークリア
    editableProfile.nickname = ''; // フォームリセット
    editableProfile.bio = '';
  }
}, { immediate: true }); // ★ immediate: true に変更し、初期マウント時にも実行

// ★ useProfile のローディング状態の変更を監視
watch(profileLoading, (newLoading, oldLoading) => {
  console.log(`[ProfileEditPage][watch profileLoading] Changed from ${oldLoading} to ${newLoading}`);
  if (newLoading) {
    // ローディングが始まったら
    console.log('[ProfileEditPage][watch profileLoading] Loading started.');
    initialLoading.value = true;
    initialFetchError.value = null; // 既存のエラーをクリア
  } else if (!newLoading && oldLoading) {
    // ローディングが完了したら
    console.log('[ProfileEditPage][watch profileLoading] Loading finished.');
    initialLoading.value = false; // ページの初期ローディング状態も解除

    // ★ errorGlobal の型が CustomError | null になったため、エラー処理を簡略化
    const errorValue = profileError.value; // リアクティブな値をローカル変数にコピー
    if (errorValue) {
      // profileError は既に CustomError | null なので、そのまま代入
      console.error('[ProfileEditPage][watch profileLoading] Error detected after loading:', errorValue.message, errorValue.errorCode ? `(${errorValue.errorCode})` : '', errorValue.cause);
      initialFetchError.value = errorValue;
    } else if (!profile.value) {
      // エラーはないが、profile データも存在しない場合 (通常は起こらないはず)
      console.warn('[ProfileEditPage][watch profileLoading] Profile data is null after loading without error.');
      // ★ CustomError を生成して代入
      initialFetchError.value = { name:'FetchError', message: 'プロファイルデータの取得に失敗しました。', errorCode: 'profile_fetch_failed' };
    } else {
       // エラーがなく、profile データが存在する場合 (正常系)
       console.log('[ProfileEditPage][watch profileLoading] Profile data loaded successfully.');
       // フォーム値の設定は profile の watch で行うため、ここでは何もしない
    }
  }
});

// ★ profile データ自体の変更を監視 (fetchProfile 成功後に値がセットされる)
watch(profile, (newProfile) => {
  console.log(`[ProfileEditPage][watch profile] Changed. New profile data: ${!!newProfile}`);
  if (newProfile && !profileLoading.value && !profileError.value) {
    // プロフィールデータがあり、ローディング中でなく、エラーもない場合にフォーム値を設定
    console.log('[ProfileEditPage][watch profile] Setting form values.');
    setFormValues(newProfile);
    initialFetchError.value = null; // 念のためエラークリア
  }
}, { deep: false }); // ★ deep: false に変更 (profile 自体がリアクティブなため)

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
      // ★ profileError.value は CustomError | null なので、そのまま表示用に代入
      updateErrorDisplay.value = profileError.value;
      if (profileError.value) {
        console.error('[ProfileEditPage][handleUpdateProfile] Update failed:', profileError.value.message, profileError.value.errorCode ? `(${profileError.value.errorCode})` : '', profileError.value.cause);
      } else {
         console.error('[ProfileEditPage][handleUpdateProfile] Update failed with null error object.');
         // フォールバックエラーを設定
         updateErrorDisplay.value = { name: 'UnknownError', message: 'プロフィールの更新に失敗しましたが、詳細なエラー情報はありません。' };
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[ProfileEditPage][handleUpdateProfile] Unexpected exception:', error.stack || error);
    // ★ 例外も CustomError として表示
    updateErrorDisplay.value = {
      name: error.name || 'UpdateException',
      message: `予期せぬエラーが発生しました: ${error.message}`,
      errorCode: 'update_unexpected_exception',
      cause: error
    };
  } finally {
    isUpdating.value = false;
  }
}

// アカウント削除確認と実行
const confirmAndDeleteAccount = async () => {
  // 削除確認ダイアログ
  if (window.confirm('アカウントを削除すると、関連する全てのデータ（投稿、コメントなど）が削除され、元に戻すことはできません。本当に削除しますか？')) {
    console.log('[ProfileEditPage] Starting account deletion...');
    // useAccount の deleteAccount を呼び出す
    const result = await deleteAccount();

    // 成功した場合の処理
    if (result.success) {
      console.log('[ProfileEditPage] Account deletion successful. Signing out and redirecting...');
      try {
        // ★ クライアントを取得して null チェック
        const client = useSupabaseClient();
        if (!client) {
            console.error('アカウント削除後のログアウト失敗: Supabase client is not available.');
            // エラーは発生したが、リダイレクトは試みる
            await router.push('/'); // リダイレクトは試行
            return;
        }
        // Supabase からログアウト
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
          console.error('アカウント削除後のログアウト失敗:', signOutError);
          // エラーは発生したが、リダイレクトは試みる
        }
        // ホームページにリダイレクト
        await router.push('/');
        // 必要であれば成功メッセージを表示 (例: Toast通知)
      } catch (e) {
        console.error('ログアウトまたはリダイレクト中にエラー:', e);
        // ここでもエラーメッセージをユーザーに表示することを検討
        // ★ deleteError.value は読み取り専用なので代入しない
        // deleteError.value = new Error('アカウントは削除されましたが、ログアウトまたはリダイレクト中にエラーが発生しました。') as typeof deleteError.value;
        // ★ 代わりにコンソールログやUI通知などでユーザーにフィードバックする
        console.error('アカウント削除後のログアウト/リダイレクトエラー。UIへのフィードバックを検討してください。');
      }
    } else {
      // deleteAccount が失敗した場合 (エラーは deleteError ref に設定されているはず)
      console.error('[ProfileEditPage] Account deletion failed:', result.error);
      // エラー表示はテンプレートの v-if="deleteError" で行われる
    }
  }
};

</script>

<style scoped>
/* 必要に応じてスタイルを追加 */
</style>
