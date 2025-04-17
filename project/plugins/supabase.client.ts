import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // user ref をグローバルに取得または初期化
  const user = useSupabaseUser()

  // 正しいキーパスから値を取得
  const supabaseUrl = config.public.supabase.url as string | undefined
  const supabaseKey = config.public.supabase.key as string | undefined

  let supabase: SupabaseClient<Database> | null = null;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // ★★★ 追加: セッションの初期取得 ★★★
    // プラグイン読み込み時に現在のセッションを取得し、初期状態を設定
    supabase.auth.getSession().then(({ data: { session } }) => {
      user.value = session?.user ?? null;
      console.log('[Supabase Client Plugin] Initial session fetched. User:', user.value?.id ?? 'null');
    }).catch((error) => {
      console.error('[Supabase Client Plugin] Error fetching initial session:', error);
    });
    // ★★★ 追加ここまで ★★★

    // *** 追加: onAuthStateChangeリスナー ***
    // 認証状態（ログイン、ログアウト、トークン更新など）の変化を監視
    supabase.auth.onAuthStateChange((event, session) => {
      // ユーザー情報を取得し、useSupabaseUserが管理するuser refを更新
      // sessionがあればユーザー情報を、なければnullを設定
      // getSessionですでに設定されている場合でも、イベントがあれば最新情報で上書きされる
      const newUser = session?.user || null;
      if (user.value?.id !== newUser?.id) { // ★ ID比較で変更時のみログ出力
          console.log('[Supabase Client Plugin] Auth state changed:', event, 'User:', newUser?.id ?? 'null');
          user.value = newUser;
      }
    })
    // *** 追加ここまで ***

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