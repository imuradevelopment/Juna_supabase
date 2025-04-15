import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 正しいキーパスから値を取得
  const supabaseUrl = config.public.supabase.url as string | undefined
  const supabaseKey = config.public.supabase.key as string | undefined

  let supabase: SupabaseClient<Database> | null = null;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseKey)
  } else {
    console.error('SupabaseのURLまたはキーがランタイム設定（クライアントサイド）に見つかりません')
  }

  // provide で返す型を SupabaseClient<Database> | null に統一
  return {
    provide: {
      supabaseClient: supabase
    }
  }
}) 