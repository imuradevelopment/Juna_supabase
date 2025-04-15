import { ref } from 'vue';
import { FunctionsHttpError } from '@supabase/functions-js';
import type { Result, EdgeFunctionErrorResponse } from '~/types/index';

/**
 * アカウントID関連のユーティリティ関数を提供する Composable
 * 主に Edge Function `login-with-account` を呼び出してアカウントIDからメールアドレスを取得する機能を提供します。
 */
export const useAccountUtils = () => {
  // Nuxt アプリケーションインスタンスから Supabase クライアントを取得
  const { $supabaseClient } = useNuxtApp();

  /**
   * 指定されたアカウントIDに対応するメールアドレスを取得します。
   * Supabase Edge Function `login-with-account` を呼び出します。
   *
   * @param accountId メールアドレスを取得したいアカウントID
   * @returns 成功した場合はメールアドレスを含む Result オブジェクト、失敗した場合はエラー情報を含む Result オブジェクト
   */
  const getEmailFromAccountId = async (accountId: string): Promise<Result<string, Error>> => {
    // Supabase クライアントが利用可能かチェック
    if (!$supabaseClient) {
      // クライアントがない場合はエラーを返す
      return { success: false, error: new Error('Supabase client is not available') };
    }

    try {
      // Supabase Edge Function `login-with-account` を呼び出す
      const { data: functionData, error: functionError } = await $supabaseClient.functions.invoke(
        'login-with-account', // 呼び出す Edge Function の名前
        // リクエストボディ: identifier としてアカウントIDを渡す
        { body: { identifier: accountId } }
      );

      // --- Edge Function 呼び出しエラー処理 --- 
      if (functionError) {
        // エラーログを出力 (functionErrorがErrorインスタンスでない場合も考慮)
        console.error('Edge function login-with-account error:', functionError instanceof Error ? functionError.stack || functionError.message : functionError);
        // デフォルトのエラーメッセージを設定
        let errorMessage = 'アカウントIDからのメールアドレス取得に失敗しました。';
        // エラーが FunctionsHttpError の場合、レスポンスボディから詳細なエラー情報を取得試行
        if (functionError instanceof FunctionsHttpError) {
          try {
            // レスポンスボディをJSONとしてパース
            const responseBody = await functionError.context.json() as EdgeFunctionErrorResponse;
            // エラーメッセージをレスポンスボディから取得、なければ元のエラーメッセージを使用
            errorMessage = responseBody?.error || (functionError instanceof Error ? functionError.message : String(functionError));
            // エラーコードが 'account_not_found' またはメッセージに特定文字列が含まれる場合
            if (responseBody?.errorCode === 'account_not_found' || errorMessage.includes('アカウントが見つかりません')) {
                // ユーザーに表示される可能性があるため、具体的なエラーメッセージを返す
                return { success: false, error: new Error('入力されたアカウントIDは見つかりません。') };
            }
          } catch(e) {
            // JSON パース失敗時のエラーログ
            console.error('Edge function のエラーレスポンスボディのパースに失敗しました:', e instanceof Error ? e.stack || e.message : e);
          }
        }
        // その他の Function エラーの場合、組み立てたエラーメッセージでエラーを返す
        return { success: false, error: new Error(errorMessage) };
      }

      // --- Edge Function 正常応答だが、期待するデータ形式でない場合 --- 
      if (!functionData?.success || !functionData?.email) {
          // Function からの応答が成功でない、または email が含まれていない場合
          const errMsg = functionData?.error || 'アカウントIDからメールアドレスを取得できませんでした。';
          // エラーログを出力 (受信データも併記)
          console.error('Edge function が予期しない成功レスポンスまたはメールアドレスなしを返しました:', errMsg, '受信データ:', functionData);
          // エラーを返す
          return { success: false, error: new Error(errMsg) };
      }

      // --- 正常処理完了 --- 
      // 成功した場合は、取得したメールアドレスを返す
      return { success: true, data: functionData.email };

    // --- 包括的なエラーハンドリング --- 
    } catch (err) {
        // invoke 自体が例外をスローした場合 (ネットワークエラーなど)
        const error = err instanceof Error ? err : new Error(String(err));
        // エラーログを出力
        console.error('login-with-account function の呼び出し中にエラーが発生しました:', error.stack || error.message);
        // ユーザー向けの汎用的なエラーメッセージを返す
        return { success: false, error: new Error('メールアドレスの取得中に予期せぬエラーが発生しました。') };
    }
  };

  // composable として関数を返す
  return {
    getEmailFromAccountId,
  };
}; 