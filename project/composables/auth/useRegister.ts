// Vue の ref 関数をインポート (リアクティブな状態管理のため)
import { ref } from 'vue'
// データベースの型定義をインポート
import type { Database } from '~/types/database'
// Supabase Functions からのエラー型をインポート (HTTPエラーの詳細を取得するため)
import { FunctionsHttpError } from '@supabase/functions-js' 
// プロジェクト共通の型定義 (Result型, EdgeFunctionErrorResponse型) をインポート
import type { Result, EdgeFunctionErrorResponse } from '~/types/index'
// Supabase クライアントを取得するための Composables 関数をインポート
import { useSupabaseClient } from '~/composables/useSupabaseClient'

// プロフィール関連の型をインポート (Nullableな型のため)
import type { ProfileData } from '~/types'

// public.profiles テーブルへの挿入 (Insert) 時のデータ型を取得
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
// ユーザー登録時に API や関数に渡すデータの型を再定義
// Omit を使わず、必要なプロパティを明示的に列挙
type RegisterUserData = {
  email: string; // 必須
  password: string; // 必須
  nickname: string | null; // 必須 (空文字列ではなくnullを許容する可能性を考慮)
  account_id: string | null; // 必須 (空文字列ではなくnullを許容する可能性を考慮)
  // ProfileInsert から bio, avatar_data は除外
  // created_at, updated_at はDB側で設定されるため不要
};

// ユーザー登録が成功した場合に registerUser 関数が返すデータの型
interface RegisterSuccessData { // 登録成功時に返すデータ型
  id: string; // 登録された Supabase Auth ユーザーのID
  email: string; // 登録されたユーザーのメールアドレス
}

// ユーザー登録処理中に発生する可能性のあるエラーの型を定義
type RegisterError = { // 登録失敗時に返すエラーの型
  type: 'validation'; // エラーの種類: バリデーションエラー (例: メールアドレス重複、アカウントID重複)
  errors: { [key: string]: string }; // 各フォームフィールド (key) に対するエラーメッセージ (value)。キーは 'email', 'accountId' など。
} | { 
  type: 'general'; // エラーの種類: その他の一般的なエラー (例: ネットワークエラー、サーバーエラー、予期せぬエラー)
  error: Error; // JavaScript の標準 Error オブジェクト (ユーザー向けのエラーメッセージを含む場合がある)
};

// 型ガード関数: オブジェクトが EdgeFunctionErrorResponse 型であるかを確認
function isEdgeFunctionErrorResponse(obj: unknown): obj is EdgeFunctionErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj && obj.success === false && // success が false であること
    'error' in obj && typeof obj.error === 'string' && // error が文字列であること
    ('errorCode' in obj && typeof obj.errorCode === 'string' || !('errorCode' in obj)) // errorCode は文字列または存在しない
  );
}

// ユーザー登録関連のロジックと状態を提供する Composable 関数
export const useRegister = () => {
  
  // useSupabaseClient Composable を呼び出して Supabase クライアントインスタンスを取得
  // クライアントはシングルトンとして管理されるため、コンポーネント間で共通のインスタンスを使用
  const supabase = useSupabaseClient() 
  // 登録処理が実行中かどうかを示すリアクティブな参照 (UI のローディング表示などに使用)
  const loading = ref(false)
  // ★ エラー状態は registerUser 関数の戻り値 (Result 型) で管理する方式に変更。
  //    これにより、エラー処理の責務が呼び出し元に移譲され、Composable は状態提供に集中できる。

  // ユーザー登録処理を実行する非同期関数
  // userData: ユーザーがフォームに入力したデータ (RegisterUserData 型)
  // 戻り値: 処理結果を示す Result オブジェクト (成功時は RegisterSuccessData, 失敗時は RegisterError を含む)
  const registerUser = async (userData: RegisterUserData): Promise<Result<RegisterSuccessData, RegisterError>> => {
    // 登録処理の開始を示すため、loading 状態を true に設定
    loading.value = true

    // Supabase クライアントが利用可能か確認 (初期化失敗などを考慮)
    if (!supabase) {
      // クライアントが利用できない場合は、深刻な設定エラーとして処理
      const err = new Error('Supabase client is not available')
      // ★ 開発者向けログ: クライアント初期化失敗はアプリケーションの動作に必須なため、エラーログとして記録
      console.error('Supabase クライアントが利用できません:', err.stack || err); // ★理由: Supabaseクライアントの初期化失敗は致命的な問題であるため、開発者向けにエラー詳細を記録する。
      // loading 状態を false に戻す
      loading.value = false
      // ユーザー向けの汎用的な接続エラーメッセージを含む失敗 Result オブジェクトを返す
      return { success: false, error: { type: 'general', error: new Error('サーバーに接続できません。') } } 
    }

    try {
      // invoke のジェネリクスを修正: 成功時は userId が必須
      const { data, error: functionError } = await supabase.functions.invoke<{
        success: true, userId: string // 成功時は userId が必須
      } | {
        success: false, error?: string, errorCode?: string // 失敗時はオプショナル
      }>('register-user', {
        body: {
          email: userData.email,
          password: userData.password,
          nickname: userData.nickname,
          accountId: userData.account_id
        }
      })

      if (functionError) {
        let handledError: RegisterError | null = null;

        if (functionError instanceof FunctionsHttpError) {
          try {
            // レスポンスボディを解析
            const responseBody = await functionError.context.json();

            // 型ガードを使用してレスポンスボディを検証
            if (isEdgeFunctionErrorResponse(responseBody)) {
              const validationErrors: { [key: string]: string } = {};
              let isValidationError = false;
              // responseBody.errorCode は型ガードにより string | undefined になっている
              switch (responseBody.errorCode) {
                case 'account_id_exists':
                  validationErrors.accountId = responseBody.error || 'このアカウントIDは既に使用されています。';
                  isValidationError = true;
                  break;
                case 'email_exists':
                  validationErrors.email = responseBody.error || 'このメールアドレスは既に使用されています。';
                  isValidationError = true;
                  break;
                default:
                  handledError = { type: 'general', error: new Error(responseBody.error || `登録エラーが発生しました。(${functionError.message})`) };
                  console.error(`未ハンドルの Edge function errorCode: ${responseBody.errorCode}`, functionError.stack || functionError);
                  break;
              }
              if (isValidationError) {
                handledError = { type: 'validation', errors: validationErrors };
                console.error('Edge Function からのバリデーションエラー:', functionError.stack || functionError, 'レスポンスボディ:', responseBody);
              }
            } else {
                 // isEdgeFunctionErrorResponse で false の場合
                 const errorMessage = (typeof responseBody === 'object' && responseBody !== null && 'error' in responseBody && typeof responseBody.error === 'string')
                                    ? responseBody.error
                                    : `登録エラーが発生しました。(${functionError.message})`;
                 handledError = { type: 'general', error: new Error(errorMessage) };
                 console.error('Edge Function から期待しない形式のエラーレスポンス:', functionError.stack || functionError, 'レスポンスボディ:', responseBody);
            }
          } catch (jsonError) {
            const errorObj = jsonError instanceof Error ? jsonError : new Error(String(jsonError));
            console.error('[useRegister] FunctionsHttpError のレスポンスボディ解析に失敗しました:', errorObj.stack || errorObj);
            handledError = { type: 'general', error: new Error(`登録エラーが発生しました。(${functionError.message})`) };
          }
        }

        if (!handledError) {
            const errorObj = functionError instanceof Error ? functionError : new Error(String(functionError));
            handledError = { type: 'general', error: new Error(`登録エラーが発生しました。(${errorObj.message})`) };
            console.error('[useRegister] 未処理の Edge function エラー:', errorObj.stack || errorObj);
        }

        loading.value = false
        return { success: false, error: handledError };
      }

      // data の形式チェックを修正 (成功時は userId が必須であることを利用)
      if (!data || typeof data !== 'object') {
        const err = new Error('Edge function から予期しない形式の応答がありました。');
        console.error('Edge function からの不正なレスポンス形式:', err.stack || err, '受信データ:', data);
        loading.value = false
        return { success: false, error: { type: 'general', error: err } };
      }

      // Edge Function が成功 (success: true) し、userId が存在する場合
      if (data.success === true && data.userId) {
        return { success: true, data: { id: data.userId, email: userData.email } };
      }

      // Edge Function が失敗 (success: false) を返した場合
      if (data.success === false) {
         const err = new Error(data.error || '登録処理中に予期せぬ応答がありました。')
         console.error('Edge function から失敗応答がありました:', err.stack || err, '受信データ:', data);
         // ★ errorCode を利用したエラー種別の判断を追加
         if (data.errorCode === 'account_id_exists' || data.errorCode === 'email_exists') {
           const validationErrors: { [key: string]: string } = {};
           if (data.errorCode === 'account_id_exists') {
             validationErrors.accountId = data.error || 'このアカウントIDは既に使用されています。';
           } else {
             validationErrors.email = data.error || 'このメールアドレスは既に使用されています。';
           }
           loading.value = false;
           return { success: false, error: { type: 'validation', errors: validationErrors } };
         } else {
           loading.value = false;
           return { success: false, error: { type: 'general', error: err } };
         }
      }

      // 上記のいずれにも当てはまらない場合 (予期せぬ形式など)
      const unexpectedErr = new Error('Edge function から成功も失敗も判断できない応答がありました。')
      console.error('Edge functionからの不明な応答形式:', unexpectedErr.stack || unexpectedErr, '受信データ:', data);
      loading.value = false
      return { success: false, error: { type: 'general', error: unexpectedErr } };

    } catch (err) {
      // try ブロック全体で予期しない Javascript エラーが発生した場合 (上記で捕捉されなかったエラー)
      // エラーオブジェクトを一貫して Error インスタンスとして扱うために正規化
      const errorObj = err instanceof Error ? err : new Error(String(err))
      // ★ 開発者向けログ: 予期せぬエラーは原因究明が必要なため、エラー詳細 (スタックトレース含む) を記録
      console.error('登録処理中に予期せぬエラーが発生しました:', errorObj.stack || errorObj); // ★理由: このComposable内のロジックで予期せぬ例外が発生した場合に、開発者がバグを特定するため。
      // loading 状態を false に戻す
      loading.value = false
      // ユーザー向けの汎用的なエラーメッセージを含む失敗 Result オブジェクトを返す
      return { success: false, error: { type: 'general', error: new Error('登録処理中に予期せぬエラーが発生しました。') } } 
    } finally {
      // try-catch ブロックの処理が成功しようが失敗しようが、必ず最後に実行されるブロック
      // 登録処理が完了したため、loading 状態を false に戻す
      loading.value = false
    }
  }

  // この Composable 関数 (useRegister) が外部に提供するものをオブジェクトとして返す
  return {
    registerUser, // ユーザー登録を実行する非同期関数
    loading // 登録処理中かどうかのリアクティブな状態
  }
} 