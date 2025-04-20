// plugins/supabase.ts
// Nuxt アプリケーションの起動時に Supabase クライアントを初期化し、
// グローバルな状態 (`$supabase`) と認証ユーザーの状態 (`$user`) を提供するプラグイン。

import { defineNuxtPlugin, useState, useRuntimeConfig } from '#app'
import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '~/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { parse, serialize } from 'cookie' // クッキーのパース/シリアライズ用ライブラリ
import type { Ref } from 'vue'
// types/index.ts から SafeSupabaseUser をインポート
import type { SafeSupabaseUser } from '~/types'

// Supabase の User オブジェクトをシリアライズ可能な SafeSupabaseUser に変換するヘルパー関数。
// サーバーからクライアントへユーザー情報を渡す際に使用される。
function makeUserPojo(user: User | null): SafeSupabaseUser | null {
  // ユーザーが存在しない場合は null を返す
  if (!user) return null;
  try {
    // user_metadata と app_metadata を安全にディープコピーする。
    // structuredClone はモダンブラウザと Node.js で利用可能。
    const safeUserMetadata = user.user_metadata ? structuredClone(user.user_metadata) : {};
    const safeAppMetadata = user.app_metadata ? structuredClone(user.app_metadata) : {};

    // 必要なプロパティを持つ新しいオブジェクトを作成して返す
    return {
      id: user.id,
      email: user.email,
      user_metadata: safeUserMetadata,
      app_metadata: safeAppMetadata,
    };
  } catch (e) {
    // structuredClone が失敗した場合 (古い環境など) のフォールバック
    console.error('structuredClone failed for user object, falling back:', e);
    // 最低限の情報 (id, email) と空のメタデータで返す
    return {
        id: user.id,
        email: user.email,
        user_metadata: {},
        app_metadata: {},
    };
  }
}

// この Nuxt プラグインが提供するプロパティの型定義。
// これにより `$supabase` と `$user` が型安全に利用可能になる。
interface SupabasePluginProvides {
  supabase: SupabaseClient<Database> | null; // Supabase クライアントインスタンス (初期化失敗時は null)
  user: Ref<SafeSupabaseUser | null>; // リアクティブなユーザー情報 (ログインしていない場合は null)
}

// Nuxt プラグイン本体を定義
export default defineNuxtPlugin(async (nuxtApp) => {
  // nuxt.config.ts から runtimeConfig を取得
  const config = useRuntimeConfig()
  // 環境変数から Supabase の URL と匿名キーを取得
  const supabaseUrl = config.public.supabase.url
  const supabaseKey = config.public.supabase.key

  // Supabase クライアントインスタンスを格納する変数 (初期値 null)
  let supabase: SupabaseClient<Database> | null = null;
  // ユーザー情報を格納するリアクティブな状態 (useState で SSR/CSR 間で共有)
  const user = useState<SafeSupabaseUser | null>('supabase_user', () => null)

  // Supabase の URL またはキーが設定されていない場合
  if (!supabaseUrl || !supabaseKey) {
    // エラーメッセージをコンソールに出力
    console.error('Supabase URL or Key is not set in runtimeConfig.')
    // 開発モードでは、クライアント初期化失敗を通知する (本番ではエラーを出さずに続行)
    // ここでエラーをスローするとアプリの起動が停止する可能性があるため、
    // null を provide して各コンポーネントで存在チェックを行う方が堅牢。
    if (process.dev) {
        // throw new Error('Supabase client initialization failed: URL or Key missing.')
    }
    // supabase が null のまま provide される
  } else {
    // URL とキーが設定されている場合のみクライアントの初期化を試みる
    if (process.server) {
      // --- サーバーサイドレンダリング (SSR) 時の処理 ---
      // SSR コンテキストからリクエストヘッダーのクッキーを取得
      const cookieHeader = nuxtApp.ssrContext?.event?.node?.req?.headers?.cookie
      try {
          // サーバーサイド用の Supabase クライアントを作成 (@supabase/ssr)
          supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
              cookies: {
                  // リクエストからクッキーを取得する関数
                  get(key: string) {
                      const cookies = parse(cookieHeader || ''); // クッキー文字列をパース
                      return cookies[key] // 指定されたキーの値を返す
                  },
                  // サーバーサイドではクライアントへのクッキー設定/削除は行わないため空関数
                  set(key: string, value: string, options: CookieOptions) {},
                  remove(key: string, options: CookieOptions) {},
              },
          })
          // 初期ユーザー情報を非同期で取得し、useState を更新
          supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
              user.value = makeUserPojo(initialUser) // User オブジェクトを安全な形式に変換
          }).catch(e => {
              // 初期ユーザー取得エラーハンドリング
              console.error('[Supabase Plugin Server] Error fetching initial user:', e)
              user.value = null; // エラー時はユーザー状態を null に
          })
      } catch (e) {
          // サーバークライアント初期化エラーハンドリング
          console.error('[Supabase Plugin Server] Error initializing server client:', e)
          supabase = null; // supabase を null に設定
          user.value = null; // user も null に
      }
    } else {
      // --- クライアントサイド (ブラウザ) 時の処理 ---
      try {
          // ブラウザ用の Supabase クライアントを作成 (@supabase/ssr)
          // こちらはクッキーの get/set/remove が内部で処理される
          supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey)

          // 初回セッション情報を非同期で取得し、useState を更新
          supabase.auth.getSession().then(({ data: { session } }) => {
              // セッションからユーザー情報を取得し、安全な形式に変換して設定
              user.value = makeUserPojo(session?.user ?? null);
          }).catch(error => {
              // 初期セッション取得エラーハンドリング
              console.error('[Supabase Plugin Client] Error fetching initial session:', error);
              user.value = null; // エラー時はユーザー状態を null に
          });

          // 認証状態の変更 (ログイン、ログアウトなど) を監視
          supabase.auth.onAuthStateChange((event, session) => {
              // 変更があったらユーザー状態を更新
              user.value = makeUserPojo(session?.user ?? null)
          })
      } catch(e) {
          // ブラウザクライアント初期化エラーハンドリング
          console.error('[Supabase Plugin Client] Error initializing browser client:', e)
          supabase = null; // supabase を null に設定
          user.value = null; // user も null に
      }
    }
  }

  // プラグインが提供する値を返す
  // これにより、Nuxt アプリ全体で `$supabase` と `$user` が利用可能になる
  return {
    provide: {
      supabase: supabase, // Supabase クライアント (初期化失敗時は null)
      user: user // リアクティブなユーザー情報 (Ref<SafeSupabaseUser | null>)
    },
  }
}) 