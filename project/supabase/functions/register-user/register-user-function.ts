// @ts-ignore
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 許可されたオリジンのリスト
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',').map(origin => origin.trim());

// CORS ヘッダーを動的に生成する関数
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  
  // オリジンが許可リストに含まれているか、または全許可（*）の場合
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  
  // 許可されていないオリジンの場合は、最初の許可されたオリジンを返す
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0] === '*' ? '*' : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, nickname, accountId } = await req.json();
    
    // サービスロールキーでクライアントを作成
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // 機能設定を取得
    let requireEmailVerification = false; // デフォルト値
    try {
      const { data: settingsData } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'features')
        .single();
      
      if (settingsData?.value) {
        requireEmailVerification = settingsData.value.requireEmailVerification ?? false;
      }
      
      // デバッグログ
      console.log('Settings data:', settingsData);
      console.log('requireEmailVerification:', requireEmailVerification);
    } catch (settingsError) {
      // 設定取得に失敗した場合はデフォルト値を使用
      console.error('Failed to fetch settings:', settingsError);
    }
    
    // ユーザー登録
    console.log('Creating user with email_confirm:', !requireEmailVerification);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: !requireEmailVerification, // 設定に基づいて切り替え
    });
    
    if (authError) throw authError;
    
    // ユーザーIDを取得
    const userId = authData.user.id;
    
    // アカウントID生成
    const generatedAccountId = accountId || generateAccountId(nickname);
    
    // プロフィール作成
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        nickname: nickname,
        account_id: generatedAccountId,
        bio: null,
        avatar_data: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (profileError) throw profileError;
    
    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// アカウントID生成ヘルパー関数
function generateAccountId(name: string): string {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${baseName}${randomNum}`;
} 