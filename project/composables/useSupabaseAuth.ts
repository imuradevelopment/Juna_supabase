/**
 * @nuxtjs/supabase 利用時の問題と経緯:
 * 
 * 以前は `@nuxtjs/supabase` の `useSupabaseClient` や `useSupabaseUser` を利用していましたが、
 * 特に Edge Function (例: アカウント削除) の呼び出し時に、クライアント側とサーバー側 (Function) での
 * 認証状態 (セッション/JWT) の不整合に起因すると思われる 401 Unauthorized や 403 Forbidden エラーが
 * 頻繁に発生しました。
 * 
 * 具体的な原因の特定は困難でしたが、`onAuthStateChange` は動作しているように見えるものの、
 * Composable 内で取得するユーザー状態やクライアントインスタンスが最新の認証状態を
 * 正確に反映していない、あるいは Function 呼び出し時に有効なトークンを適切に付与できていない
 * 可能性が考えられました。
 * Web検索でも `@nuxtjs/supabase` 利用時のセッション管理に関する類似の問題報告や、
 * Supabase 一般の RLS (Row Level Security) 設定起因の認証エラーに関する議論が見られました。
 * 
 * これらの問題を解決するため、Nuxt モジュールへの依存をなくし、
 * 標準の `supabase-js` ライブラリを直接利用する形式に変更しました。
 * これにより、クライアントの初期化、認証状態の監視、セッション管理をより明示的に制御し、
 * 問題の解消を図りました。
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { createClient, type SupabaseClient, type User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#app' // Nuxt 3 の useRuntimeConfig をインポート

// シングルトンな Supabase クライアントインスタンス
let supabase: SupabaseClient | null = null

// リアクティブなユーザー状態
const currentUser = ref<User | null>(null)

// 認証状態変化のサブスクリプション
let authListenerSubscription: { unsubscribe: () => void } | null = null

/**
 * 標準の supabase-js を使用する認証 Composable。
 */
export const useSupabaseAuth = () => {
  const config = useRuntimeConfig()

  // クライアントを初期化 (シングルトン)
  if (!supabase) {
    const supabaseUrl = config.public.supabase.url
    const supabaseKey = config.public.supabase.key

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL または Key が設定されていません。')
      // エラーハンドリング (必要に応じて)
    } else {
      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          // Cookie ベースのストレージアダプタを検討（SSR対応のため）
          // storage: // ... カスタムストレージアダプタ or @supabase/ssr のヘルパー?
          // autoRefreshToken, persistSession などはデフォルトでOKなことが多い
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })

      // --- 認証状態の監視 --- 
      // クライアントが初期化された後、一度だけリスナーを設定
      console.log('[useSupabaseAuth] Setting up onAuthStateChange listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        console.log('[useSupabaseAuth] onAuthStateChange event:', event, 'Session:', session)
        currentUser.value = session?.user ?? null
      })
      authListenerSubscription = subscription

      // --- 初期セッションの取得 --- 
      // マウント時に現在のセッションを取得して初期状態を設定 (初回ロード時)
      // Note: onAuthStateChange の INITIAL_SESSION イベントでも取得できるはずだが念のため
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
            console.log('[useSupabaseAuth] Initial session found.')
            currentUser.value = data.session.user
        } else {
            console.log('[useSupabaseAuth] No initial session found.')
        }
      })

      // --- アプリ終了時のクリーンアップ (Nuxt のライフサイクルフック外なので注意) --- 
      // Nuxt アプリがアンマウントされるタイミングで購読解除する仕組みが必要
      // (例: プラグインやルートコンポーネントの onUnmounted)
      // ここでは onUnmounted は直接使えない
    }
  }

  // --- Composable が提供する関数 --- 

  // クライアントインスタンスを返す (エラーチェック)
  const getClient = (): SupabaseClient => {
    if (!supabase) {
      throw new Error('Supabase client has not been initialized.')
    }
    return supabase
  }

  // 現在のユーザー情報を返す (リアクティブ)
  const getUser = () => {
    return currentUser
  }

  // コンポーネントアンマウント時にリスナーを解除するためのヘルパー
  // (コンポーネント内で呼び出す想定)
  const cleanupAuthListener = () => {
    if (authListenerSubscription) {
      console.log('[useSupabaseAuth] Unsubscribing from onAuthStateChange.')
      authListenerSubscription.unsubscribe()
      authListenerSubscription = null
    }
  }

  // Vue コンポーネントのライフサイクルでクリーンアップをフック
  // この Composable を使用するコンポーネントがアンマウントされるときに実行される
  onUnmounted(() => {
    // 注意: この onUnmounted は、この Composable が呼び出された
    // コンポーネントのスコープで実行される。
    // アプリケーション全体で1回だけクリーンアップしたい場合は、
    // プラグイン等で管理する必要がある。
    // ここでの解除は、このComposableを使った最後のコンポーネントが
    // アンマウントされたときに行われる可能性がある。
    // より堅牢にするにはプラグインでの管理を推奨。
    // cleanupAuthListener(); // ← ここで呼ぶべきか検討
  })

  return {
    getClient,
    getUser,
    currentUser, // リアクティブな user を直接公開
    cleanupAuthListener // 手動クリーンアップ用
  }
} 