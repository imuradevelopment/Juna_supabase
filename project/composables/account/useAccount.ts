import { ref, readonly } from 'vue';
// import { useSupabaseClient } from '@nuxtjs/supabase'; // 自動インポートに任せる
// import type { Database } from '~/types/database';
// import { useRouter } from 'vue-router'; // ルーターはここでは使わない
import { useSupabaseUser } from '#imports';
// ★ Result と DeletionError をインポート (Result の重複を削除) ★
import type { Result, DeletionError } from '~/types';
import { useSupabaseClient } from '~/composables/useSupabaseClient';
// FetchError 型をインポート
import { FetchError } from 'ofetch';

// Error を継承しないように変更
// interface DeletionError {
//   message: string;
//   code: 'unauthorized' | 'fetch_error_or_unexpected' | 'api_returned_failure';
// }

// ★ TempError を削除 ★
// type TempError = { message: string; code?: string };

/**
 * アカウント削除処理を提供する Composable。
 * 内部で /api/account/delete.delete API を呼び出す。
 */
export const useAccount = () => {
  const client = useSupabaseClient();
  const user = useSupabaseUser();
  // const router = useRouter(); // router は削除

  // ★ エラーの型を DeletionError に変更 ★
  const isLoading = ref(false);
  const error = ref<DeletionError | null>(null);

  /**
   * アカウント削除APIを呼び出します。
   * API成功後は、呼び出し元でログアウト処理とリダイレクトを行う必要があります。
   * @returns {Promise<Result<null, DeletionError>>}
   */
  const deleteAccount = async (): Promise<Result<null, DeletionError>> => {
    isLoading.value = true;
    error.value = null;

    if (!client) {
      // ★ エラーオブジェクトの型を DeletionError に変更 ★
      const err: DeletionError = {
        message: 'Supabase クライアントが初期化されていません。',
        code: 'supabase_client_not_initialized'
      };
      error.value = err;
      isLoading.value = false;
      // ★理由: Supabaseクライアントが利用できない状況（初期化失敗など）を記録するため。
      console.error('[useAccount] Error: Supabase client is not initialized.');
      return { success: false, error: err };
    }

    if (!user.value) {
      // ★ エラーオブジェクトの型を DeletionError に変更 ★
      const err: DeletionError = {
        message: 'ユーザーがログインしていません。',
        code: 'unauthorized'
      };
      error.value = err;
      isLoading.value = false;
      // ★理由: 未ログイン状態でアカウント削除が試みられた場合に、その状況を記録するため。
      console.error('[useAccount] Error: User not logged in before deleting account.');
      return { success: false, error: err };
    }

    const userId = user.value.id;
    // ★理由: どのアカウントIDに対して削除APIが呼び出されたかを追跡するため。
    console.log(`[useAccount] Calling delete API for user ID: ${userId}`);

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || !sessionData.session) {
        // ★ エラーメッセージのみでスロー (catch で DeletionError に変換) ★
        throw new Error('セッションの取得に失敗しました。');
      }
      const accessToken = sessionData.session.access_token;

      await $fetch<void>('/api/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      try {
        await client.auth.signOut();
      } catch (signOutError) {
        // ★理由: アカウント削除自体は成功したが、その後のログアウト処理でエラーが発生した場合の原因調査のため。
        console.error('[useAccount] Sign out after account deletion failed:', signOutError instanceof Error ? signOutError.stack || signOutError : signOutError);
      }

      isLoading.value = false;
      return { success: true, data: null };

    } catch (err) {
      let finalError: DeletionError;

      // err が FetchError のインスタンスか確認
      if (err instanceof FetchError) {
        // ★理由: $fetch がスローした FetchError の詳細 (ステータスコード、レスポンスボディ) をログに出力し、APIエラーの原因特定を助けるため。
        console.error('[useAccount] API call failed (FetchError):', { 
          message: err.message, 
          statusCode: err.statusCode, 
          statusMessage: err.statusMessage, 
          data: err.data, // API が返したレスポンスボディ (JSONなど)
          stack: err.stack 
        });

        // API が返したレスポンスボディ (err.data) にエラー情報が含まれるか確認
        const apiErrorData = err.data as Partial<DeletionError & { error?: string }>; // 型アサーション
        if (apiErrorData && (apiErrorData.code || apiErrorData.error)) {
          // API からの code または message があればそれを DeletionError として利用
          finalError = {
            message: apiErrorData.message || apiErrorData.error || 'APIからエラー応答がありましたが、詳細を取得できませんでした。', // message または error を優先
            code: apiErrorData.code || 'api_returned_failure' // code があればそれを使用
          };
        } else {
          // レスポンスボディに期待するエラー情報がない場合
          finalError = {
            message: `アカウント削除APIの呼び出しに失敗しました (HTTP ${err.statusCode || 'N/A'})。`, 
            code: 'api_returned_failure' 
          };
        }
      } else {
        // FetchError 以外の予期せぬエラー (セッション取得失敗など)
        const caughtError = err instanceof Error ? err : new Error(String(err));
        // ★理由: $fetch 以外の箇所 (セッション取得など) で予期せぬエラーが発生した場合の原因特定のため。
        console.error('[useAccount] Unexpected error during account deletion process:', caughtError.stack || caughtError);
        finalError = {
          message: caughtError.message || 'アカウント削除中に予期せぬエラーが発生しました。',
          code: 'fetch_error_or_unexpected'
        };
      }

      error.value = finalError;
      isLoading.value = false;
      return { success: false, error: finalError };
    }
  };

  return {
    deleteAccount,
    isLoading: readonly(isLoading),
    error: readonly(error),
  };
}; 