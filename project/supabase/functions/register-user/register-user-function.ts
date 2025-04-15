// Supabase Edge Function: ユーザー登録処理
// 入力されたメールアドレス、パスワード、ニックネーム、(任意)アカウントIDを使用して、
// Supabase Auth にユーザーを作成し、対応するプロフィールを public.profiles テーブルに挿入します。
// アカウントIDが指定されない場合は、ニックネームから生成します。
// アカウントIDとメールアドレスの重複チェックを行い、エラー発生時には適切なエラーコードと共にエラーレスポンスを返します。
// プロフィール作成に失敗した場合は、作成された Auth ユーザーをロールバック削除します。

// @ts-ignore
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// @ts-ignore
import { createClient, AuthApiError } from 'https://esm.sh/@supabase/supabase-js@2';

// types/index.ts と同じ型を定義 (Deno 環境なので import できないため)
interface EdgeFunctionErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}

// CORSヘッダー: 全てのオリジンからのアクセスを許可
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno Deploy でリクエストを処理するメイン関数
serve(async (req: Request) => {
  // CORSプリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // リクエストボディから必要な情報を抽出
    const { email, password, nickname, accountId } = await req.json();

    // 必須項目 (email, password, nickname) の存在チェック
    if (!email || !password || !nickname) {
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false,
        error: '必須項目が不足しています。',
        errorCode: 'missing_fields'
      };
      // 不足している場合は 400 Bad Request を返す
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase Adminクライアントの初期化 (Service Role Key を使用)
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '', // 環境変数からSupabase URLを取得
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // 環境変数からService Role Keyを取得
      { auth: { persistSession: false } } // サーバーサイドでのセッション永続化は不要
    );

    // アカウントIDの決定: 指定があればそれを使用、なければニックネームから生成
    const finalAccountId = accountId || generateAccountId(nickname);

    // --- 1. アカウントIDの重複チェック --- 
    // profiles テーブルで finalAccountId が既に存在するか確認
    const { data: existingProfile, error: checkProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id') // 存在確認のため id のみ取得
      .eq('account_id', finalAccountId) // 指定されたアカウントIDで検索
      .maybeSingle(); // 結果が0行または1行であることを期待

    // アカウントIDチェック時にDBエラーが発生した場合
    if (checkProfileError) {
        // エラーログを出力 (修正)
        console.error('アカウントIDチェックデータベースエラー:', checkProfileError.stack || checkProfileError);
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: 'アカウントIDの確認中にデータベースエラーが発生しました。',
          errorCode: 'db_check_error'
        };
        // 500 Internal Server Error を返す
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    // アカウントIDが既に存在する場合
    if (existingProfile) {
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false,
        error: 'このアカウントIDは既に使用されています。',
        errorCode: 'account_id_exists'
      };
      // 400 Bad Request を返す
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 2. Supabase Auth へのユーザー登録 --- 
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール認証を有効化 (後で変更可能)
    });

    // ユーザー登録時に認証エラーが発生した場合
    if (authError) {
      // エラーが AuthApiError のインスタンスか、またはメッセージに重複を示す文字列が含まれるかチェック
      // (Supabaseのバージョンや環境によってエラーオブジェクトの型が変わる可能性を考慮)
      if ((authError instanceof Error &&
           (authError.message.toLowerCase().includes('already registered') ||
            authError.message.toLowerCase().includes('already been registered'))) ||
           // 寛容なチェック: AuthApiError 型でなくても message で判断
           (typeof authError === 'object' && authError !== null && 'message' in authError && typeof authError.message === 'string' &&
            (authError.message.toLowerCase().includes('already registered') ||
             authError.message.toLowerCase().includes('already been registered'))))
         {
         // メールアドレス重複エラーの場合
         const errorResponse: EdgeFunctionErrorResponse = {
           success: false,
           error: 'このメールアドレスは既に使用されています。',
           errorCode: 'email_exists'
         };
         // 400 Bad Request を返す
         return new Response(
           JSON.stringify(errorResponse),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
      }

      // その他の認証エラーの場合
      console.error('Supabase auth admin createUser エラー:', authError.stack || authError);
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false,
        // authErrorがErrorインスタンスでない可能性も考慮
        error: `ユーザー認証情報の作成に失敗しました: ${(authError instanceof Error ? authError.message : String(authError)) || '不明な認証エラー'}`,
        errorCode: 'auth_creation_failed'
      };
      // 500 Internal Server Error を返す
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ユーザーデータが取得できなかった場合 (通常は起こらないはず)
    if (!authData || !authData.user) {
        console.error('作成後のユーザーデータの取得に失敗しました。');
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: 'ユーザー情報の取得に失敗しました。',
          errorCode: 'user_data_fetch_failed'
        };
        // 500 Internal Server Error を返す
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // --- 3. プロフィールテーブルへのデータ挿入 --- 
    const userId = authData.user.id; // 登録されたユーザーのIDを取得

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId, // AuthユーザーのIDと紐付ける
        nickname: nickname,
        account_id: finalAccountId, // 事前チェック済みのアカウントIDを使用
        // bio, avatar_data はデフォルトでNULL
        // created_at, updated_at はDBのデフォルト値を使用
      });

    // プロフィール挿入時にエラーが発生した場合
    if (profileError) {
        console.error('Supabase プロフィール挿入エラー:', profileError.stack || profileError);
        // --- ロールバック処理: 作成したAuthユーザーを削除 --- 
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (rollbackError) {
          // ロールバックエラーのログ出力 (仕様と型安全性を両立)
          const errorToLog = rollbackError instanceof Error ? rollbackError.stack || rollbackError : rollbackError;
          console.error(`Authユーザー ${userId.substring(0,8)}... のロールバックに失敗しました:`, errorToLog);
          // ロールバック失敗は致命的ではないため、ログに残して処理を続行
        }
        // --- ロールバック処理ここまで ---

        // エラーがアカウントID重複によるものか判定
        if (profileError.message.includes('duplicate key value violates unique constraint "profiles_account_id_key"')) {
            const errorResponse: EdgeFunctionErrorResponse = {
              success: false,
              error: 'このアカウントIDは既に使用されています。(DBエラー)',
              errorCode: 'account_id_exists' // 再度アカウントID重複エラーとして返す
            };
            // 400 Bad Request を返す (アカウントID重複はクライアント側の問題)
            return new Response(
              JSON.stringify(errorResponse),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        // その他のプロフィール作成エラー
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: `プロフィールの作成中にデータベースエラーが発生しました: ${profileError.message}`,
          errorCode: 'profile_creation_failed'
        };
        // 500 Internal Server Error を返す
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // --- 成功応答 --- 
    // 全ての処理が成功した場合
    const successResponse = {
      success: true,
      userId // 登録されたユーザーIDを返す
    };
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード 200 OK (デフォルト)
    );

  // --- 包括的なエラーハンドリング --- 
  } catch (error) {
    // 予期せぬエラーが発生した場合 (仕様と型安全性を両立)
    const errorToLog = error instanceof Error ? error.stack || error : error;
    console.error('register-user function 内で予期せぬエラー:', errorToLog);

    // エラーメッセージを組み立て (より安全な方法に変更)
    let errorMessage = '不明なエラーが発生しました。';
    let errorCode = 'internal_error';
    if (error instanceof Error) {
        // Error オブジェクトから message を取得
        errorMessage = error.message;
        // 特定のエラーコードを付与するロジックはここに記述可能
    } else if (typeof error === 'string') {
        // 文字列エラーの場合
        errorMessage = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // message プロパティを持つオブジェクトの場合 (より寛容なチェック)
        errorMessage = String(error.message);
    }

    const errorResponse: EdgeFunctionErrorResponse = {
      success: false,
      error: errorMessage,
      errorCode: errorCode
    };
    // 500 Internal Server Error を返す
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ヘルパー関数: ニックネームからアカウントIDを生成
function generateAccountId(name: string): string {
  // 1. 小文字に変換し、英数字以外を削除
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  // 2. ランダムな6文字のサフィックスを生成 (衝突回避のため)
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  // 3. ベース名とサフィックスを結合し、最大15文字に切り詰める
  return `${baseName}_${randomSuffix}`.substring(0, 15);
} 