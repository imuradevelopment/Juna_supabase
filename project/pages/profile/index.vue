<template>
  <!-- プロフィール表示ページのルート要素 -->
  <div class="max-w-2xl mx-auto bg-primary-300 shadow-lg rounded-lg p-6" data-testid="profile-page">
    <!-- ページタイトル -->
    <h1 class="text-2xl font-bold text-secondary-500 mb-6" data-testid="profile-title">プロフィール</h1>

    <!-- ローディング中の表示 -->
    <div v-if="loading" class="text-center text-gray-500 py-10" data-testid="profile-loading">
      <!-- ローディングアイコン -->
      <NuxtIcon name="svg-spinners:180-ring" class="w-8 h-8 text-secondary-500 mx-auto" />
      <!-- ローディングメッセージ -->
      <p>読み込み中...</p>
    </div>

    <!-- エラー発生時の表示 -->
    <div v-else-if="error" class="bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative mb-6" role="alert" data-testid="profile-error">
      <!-- エラータイトル -->
      <strong class="font-bold">エラー:</strong>
      <!-- エラーメッセージ -->
      <span class="block sm:inline">プロフィールの読み込みに失敗しました。</span>
      <!-- 詳細なエラーメッセージ (error が CustomError オブジェクトであることを想定) -->
      <p class="text-sm mt-1">{{ error.message }}</p>
      <!-- 再試行ボタン -->
      <button @click="fetchProfile" class="mt-2 px-3 py-1 bg-error-300 text-error-900 text-xs font-medium rounded hover:bg-error-400">再試行</button>
    </div>

    <!-- プロフィール情報が存在する場合の表示 -->
    <div v-else-if="profile" class="space-y-4" data-testid="profile-details">
      <!-- ニックネーム表示 -->
      <div>
        <label class="block text-sm font-medium text-gray-500">ニックネーム</label>
        <p class="mt-1 text-lg text-gray-100" data-testid="profile-nickname">{{ profile.nickname || '未設定' }}</p>
      </div>
      <!-- アカウントID表示 -->
      <div>
        <label class="block text-sm font-medium text-gray-500">アカウントID</label>
        <p v-if="profile.account_id" class="mt-1 text-lg text-gray-400" data-testid="profile-account-id">@{{ profile.account_id }}</p>
        <p v-else class="mt-1 text-lg text-gray-500 italic" data-testid="profile-account-id-missing">アカウントID未設定</p>
      </div>
      <!-- 自己紹介表示 -->
      <div>
        <label class="block text-sm font-medium text-gray-500">自己紹介</label>
        <p class="mt-1 text-base text-gray-200 whitespace-pre-wrap" data-testid="profile-bio">{{ profile.bio || '自己紹介がありません' }}</p>
      </div>
      <!-- アバター表示 (コメントアウト中) -->
      <!-- <div v-if="profile.avatar_data">
        <label class="block text-sm font-medium text-gray-500">アバター</label>
        <img :src="profile.avatar_data" alt="アバター" class="mt-1 h-20 w-20 rounded-full object-cover" data-testid="profile-avatar">
      </div> -->

      <!-- 編集ページへのリンク -->
      <div class="mt-8 pt-4 border-t border-primary-500">
        <NuxtLink
          to="/profile/edit"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-100 bg-secondary-500 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-300 focus:ring-secondary-300 transition duration-150 ease-in-out"
          data-testid="profile-edit-link"
        >
          <!-- 編集アイコン -->
          <NuxtIcon name="mdi:pencil" class="w-4 h-4 mr-2" />
          <!-- 編集リンクラベル -->
          編集
        </NuxtLink>
      </div>
    </div>

    <!-- プロフィールが見つからない場合の表示 -->
    <div v-else class="text-center text-gray-500 py-10" data-testid="profile-not-found">
      <!-- メッセージ -->
      <p>プロフィール情報が見つかりません。</p>
      <!-- 補足メッセージ -->
      <p class="text-sm mt-1">ログイン状態を確認するか、時間を置いて再試行してください。</p>
      <!-- 再読み込みボタン -->
      <button @click="fetchProfile" class="mt-4 px-3 py-1 bg-gray-500 text-gray-100 text-xs font-medium rounded hover:bg-gray-600">再読み込み</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 必要なモジュールをインポート
import { onMounted, watch } from 'vue';
import { useProfile } from '~/composables/profile/useProfile';
import { useRoute } from '#imports';

// プロフィール表示ページ。
// useProfile Composable から提供されるグローバルなプロフィール状態 (profile),
// ローディング状態 (loading)、エラー状態 (error) をリアクティブに表示する。
// ページマウント時やユーザーID変更時に必要に応じてプロフィールデータを取得する。

// useProfile Composable から状態と関数を取得
const { profile, loading, error, fetchProfile, userId } = useProfile();
// 現在のルート情報を取得 (パスの変更を監視するため)
const route = useRoute();

// コンポーネントがマウントされた際のライフサイクルフック
onMounted(() => {
  // ユーザーIDが存在し、かつグローバルなプロフィール状態が未設定の場合のみデータを取得
  // これにより、既に他のページで取得済みの場合は不要な再取得を防ぐ
  if (userId.value && profile.value === null) {
    fetchProfile(); // プロフィール取得関数を呼び出し
  }
});

// ユーザーIDまたは現在のルートパスの変更を監視
watch(
  [userId, () => route.path], // 監視対象のリアクティブな値の配列
  async ([newUserId, newPath], [oldUserId, oldPath]) => { // 新旧の値を受け取るコールバック
    // プロフィールページが表示されており、かつユーザーIDが存在し、
    // さらにグローバルなプロフィール状態が未設定の場合にデータを取得
    if (newUserId && newPath === '/profile' && profile.value === null) {
      // ユーザーIDが変更されたか、他のページからプロフィールページに遷移してきた場合に再取得
      if (newUserId !== oldUserId || newPath !== oldPath) {
          await fetchProfile(); // プロフィール取得関数を呼び出し
      }
    }
    // ユーザーがログアウトした場合などの考慮は useProfile 内の watch で行う
  },
  { immediate: false } // immediate:true だと onMounted と重複するため false
);

// グローバルな error 状態の変更を監視
watch(error, (newError) => {
  // エラーが発生した場合、コンソールに出力 (UI上のエラー表示はテンプレート側で実施)
  if (newError) {
    // console.error は残す
    // ★ newError は CustomError オブジェクトなので、message, errorCode, cause を参照できる
    console.error('[ProfilePage][watch error] Detected error in useProfile:', newError.message, newError.errorCode ? `(${newError.errorCode})` : '', newError.cause);
    // ここでトースト通知などのUIエラー表示を追加することも可能
  }
});
</script>

<style scoped>
/* 改行とスペースを保持するためのスタイル */
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style> 