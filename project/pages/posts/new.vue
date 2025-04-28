<template>
  <!-- 新規投稿ページのルート要素 -->
  <div class="max-w-3xl mx-auto p-6 bg-primary-300 shadow-lg rounded-lg" data-testid="post-create-page">
    <!-- ページタイトル -->
    <h1 class="text-3xl font-bold text-secondary-500 mb-6" data-testid="post-create-form-title">新規投稿作成</h1>

    <!-- 投稿フォーム -->
    <form @submit.prevent="createPost" data-testid="post-create-form" novalidate class="space-y-6">
      <!-- タイトル入力フィールド -->
      <div>
        <label for="post-title" class="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
        <input
          id="post-title"
          v-model="title"
          type="text"
          required
          data-testid="post-create-title-input"
          class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
          :class="{ 'border-error-500 focus:ring-error-500': validationErrors.title }"
          aria-describedby="post-title-error"
        />
        <!-- タイトル入力エラーメッセージ -->
        <p v-if="validationErrors.title" id="post-title-error" class="mt-1 text-sm text-error-500" data-testid="post-create-title-input-error">
          {{ validationErrors.title }}
        </p>
      </div>

      <!-- 内容入力フィールド (将来的にはTipTapエディタに置き換える予定) -->
      <div>
        <label for="post-content" class="block text-sm font-medium text-gray-700 mb-1">内容</label>
        <textarea
          id="post-content"
          v-model="content"
          required
          rows="10"
          data-testid="post-create-content-input"
          class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm"
          :class="{ 'border-error-500 focus:ring-error-500': validationErrors.content }"
          aria-describedby="post-content-error"
        ></textarea>
        <!-- 内容入力エラーメッセージ -->
        <p v-if="validationErrors.content" id="post-content-error" class="mt-1 text-sm text-error-500" data-testid="post-create-content-input-error">
          {{ validationErrors.content }}
        </p>
      </div>

      <!-- カテゴリ選択ドロップダウン -->
      <div>
        <label for="post-category" class="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
        <select
          id="post-category"
          v-model="selectedCategoryId"
          required
          data-testid="post-create-category-select"
          class="block w-full px-3 py-2 mt-1 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent sm:text-sm bg-primary-300 text-gray-900"
          :class="{ 'border-error-500 focus:ring-error-500': validationErrors.category }"
          aria-describedby="post-category-error"
          :disabled="loadingCategories"
        >
          <!-- カテゴリ読み込み中または未選択時の表示 -->
          <option value="" disabled>{{ loadingCategories ? '読み込み中...' : 'カテゴリを選択' }}</option>
          <!-- 取得したカテゴリリストをオプションとして表示 -->
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <!-- カテゴリ選択エラーメッセージ -->
        <p v-if="validationErrors.category" id="post-category-error" class="mt-1 text-sm text-error-500" data-testid="post-create-category-input-error">
          {{ validationErrors.category }}
        </p>
      </div>

      <!-- フォーム送信時のエラーメッセージ表示エリア -->
      <p v-if="submitError" class="text-sm text-error-500 p-3 bg-error-100 rounded-md" data-testid="post-create-submit-error">
        {{ submitError }}
      </p>

      <!-- ボタン配置エリア (右寄せ) -->
      <div class="flex justify-end space-x-4">
        <!-- キャンセルボタン -->
        <button
          type="button"
          @click="handleCancel"
          data-testid="post-create-cancel-button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          :disabled="isSubmitting"
        >
          キャンセル
        </button>
        <!-- 投稿作成（送信）ボタン -->
        <button
          type="submit"
          :disabled="isSubmitting || loadingCategories"
          data-testid="post-create-submit-button"
          class="px-4 py-2 text-sm font-medium text-primary-100 bg-secondary-500 rounded-md shadow-sm hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:bg-gray-500 disabled:text-gray-700 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          <!-- 送信中またはカテゴリ読み込み中はラベルを変更 -->
          {{ isSubmitting || loadingCategories ? '作成中...' : '投稿を作成' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// Vue Composition API と関連ライブラリをインポート
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseClient, useSupabaseUser, useHead } from '#imports';
// Supabase の PostgrestError 型をインポート
import { type PostgrestError } from '@supabase/supabase-js';
// データベースと共通の型定義をインポート
import type { Database, Tables } from '~/types/database';
import type { User } from '@supabase/supabase-js';
// UUID生成ライブラリをインポート
import { v4 as uuidv4 } from 'uuid';

// ★ Helper function to safely call exposed function ★
// Playwrightテスト環境のブラウザコンソールにログを出力するためのヘルパー関数
const logToPlaywright = (...args: any[]) => {
  // ブラウザ環境で、かつ `logFromBrowser` 関数が expose されている場合のみ実行
  if (typeof window !== 'undefined' && (window as any).logFromBrowser) {
    (window as any).logFromBrowser(...args);
  } else {
    // 通常の開発環境など、関数が expose されていない場合は通常の console.log を使用
    // console.log(...args); // 通常開発時のログは基本的に不要なためコメントアウト
  }
};

// ★ Linter Fix: ドロップダウン用のカテゴリ型を定義 ★
// カテゴリ選択ドロップダウン用の型定義
interface CategorySelectItem {
  id: number;
  name: string;
}

// Category 型エイリアスは不要になるため削除
// type Category = Database['public']['Tables']['categories']['Row'];

// --- Composition API による状態管理 ---
// Supabase クライアントインスタンスを取得
const supabase = useSupabaseClient();
// 現在の認証済みユーザー情報を取得
const user = useSupabaseUser();
// Vue Router インスタンスを取得
const router = useRouter();

// ページタイトルを設定 (useHead)
useHead({
  title: '新規投稿作成'
});

// --- リアクティブ変数定義 ---
// 投稿タイトル (v-model で input にバインド)
const title = ref('');
// 投稿内容 (v-model で textarea にバインド)
const content = ref('');
// 選択されたカテゴリのID (v-model で select にバインド、未選択時は '')
const selectedCategoryId = ref<number | ''>('');
// カテゴリ選択肢リスト (APIから取得)
const categories = ref<CategorySelectItem[]>([]);
// カテゴリ読み込み中状態フラグ
const loadingCategories = ref(true);
// フォームのバリデーションエラーメッセージを保持するオブジェクト
const validationErrors = ref<{ title?: string; content?: string; category?: string }>({});
// フォーム送信中の状態フラグ
const isSubmitting = ref(false);
// フォーム送信時に発生したエラーメッセージ
const submitError = ref<string | null>(null);

// --- データ取得関数 ---
// カテゴリリストを Supabase から取得する非同期関数
const fetchCategories = async () => {
  // [PWテスト用ログ] カテゴリ取得開始
  logToPlaywright('[fetchCategories] PW LOG: Fetching categories...');
  loadingCategories.value = true; // ローディング開始
  validationErrors.value.category = undefined; // 既存のカテゴリ関連エラーをクリア
  // Supabaseクライアントが利用可能かチェック
  if (!supabase) {
    // [PWテスト用エラーログ] Supabaseクライアントが見つからない
    logToPlaywright('[fetchCategories] PW ERROR: Supabase client is not available.');
    submitError.value = 'カテゴリの読み込みに失敗しました。'; // ユーザー向けエラー表示
    loadingCategories.value = false; // ローディング終了
    return; // 処理中断
  }
  try {
    // Supabase からカテゴリのIDと名前を取得 (名前順でソート)
    const { data, error } = await supabase.from('categories').select('id, name').order('name');
    // データ取得中にエラーが発生した場合
    if (error) {
      // [PWテスト用エラーログ] カテゴリ取得エラー詳細
      logToPlaywright('[fetchCategories] PW ERROR: Error fetching categories:', error);
      throw new Error(error.message); // エラーをスローして catch ブロックへ
    }
    // 取得したデータを categories ref にセット (データがない場合は空配列)
    categories.value = data || [];
    // [PWテスト用ログ] 取得したカテゴリ数をログ出力
    logToPlaywright(`[fetchCategories] PW LOG: Fetched ${categories.value.length} categories.`);
  } catch (err: any) { // APIエラーまたはその他の例外をキャッチ
    // [PWテスト用エラーログ] カテゴリ取得中の例外詳細
    logToPlaywright('[fetchCategories] PW ERROR: Exception fetching categories:', err);
    // ユーザー向けエラーメッセージを設定
    submitError.value = `カテゴリの読み込みに失敗しました: ${err.message || '不明なエラー'}`;
  } finally {
    loadingCategories.value = false; // ローディング終了 (成功・失敗問わず)
  }
};

// --- ライフサイクルフック ---
// コンポーネントがマウントされた後にカテゴリを取得
onMounted(() => {
  fetchCategories();
});

// --- フォーム処理関数 ---
// フォーム入力値を検証する関数
const validateForm = (): boolean => {
  // [PWテスト用ログ] バリデーション開始
  logToPlaywright('[validateForm] PW LOG: Validating form...');
  validationErrors.value = {}; // 既存のエラーをリセット
  let isValid = true; // 検証結果フラグ

  // タイトルが空かチェック
  if (!title.value.trim()) {
    validationErrors.value.title = 'タイトルは必須です';
    isValid = false;
    // [PWテスト用ログ] タイトルバリデーション失敗
    logToPlaywright(`[validateForm] PW LOG: Title validation failed: '${title.value}'`);
  }
  // 内容が空かチェック (TipTap導入後はチェックロジックが変わる可能性あり)
  if (!content.value.trim()) {
    validationErrors.value.content = '内容は必須です';
    isValid = false;
    // [PWテスト用ログ] 内容バリデーション失敗
    logToPlaywright(`[validateForm] PW LOG: Content validation failed: '${content.value}'`);
  }
  // カテゴリが選択されているかチェック
  if (selectedCategoryId.value === '') {
    validationErrors.value.category = 'カテゴリは必須です';
    isValid = false;
    // [PWテスト用ログ] カテゴリバリデーション失敗
    logToPlaywright(`[validateForm] PW LOG: Category validation failed: '${selectedCategoryId.value}'`);
  }

  // [PWテスト用ログ] 最終的なバリデーション結果
  logToPlaywright(`[validateForm] PW LOG: Final validation result: ${isValid}`);
  return isValid; // 検証結果を返す (true: 有効, false: 無効)
};

// 投稿を作成する非同期関数 (フォームの submit イベントで呼ばれる)
const createPost = async () => {
  // [PWテスト用ログ] 投稿作成処理開始
  logToPlaywright('[createPost] PW LOG: Starting post creation process...');
  submitError.value = null; // 既存のエラーをクリア

  // まずフォームのバリデーションを実行
  if (!validateForm()) {
    // [PWテスト用ログ] バリデーション失敗により処理中断
    logToPlaywright('[createPost] PW LOG: Validation failed, aborting creation.');
    submitError.value = '入力内容を確認してください。'; // ユーザー向けエラー表示
    return; // バリデーションエラーがあれば処理中断
  }

  // ユーザーが認証されているか、またはクライアントが利用可能か最終確認
  if (!user.value || !supabase) {
    // [PWテスト用エラーログ] ユーザー未認証またはクライアント不在
    logToPlaywright('[createPost] PW ERROR: User not authenticated or supabase client not available.');
    submitError.value = 'ユーザー情報が見つからないか、接続に問題があります。';
    return; // 処理中断
  }

  isSubmitting.value = true; // 送信中フラグを立てる

  // APIに送信するデータを作成
  const postPayload = {
    title: title.value,
    content: content.value,
    categoryIds: selectedCategoryId.value !== '' ? [selectedCategoryId.value] : [],
    published: true,
  };

  // [PWテスト用ログ] APIに送信するペイロード
  logToPlaywright('[createPost] PW LOG: Sending payload to API:', postPayload);

  try {
    // $fetch を使用してサーバーAPI (/api/posts/create) を呼び出す
    // [理由] Nuxt 3 推奨のデータ取得/送信方法であり、サーバー/クライアントサイドでの一貫したAPI呼び出しを実現するため。
    const newPost = await $fetch('/api/posts/create', {
      method: 'POST', // HTTPメソッドを POST に指定
      body: postPayload, // リクエストボディに投稿データを設定
    });

    // [PWテスト用ログ] API成功レスポンス
    logToPlaywright('[createPost] PW LOG: API call successful, response:', newPost);

    // API呼び出し成功後、作成された投稿の詳細ページに遷移
    // [理由] 投稿作成が完了したことをユーザーに示し、作成結果を確認できるようにするため。
    // レスポンスに投稿IDが含まれていることを期待 (API側の実装による)
    if (newPost && newPost.id) {
      // [PWテスト用ログ] 投稿詳細ページへ遷移
      logToPlaywright(`[createPost] PW LOG: Navigating to post detail page: /posts/${newPost.id}`);
      await router.push(`/posts/${newPost.id}`);
    } else {
      // [PWテスト用エラーログ] レスポンスに投稿IDが見つからない
      logToPlaywright('[createPost] PW ERROR: Post ID not found in API response:', newPost);
      throw new Error('作成された投稿のIDが見つかりませんでした。');
    }

  } catch (err: any) { // $fetch エラーまたはその他の例外をキャッチ
    // [PWテスト用エラーログ] API呼び出しまたはその後の処理でエラー発生
    logToPlaywright('[createPost] PW ERROR: Error during API call or navigation:', err);
    // エラーオブジェクトからユーザー向けメッセージを取得 (APIからのエラーメッセージを優先)
    const errorMessage = err.data?.message || err.message || '投稿の作成中に不明なエラーが発生しました。';
    submitError.value = errorMessage;
    // [理由] ユーザーにAPIエラーまたは処理中のエラーが発生したことを通知するため。
  } finally {
    isSubmitting.value = false; // 送信中フラグを下ろす (成功・失敗問わず)
    // [PWテスト用ログ] 投稿作成処理終了
    logToPlaywright('[createPost] PW LOG: Post creation process finished.');
  }
};

// キャンセルボタンの処理
const handleCancel = () => {
  // [PWテスト用ログ] キャンセルボタンクリック
  logToPlaywright('[handleCancel] PW LOG: Cancel button clicked.');
  // 例: 前のページに戻るか、ホームページにリダイレクト
  router.back(); // または router.push('/') など
};

</script>

<style scoped>
/* 必要に応じてTailwind以外のカスタムスタイルをここに追加 */
</style>
