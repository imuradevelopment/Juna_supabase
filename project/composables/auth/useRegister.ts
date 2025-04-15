// Vue の ref 関数をインポート (リアクティブな状態管理のため)
import { ref } from 'vue'
// データベースの型定義をインポート
import type { Database } from '~/types/database'
// Supabase Functions からのエラー型をインポート
import { FunctionsHttpError } from '@supabase/functions-js' 
// プロジェクト共通の型定義 (Result型, EdgeFunctionErrorResponse型) をインポート
import type { Result, EdgeFunctionErrorResponse } from '~/types/index'

// profiles テーブルへの挿入データの型を取得
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
// 登録時に必要なユーザーデータの型を定義 ('id' を除外し、email と password を追加)
type RegisterUserData = Omit<ProfileInsert, 'id'> & { email: string; password: string }

// 登録成功時に返すデータの型
interface RegisterSuccessData {
  id: string; // 登録されたユーザーのID
  email: string; // 登録されたユーザーのメールアドレス
}

// 登録処理中に発生する可能性のあるエラーの型
type RegisterError = { 
  type: 'validation'; // バリデーションエラーの場合
  errors: { [key: string]: string }; // 各フィールドのエラーメッセージ
} | { 
  type: 'general'; // その他の一般的なエラーの場合
  error: Error; // JavaScript の Error オブジェクト
};

// useRegister composable 関数をエクスポート
export const useRegister = () => {
  // Nuxt アプリケーションインスタンスから Supabase クライアントを取得
  const { $supabaseClient } = useNuxtApp()
  // 処理中かどうかを示すリアクティブな参照
  const loading = ref(false)
  // error と validationErrors は composable の外部には公開せず、
  // registerUser 関数の戻り値 (Result 型) でエラー情報を返すように変更

  // ユーザー登録を行う非同期関数
  const registerUser = async (userData: RegisterUserData): Promise<Result<RegisterSuccessData, RegisterError>> => {
    // ローディング状態を開始
    loading.value = true

    // Supabase クライアントが利用可能かチェック
    if (!$supabaseClient) {
      // 利用できない場合はエラーを作成
      const err = new Error('Supabase client is not available')
      // エラーをコンソールに出力 (スタックトレースを含む)
      console.error('Supabase クライアントが利用できません:', err.stack || err);
      // ローディング状態を終了
      loading.value = false
      // ユーザー向けの汎用エラーメッセージを含む Result オブジェクトを返す
      return { success: false, error: { type: 'general', error: new Error('サーバーに接続できません。') } } 
    }

    try {
      // Edge Function 'register-user' を呼び出し
      const { data, error: functionError } = await $supabaseClient.functions.invoke('register-user', {
        // リクエストボディにユーザーデータを設定
        body: {
          email: userData.email,
          password: userData.password,
          nickname: userData.nickname,
          accountId: userData.account_id
        }
      })

      // Edge Function 呼び出しでエラーが発生した場合
      if (functionError) {
        // 処理済みエラーを格納する変数
        let handledError: RegisterError | null = null;

        // エラーが FunctionsHttpError のインスタンスか確認
        if (functionError instanceof FunctionsHttpError) {
          try {
            // エラーレスポンスのボディを JSON として解析
            const responseBody = await functionError.context.json() as EdgeFunctionErrorResponse;
            
            // レスポンスボディが期待するエラー形式か確認
            if (responseBody && responseBody.success === false && responseBody.errorCode) {
              // バリデーションエラーを格納するオブジェクト
              const validationErrors: { [key: string]: string } = {};
              // バリデーションエラーかどうかを示すフラグ
              let isValidationError = false;
              // エラーコードに基づいて処理を分岐
              switch (responseBody.errorCode) {
                // アカウントID重複の場合
                case 'account_id_exists':
                  validationErrors.accountId = responseBody.error || 'このアカウントIDは既に使用されています。';
                  isValidationError = true;
                  break;
                // メールアドレス重複の場合
                case 'email_exists':
                  validationErrors.email = responseBody.error || 'このメールアドレスは既に使用されています。';
                  isValidationError = true;
                  break;
                // その他のエラーコードの場合
                default:
                  // 汎用エラーとして処理
                  handledError = { type: 'general', error: new Error(responseBody.error || `登録エラー: ${functionError.message}`) };
                  // 未処理のエラーコードをコンソールに出力
                  console.error(`未ハンドルの Edge function errorCode: ${responseBody.errorCode}`, functionError.stack || functionError);
                  break; 
              }
              // バリデーションエラーが特定された場合
              if (isValidationError) {
                // バリデーションエラーとして設定
                handledError = { type: 'validation', errors: validationErrors };
                // バリデーションエラーの場合もコンソールに元のエラー情報を出力
                console.error('Edge Function からのバリデーションエラー:', functionError.stack || functionError, 'レスポンスボディ:', responseBody);
              }
            } else {
                 // errorCode がない、または期待する形式でない場合は汎用エラー
                 handledError = { type: 'general', error: new Error(responseBody?.error || `登録エラー: ${functionError.message}`) };
            }
          } catch (jsonError) {
            // JSON 解析に失敗した場合も汎用エラー
            // エラーをコンソールに出力 (スタックトレースを含む)
            console.error('FunctionsHttpError のレスポンスボディのパースに失敗しました:', jsonError instanceof Error ? jsonError.stack || jsonError : jsonError);
            handledError = { type: 'general', error: new Error(`登録エラー: ${functionError.message}`) };
          }
        }
        
        // エラーが FunctionsHttpError でない場合、または上記で処理されなかった場合
        if (!handledError) {
            // 汎用エラーとして設定
            handledError = { type: 'general', error: new Error(`登録エラー: ${functionError.message}`) };
            // エラーをコンソールに出力 (スタックトレースを含む)
            console.error('未ハンドルの Edge function エラー:', functionError.stack || functionError);
        }

        // 失敗を示す Result オブジェクトを返す
        return { success: false, error: handledError };
      }

      // Edge Function 呼び出しは成功したが、レスポンスデータが期待通りでない場合
      if (!data || !data.success || !data.userId) {
         // エラーを作成
         const err = new Error('登録処理中に予期せぬ応答がありました。')
         // エラーと受信データをコンソールに出力
         console.error('Edge function から予期しない成功応答がありました:', err.stack || err, '受信データ:', data);
         // 失敗を示す Result オブジェクトを返す
         return { success: false, error: { type: 'general', error: err } };
      }

      // 正常に登録が完了した場合
      // 成功を示す Result オブジェクトを返す
      return { success: true, data: { id: data.userId, email: userData.email } };

    } catch (err) {
      // 予期せぬエラーが発生した場合 (Edge Function 呼び出し自体に失敗した場合など)
      // エラーオブジェクトを整形
      const errorObj = err instanceof Error ? err : new Error(String(err))
      // エラーをコンソールに出力 (スタックトレースを含む)
      console.error('登録処理中に予期せぬエラーが発生しました:', errorObj.stack || errorObj);
      // ユーザー向けの汎用エラーメッセージを含む Result オブジェクトを返す
      return { success: false, error: { type: 'general', error: new Error('登録処理中に予期せぬエラーが発生しました。') } } 
    } finally {
      // 処理が成功しようと失敗しようと、ローディング状態を終了
      loading.value = false
    }
  }

  // composable が公開する関数とリアクティブな参照を返す
  return {
    registerUser, // 登録を実行する関数
    loading,      // 処理中かどうかを示すフラグ
    // error と validationErrors は Result 型に含まれるため、ここでは返さない
  }
} 