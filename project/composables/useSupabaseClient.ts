import { useNuxtApp } from '#app'
import type { Database } from '~/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * プラグインによって提供される Supabase クライアントインスタンスを取得します。
 * サーバーサイドとクライアントサイドで適切なクライアントが返されます。
 * 
 * @returns {SupabaseClient<Database> | null} Supabase クライアントインスタンス、または初期化失敗時は null。
 */
export const useSupabaseClient = (): SupabaseClient<Database> | null => {
  const nuxtApp = useNuxtApp()
  // プラグインが provide した `$supabase` を返すように変更
  // nuxtApp.$supabase の型アサーションが必要な場合がある
  return nuxtApp.$supabase as SupabaseClient<Database> | null
}