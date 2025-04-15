import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

// SchemaName のインポートは不要

let supabaseAdmin: SupabaseClient<Database> | null = null

// defineNuxtPlugin に型引数を指定
export default defineNuxtPlugin<{ supabaseAdminClient: SupabaseClient<Database> | null }>(() => {
  if (supabaseAdmin) {
    return {
      provide: {
        supabaseAdminClient: supabaseAdmin
      }
    }
  }

  const config = useRuntimeConfig()

  // 正しいキーパスから値を取得
  const supabaseUrl = config.public.supabase.url as string | undefined
  const supabaseServiceKey = config.supabase.serviceKey as string | undefined

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SupabaseのURLまたはサービスキーがランタイム設定（サーバーサイド）に見つかりません')
    // provide で返す型を SupabaseClient<Database> | null に統一するため null を返す
    return {
      provide: {
        supabaseAdminClient: null
      }
    }
  }

  // SchemaName を明示的に指定。型引数も修正。
  supabaseAdmin = createClient<Database, 'public'>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })

  // provide で返す型を SupabaseClient<Database> | null に統一
  return {
    provide: {
      supabaseAdminClient: supabaseAdmin
    }
  }
}) 