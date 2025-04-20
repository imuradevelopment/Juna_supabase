import { defineEventHandler, setResponseStatus } from 'h3'
import { createSupabaseServerClient } from '~/server/utils/supabaseServerClient'
// createSupabaseServiceRoleClient は不要になる
// import { createSupabaseServiceRoleClient } from '~/server/utils/supabaseServiceRole'
import type { Database } from '~/types/database'
// FunctionsHttpError 等をインポート (ApiError を削除)
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/functions-js'

// API の成功/失敗レスポンス型を定義
type AccountDeleteSuccessResponse = { success: true }
type AccountDeleteErrorResponse = {
  success: false;
  error: string;
  errorCode: string;
}

// Edge Function の期待されるレスポンス型
type DeleteUserFunctionResponse = 
  { success: true } | 
  { success: false; error?: string; errorCode?: string };

export default defineEventHandler(async (event): Promise<AccountDeleteSuccessResponse | AccountDeleteErrorResponse> => {
  // 1. 認証ユーザーの取得とセッション情報の取得
  const supabaseUserClient = createSupabaseServerClient(event)
  // `getUser()` ではなく `getSession()` でトークンを取得
  const { data: { session }, error: getSessionError } = await supabaseUserClient.auth.getSession()

  if (getSessionError || !session || !session.user) {
    // ★理由: ユーザー認証情報の取得に失敗した場合の原因調査のため
    console.error('アカウント削除API: ユーザーセッション取得エラー', getSessionError)
    setResponseStatus(event, 401) // Unauthorized
    return { success: false, error: '認証されていません。', errorCode: 'unauthorized' }
  }

  const userId = session.user.id
  const accessToken = session.access_token // Edge Function 呼び出しに必要な JWT

  // 2. Edge Function 'delete-user' の呼び出し
  try {
    // functions.invoke を使用して Edge Function を呼び出す
    const { data: functionData, error: functionError } = await supabaseUserClient.functions.invoke<DeleteUserFunctionResponse>('delete-user', {
      // メソッドを明示的に指定 (Edge Function が DELETE メソッドを想定している場合)
      // method: 'DELETE', // Edge Function の実装に合わせる必要あり。デフォルトはPOST。
      // Authorization ヘッダーを付与
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 必要であれば Content-Type を追加
        // 'Content-Type': 'application/json'
      },
      // リクエストボディに userId を含める (Edge Function の期待する形式に合わせる)
      body: { userId }
    })

    if (functionError) {
      // Deno 関数からのエラーレスポンスを解析
      let errorMessage = `Edge Function 呼び出しエラー: ${functionError.message}`
      let errorCode = 'invoke_function_failed'
      let statusCode = 500 // デフォルト

      // エラーの種類に応じて詳細情報を取得
      if (functionError instanceof FunctionsHttpError) {
        // HTTP エラーの場合、レスポンスボディを安全に解析
        try {
          const errorBody = await functionError.context.json();
          // Edge Function が返すエラー形式 { error: string, errorCode: string } を期待
          if (errorBody && typeof errorBody === 'object') {
            errorMessage = (typeof errorBody.error === 'string' ? errorBody.error : errorMessage);
            errorCode = (typeof errorBody.errorCode === 'string' ? errorBody.errorCode : errorCode);
            // context に status があればそれを使用
            if (typeof functionError.context.status === 'number') {
              statusCode = functionError.context.status;
            }
          }
        } catch (parseError) {
          console.error('Edge Function エラーボディの解析失敗:', parseError);
          // 解析失敗時は元のエラーメッセージを使用
        }
      } else if (functionError instanceof FunctionsRelayError) {
        errorMessage = 'Edge Function リレーエラー: ' + functionError.message;
        errorCode = 'invoke_relay_error';
      } else if (functionError instanceof FunctionsFetchError) {
        errorMessage = 'Edge Function フェッチエラー: ' + functionError.message;
        errorCode = 'invoke_fetch_error';
      } // ApiError は通常 functions-js からは直接スローされない

      // ★理由: delete-user Edge Function の呼び出し自体に失敗した場合の原因調査のため (ネットワーク、権限、Function内部エラーなど)
      console.error(`アカウント削除API: Edge Function エラー (userId: ${userId})`, functionError.stack || functionError)
      setResponseStatus(event, statusCode)
      return { success: false, error: errorMessage, errorCode }
    }

    // Edge Function が成功を返した場合
    // functionData の型ガードを追加
    if (functionData && typeof functionData === 'object') {
      if (functionData.success === true) {
        setResponseStatus(event, 200) // OK
        // クライアント側でのログアウト処理が必要な旨を再度強調
        return { success: true }
      } else if (functionData.success === false) {
        // Edge Function が明示的に失敗を返した
        const errorMessage = functionData.error || 'Edge Function が失敗を返しました。'
        const errorCode = functionData.errorCode || 'function_returned_failure'
        // ★理由: delete-user Edge Function は成功したが、処理結果として失敗が返された場合の原因調査のため
        console.error(`アカウント削除API: Edge Function が失敗応答 (userId: ${userId})`, functionData)
        setResponseStatus(event, 500) // または functionData 内のエラーコードに基づく
        return { success: false, error: errorMessage, errorCode }
      }
    } else {
      // functionData が予期せぬ形式だった場合
      const unexpectedErrorMsg = 'Edge Function から予期しない形式の応答がありました。'
      console.error(`アカウント削除API: 予期せぬ Function 応答 (userId: ${userId})`, functionData)
      setResponseStatus(event, 500)
      return { success: false, error: unexpectedErrorMsg, errorCode: 'unexpected_function_response' }
    }

  } catch (err) {
    // ★理由: この API ハンドラ内の try ブロックで捕捉されなかった JavaScript 例外の原因特定のため
    console.error(`アカウント削除API: 予期せぬ例外 (userId: ${userId})`, err instanceof Error ? err.stack || err : err)
    setResponseStatus(event, 500) // Internal Server Error
    return {
      success: false,
      error: `予期せぬサーバーエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
      errorCode: 'internal_server_error'
    }
  }
  // リンターエラー (TS2366) 回避のため、ここには到達しないはずだが念のためエラーをスロー
  // すべてのコードパスが値を返すことを TypeScript に明示する
  throw new Error('アカウント削除APIハンドラの予期せぬ終端');
}) 