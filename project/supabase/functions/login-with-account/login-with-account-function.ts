// @ts-ignore
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// types/index.ts と同じ型を定義
interface EdgeFunctionErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { identifier } = await req.json();
    
    // 識別子が提供されているかチェック
    if (!identifier) {
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false,
        error: '識別子 (メールアドレスまたはアカウントID) が必要です。',
        errorCode: 'missing_identifier'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // メールアドレス形式かどうかを正規表現でチェック
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    
    // サービスロールキーでクライアントを作成
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    let email = identifier;
    
    // アカウントIDの場合、ユーザーIDを取得してからメールアドレスを取得
    if (!isEmail) {
      // @から始まる場合は@を削除
      const accountId = identifier.startsWith('@') ? identifier.substring(1) : identifier;
      
      // プロフィールテーブルからアカウントIDを持つユーザーを検索
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('account_id', accountId)
        .single();
      
      if (profileError || !profileData) {
        // エラーログ出力 (profileErrorが存在する場合のみ)
        if (profileError) {
          console.error('プロフィール取得エラー:', profileError.stack || profileError);
        }
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: '入力されたアカウントIDは見つかりません。',
          errorCode: 'account_not_found' // より具体的なエラーコード
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // ユーザーIDからユーザー情報を取得
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin
        .getUserById(profileData.id);
      
      if (userError || !userData?.user?.email) {
        // エラーログ出力 (userErrorが存在する場合のみ)
        if (userError) {
          console.error('ユーザー取得エラー:', userError.stack || userError);
        }
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false,
          error: 'アカウントに紐づくユーザー情報の取得に失敗しました。',
          errorCode: 'user_fetch_failed'
        };
        return new Response(
          JSON.stringify(errorResponse),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      email = userData.user.email;
    }
    
    // メールアドレスでログイン（パスワードチェックはSupabaseが行う）
    // このFunctionはメールアドレスを返すだけに変更
    const successResponse = {
      success: true,
      email: email
    };
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // 予期せぬエラーが発生した場合 (仕様と型安全性を両立)
    const errorToLog = error instanceof Error ? error.stack || error : error;
    console.error('login-with-account function 内でのエラー:', errorToLog);

    const errorResponse: EdgeFunctionErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error), // エラーメッセージを安全に取得
      errorCode: 'internal_error'
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 500 Internal Server Error に変更
    );
  }
}); 