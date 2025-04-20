import type { Result, EdgeFunctionErrorResponse } from '~/types/index';
import { FunctionsHttpError } from '@supabase/functions-js';
// 変更: 新しい Client Composable をインポート
import { useSupabaseClient } from '~/composables/useSupabaseClient';

/**
 * アカウントID関連のユーティリティ関数を提供する Composable
 * 主に Edge Function `login-with-account` を呼び出してアカウントIDからメールアドレスを取得する機能を提供します。
 */
export const useAccountUtils = () => {
  // 変更: 新しい useSupabaseClient を使用
  const supabase = useSupabaseClient();

  /**
   * 指定されたアカウントIDに対応するメールアドレスを取得します。
   * Supabase Edge Function `login-with-account` を呼び出します。
   *
   * @param accountId メールアドレスを取得したいアカウントID
   * @returns 成功した場合はメールアドレスを含む Result オブジェクト、失敗した場合はエラー情報を含む Result オブジェクト
   */
  const getEmailFromAccountId = async (accountId: string): Promise<Result<string, Error>> => {
    // 変更: クライアントの存在チェックを更新
    if (!supabase) {
      const error = new Error('Supabase client is not available');
      console.error('Supabase クライアントが利用できません:', error.stack || error);
      return { success: false, error: new Error('サーバーに接続できません。') };
    }

    try {
      // `login-with-account` Edge Function を呼び出す
      // ジェネリクスでレスポンスの期待される型を指定
      const { data, error: functionError } = await supabase.functions.invoke<{ success: boolean, email?: string, error?: string, errorCode?: string }>('login-with-account', {
        body: { identifier: accountId }, // リクエストボディに関数が必要とする identifier (アカウントID) を設定
      });

      if (functionError) {
        let errorMessage = 'アカウントIDからメールアドレスを取得できませんでした。';
        if (functionError instanceof FunctionsHttpError) {
          try {
            const responseBody = await functionError.context.json() as EdgeFunctionErrorResponse;
            if (responseBody && responseBody.error) {
                errorMessage = responseBody.error;
            }
          } catch (jsonError) {
            console.error('[useAccountUtils] Failed to parse FunctionsHttpError response body:', jsonError instanceof Error ? jsonError.stack || jsonError : jsonError);
          }
        }
        console.error('login-with-account function error:', functionError.stack || functionError);
        return { success: false, error: new Error(errorMessage) };
      }
      
      if (!data || typeof data !== 'object' || typeof data.success !== 'boolean') {
        const err = new Error('Edge function から予期しない形式の応答がありました。');
        console.error('Invalid response format from Edge function:', err.stack || err, 'Received data:', data);
        return { success: false, error: err };
      }

      if (!data.success || !data.email) {
        const errorMsg = data.error || 'アカウントIDに紐づくメールアドレスが見つかりませんでした。';
        console.error('Edge function failed to find email:', errorMsg, 'Received data:', data);
        return { success: false, error: new Error(errorMsg) };
      }

      return { success: true, data: data.email };

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error invoking login-with-account function:', error.stack || error);
      return { success: false, error: new Error('メールアドレスの取得中にエラーが発生しました。') };
    }
  };

  // composable として関数を返す
  return {
    getEmailFromAccountId, // アカウントIDからメールアドレスを取得する非同期関数
  };
}; 