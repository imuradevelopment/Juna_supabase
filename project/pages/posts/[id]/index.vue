<template>
  <!-- 投稿表示ページのルート要素 -->
  <div data-testid="post-view-page" class="max-w-3xl mx-auto p-6 bg-primary-300 shadow-lg rounded-lg">
    <!-- ローディング表示: loading ref が true の場合に表示 -->
    <div v-if="loading" data-testid="post-view-loading" class="text-center p-10">
      <p>読み込み中...</p>
      <!-- 必要であればスピナーアイコンなどを追加 -->
    </div>

    <!-- エラー表示: error ref に値がある場合に表示 -->
    <div v-else-if="error" class="text-error-500 p-6 border border-error-700 rounded-lg" data-testid="post-view-error">
      <h2 class="text-xl font-semibold mb-2">エラーが発生しました</h2>
      <p>投稿の読み込みに失敗しました。</p>
      <p class="text-sm mt-2">詳細: {{ error.message }}</p>
    </div>

    <!-- 投稿データ表示: post ref に値があり、loading と error が false の場合に表示 -->
    <div v-else-if="post">
      <!-- 投稿タイトル -->
      <h1 data-testid="post-view-title" class="text-3xl font-bold text-secondary-500 mb-4">{{ post.title }}</h1>
      <!-- 投稿内容 (displayContent computed プロパティから取得) -->
      <div data-testid="post-view-content" class="prose prose-invert max-w-none whitespace-pre-wrap mb-6">
        {{ displayContent }}
      </div>
      <!-- 投稿メタ情報 -->
      <div class="flex justify-between items-center text-sm text-gray-500 border-t border-gray-700 pt-4 mt-4">
        <p>公開日時: {{ post.published_at ? new Date(post.published_at).toLocaleString('ja-JP') : '未公開' }}</p>
        <p>作成日時: {{ new Date(post.created_at).toLocaleString('ja-JP') }}</p>
      </div>
      <!-- TODO: 著者情報、カテゴリ、コメント、いいねなどの表示エリア -->
      <div class="mt-8 border-t border-gray-700 pt-8">
        <h3 class="text-xl font-semibold text-secondary-300 mb-4">コメント・その他</h3>
        <p class="text-gray-500">(ここに著者情報、カテゴリ、コメント、いいね機能などが追加されます)</p>
      </div>
    </div>

    <!-- 投稿が見つからない場合: post ref が null で、loading と error が false の場合に表示 -->
    <div v-else data-testid="post-view-not-found" class="text-center p-10">
      <p>投稿が見つかりませんでした。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSupabaseClient, useHead } from '#imports';
import type { Database, Tables } from '~/types/database'; // Supabase データベースの型定義をインポート

// --- Playwright 連携用ヘルパー関数 ---
/**
 * ブラウザ環境から Playwright のテスト実行環境へログを送信する関数。
 * window オブジェクトに `logFromBrowser` 関数が公開されている場合 (Playwright テスト実行時) に呼び出す。
 * それ以外の場合はコンソールにフォールバックログを出力する。
 * @param args 送信するログメッセージ (可変長引数)
 */
const logToPlaywright = (...args: any[]) => {
  // ブラウザ環境で、かつ logFromBrowser 関数が存在する場合
  if (typeof window !== 'undefined' && (window as any).logFromBrowser) {
    (window as any).logFromBrowser(...args); // Playwright へログを送信
  } else {
    // Playwright 環境外 (通常のブラウザ開発時など) のためのフォールバック
    console.log('[Fallback Log]', ...args); // 通常のコンソールに出力
  }
};

// ★★★ PW LOG: <script setup> 開始ログ (理由: Playwright テストでのコンポーネント初期化タイミング確認用) ★★★
logToPlaywright('[PostView] PW LOG: <script setup> 開始');

// --- 型定義 ---
// `posts` テーブルの行データの型エイリアスを定義
type Post = Tables<'posts'>;

// --- リアクティブ変数と定数 ---
const route = useRoute();
const supabase = useSupabaseClient();
const postId = route.params.id as string; // ルートパラメータから投稿IDを取得 (string 型であることを明示)

const post = ref<Post | null>(null);
const loading = ref(true);
const error = ref<Error | null>(null);

// --- Computed プロパティ ---
/**
 * 表示用の投稿内容を計算する Computed プロパティ。
 * `post.content` が文字列であればそれを返し、それ以外 (JSON等) の場合は代替テキストを返す。
 */
const displayContent = computed(() => {
  if (post.value && typeof post.value.content === 'string') {
    // @ts-ignore 型のインスタンス化が深すぎるエラーを抑制 (本来はスキーマと型の整合性を取るべき)
    return post.value.content;
  }
  // プレーンテキストが期待されるが、もしJSON等が来た場合や post が null の場合のフォールバック
  return '内容の表示に問題があります。';
});

// --- データ取得関数 ---
/**
 * Supabase から指定された ID の投稿データを非同期で取得する関数。
 * 取得状態に応じて loading, error, post の ref を更新する。
 */
const fetchPost = async () => {
  // ★★★ PW LOG: fetchPost 関数開始ログ (理由: Playwright テストでのデータ取得開始タイミング確認用) ★★★
  logToPlaywright('[PostView] PW LOG: fetchPost 関数開始');

  loading.value = true;
  error.value = null;
  post.value = null;

  // ★★★ PW LOG: 投稿IDログ (理由: Playwright テストでどの投稿を取得しようとしているか確認用) ★★★
  logToPlaywright(`[PostView] PW LOG: Fetching post with ID: ${postId}`);

  // Supabase クライアントが初期化されていない場合のエラーハンドリング
  if (!supabase) {
    // ★★★ PW LOG: Supabase クライアント未初期化エラーログ (理由: Playwright テストでのエラー原因特定用) ★★★
    logToPlaywright('[PostView] PW ERROR: Supabase client is not initialized.');
    error.value = new Error('データベース接続エラー');
    loading.value = false;
    useHead({ title: 'エラー' });
    return;
  }

  try {
    const { data, error: dbError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle<Post>();

    if (dbError) {
      // ★★★ PW LOG: DB エラーログ (理由: Playwright テストでの DB エラー詳細確認用) ★★★
      logToPlaywright('[PostView] PW ERROR: Error fetching post:', dbError);
      throw dbError;
    }

    if (data) {
      // ★★★ PW LOG: データ取得成功ログ (理由: Playwright テストでのデータ取得成功確認用) ★★★
      logToPlaywright('[PostView] PW LOG: Post data fetched successfully:', data.title);
      post.value = data;
    } else {
      // データが見つからなかった場合 (エラーではない)
      // ★★★ PW LOG: 投稿未発見警告ログ (理由: Playwright テストで投稿が存在しないケースの確認用) ★★★
      logToPlaywright(`[PostView] PW WARN: Post with ID ${postId} not found.`);
    }
  } catch (err: any) {
    // その他の予期せぬエラーが発生した場合
    // ★★★ PW LOG: 例外エラーログ (理由: Playwright テストでの予期せぬエラー確認用) ★★★
    logToPlaywright('[PostView] PW ERROR: Exception fetching post:', err);
    error.value = err instanceof Error ? err : new Error(String(err.message || '不明なエラー'));
  } finally {
    loading.value = false;
    if (post.value) {
      useHead({
        title: post.value.title
      });
    } else if (!error.value) {
      useHead({
        title: '投稿が見つかりません'
      });
    } else {
      useHead({
        title: 'エラー'
      });
    }
  }
};

// --- ライフサイクルフック ---
// コンポーネントがマウントされた後に実行
onMounted(() => {
  // ★★★ PW LOG: onMounted 開始ログ (理由: Playwright テストでのマウントタイミング確認用) ★★★
  logToPlaywright('[PostView] PW LOG: onMounted フック開始');
  fetchPost();
});

// --- 初期 Head 設定 ---
// データ取得前に表示される可能性のある初期タイトルを設定
useHead({
  title: `投稿詳細 - ${postId}`
});
</script>

<style scoped>
/* Tailwind prose plugin 用のスタイル調整などが必要な場合 */
.prose pre {
  /* 必要に応じて pre タグのスタイルを調整 */
  color: #a4afb9; /* gray-900 */
}
</style> 