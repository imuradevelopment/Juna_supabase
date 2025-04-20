import { createClient } from '@supabase/supabase-js'
// import { type CookieOptions, createServerClient } from '@supabase/ssr' // 不要になったため削除
// import type { H3Event } from 'h3' // 不要になったため削除
import { type Database } from '~/types/database'
// import { getCookie, setCookie, deleteCookie } from 'h3' // 不要になったため削除

/**
 * サーバーサイド専用の Supabase クライアント (Service Role Key を使用) を作成します。
 * APIルートやサーバープラグインなど、サーバー環境でのみ使用してください。
 * ※ このクライアントはユーザーセッションに依存しません。
 * @param config - useRuntimeConfig() から取得したランタイム設定オブジェクト
 * @returns Service Role Key で初期化された Supabase クライアント
 */
export function createSupabaseServiceRoleClient(config: ReturnType<typeof useRuntimeConfig>) {
  // 引数で受け取った config を使用

  // 環境変数からURLとService Role Keyを取得
  // public.supabase.url と supabase.serviceKey を nuxt.config.ts から取得
  const supabaseUrl = config.public.supabase.url
  const serviceKey = config.supabase.serviceKey

  // null チェック
  if (!supabaseUrl || !serviceKey) {
    console.error('[createSupabaseServiceRoleClient] Supabase URL または Service Role Key が設定されていません。nuxt.config.ts または .env を確認してください。')
    // 設定ミスは致命的なのでエラーをスロー
    throw new Error('Supabase configuration is missing.')
  }

  // supabase-js の createClient を使用
  return createClient<Database>(
    supabaseUrl,
    serviceKey,
    // Service Role Key を使う場合、auth オプションは通常不要
    {
      auth: {
        // これらの設定は createServerClient 用であり、createClient では通常不要
        // autoRefreshToken: false,
        // persistSession: false,
        // detectSessionInUrl: false
        // Service Role Key を使用する場合、セッション管理は自動的に行われない
        // 必要に応じてカスタムのトークン処理が必要になる場合があるが、基本は不要
      }
    }
  )
} 