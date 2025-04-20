// @ts-ignore // Denoの型チェックを無視するためのコメント
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// @ts-ignore // Denoの型チェックを無視するためのコメント
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// types/index.ts と同じ型を定義
/**
 * Edge Functionのエラーレスポンスの型定義。
 */
interface EdgeFunctionErrorResponse {
  success: false; // 処理が失敗したことを示すフラグ
  error: string; // エラーメッセージ
  errorCode?: string; // エラーコード (オプション)
}

// CORSヘッダー: 異なるオリジンからのリクエストを許可するための設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // すべてのオリジンを許可
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 許可するヘッダー
};

// Deno DeployのHTTPリクエストハンドラー
serve(async (req: Request) => {
  // CORSプリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // リクエストボディから識別子 (メールアドレスまたはアカウントID) を取得
    const { identifier } = await req.json();

    // 識別子が提供されているかチェック
    if (!identifier) {
      // エラーレスポンスを作成
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false,
        error: '識別子 (メールアドレスまたはアカウントID) が必要です。',
        errorCode: 'missing_identifier'
      };
      // 400 Bad Request レスポンスを返す
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 識別子がメールアドレス形式かどうかを正規表現でチェック
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // Supabase Adminクライアントをサービスロールキーで初期化
    // 環境変数からSupabaseのURLとサービスロールキーを取得
    const supabaseAdmin = createClient(
      // @ts-ignore // Denoの環境変数アクセスに関する型エラーを無視
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore // Denoの環境変数アクセスに関する型エラーを無視
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // セッションを永続化しない設定
      { auth: { persistSession: false } }
    );

    // メールアドレスを格納する変数を初期化 (デフォルトは識別子そのもの)
    let email = identifier;

    // 識別子がメールアドレスでない場合 (アカウントIDの場合)
    if (!isEmail) {
      // アカウントIDが '@' で始まる場合は '@' を削除
      const accountId = identifier.startsWith('@') ? identifier.substring(1) : identifier;

      // `profiles` テーブルからアカウントIDに一致するユーザーの `id` を取得
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles') // `profiles` テーブルを指定
        .select('id') // `id` カラムを選択
        .eq('account_id', accountId) // `account_id` が一致する行を検索
        .single(); // 結果が単一であることを期待

      // プロフィールデータの取得に失敗した場合、またはデータが存在しない場合
      if (profileError || !profileData) {
        // profileErrorが存在する場合のみ、詳細なエラーログを出力
        if (profileError) {
          console.error('プロフィール取得エラー:', profileError.stack || profileError); // 開発者向けエラーログ
        }
        // エラーレスポンスを作成
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: '入力されたアカウントIDは見つかりません。', // ユーザー向けエラーメッセージ
          errorCode: 'account_not_found' // エラーコード
        };
        // 404 Not Found レスポンスを返す
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 取得したユーザーID (`profileData.id`) を使用して、Admin API経由でユーザー情報を取得
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin
        .getUserById(profileData.id);

      // ユーザー情報の取得に失敗した場合、またはメールアドレスが存在しない場合
      if (userError || !userData?.user?.email) {
        // userErrorが存在する場合のみ、詳細なエラーログを出力
        if (userError) {
          console.error('ユーザー取得エラー:', userError.stack || userError); // 開発者向けエラーログ
        }
        // エラーレスポンスを作成
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: 'アカウントに紐づくユーザー情報の取得に失敗しました。', // ユーザー向けエラーメッセージ
          errorCode: 'user_fetch_failed' // エラーコード
        };
        // 500 Internal Server Error レスポンスを返す
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 取得したユーザー情報からメールアドレスをセット
      email = userData.user.email;
    }

    // 処理が成功した場合、メールアドレスを含む成功レスポンスを作成
    // 注意: このFunctionはパスワード検証を行わず、アカウントIDからメールアドレスを検索する役割のみを持つ
    const successResponse = {
      success: true,
      email: email // 検索結果のメールアドレス
    };
    // 200 OK レスポンスを返す
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // 予期せぬエラーが発生した場合の処理
    // エラーオブジェクトが Error インスタンスか確認し、スタックトレースまたはエラー情報をログに出力
    const errorToLog = error instanceof Error ? error.stack || error : error;
    console.error('login-with-account function 内での予期せぬエラー:', errorToLog); // 開発者向けエラーログ

    // エラーレスポンスを作成
    const errorResponse: EdgeFunctionErrorResponse = {
      success: false,
      // エラーメッセージを安全に取得して設定
      error: error instanceof Error ? error.message : String(error), // ユーザー向けエラーメッセージ (より汎用的)
      errorCode: 'internal_error' // エラーコード
    };
    // 500 Internal Server Error レスポンスを返す
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 