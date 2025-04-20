import { type CookieOptions, createServerClient } from '@supabase/ssr'
import type { H3Event } from 'h3'
import { type Database } from '~/types/database' // `~/` は server/utils 内でも機能するはず
import { getCookie, setCookie, deleteCookie } from 'h3'

/**
 * サーバーサイド (サーバーコンポーネント、API ルート、サーバープラグイン) 用の Supabase クライアントを作成します。
 * ユーザーの認証状態に基づいて動作します。
 * @param event H3 イベントオブジェクト
 * @returns ユーザーセッションに基づいて初期化された Supabase クライアント
 */
export function createSupabaseServerClient(event: H3Event) { // 関数名を変更 use -> create
  const config = useRuntimeConfig()

  // public なキーを使用
  // nuxt.config.ts の public ランタイム設定で定義されている想定
  const supabaseUrl = config.public.supabase.url as string
  const supabaseKey = config.public.supabase.key as string

  if (!supabaseUrl || !supabaseKey) {
    console.error('[createSupabaseServerClient] Supabase URL または Anon Key が設定されていません。nuxt.config.ts または .env を確認してください。')
    throw new Error('Supabase public configuration is missing.')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey, // Anon Key を使用
    {
      cookies: {
        get (key: string) {
          return getCookie(event, key)
        },
        set (key: string, value: string, options: CookieOptions) {
          setCookie(event, key, value, options)
        },
        remove (key: string, options: CookieOptions) {
          deleteCookie(event, key, options)
        }
      },
      auth: {
        // デフォルトのサーバーサイド認証フローを使用
        autoRefreshToken: true, // 必要に応じて
        persistSession: true,
        detectSessionInUrl: false // 通常サーバーサイドでは不要
      }
    }
  )
} 