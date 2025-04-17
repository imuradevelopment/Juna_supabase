import { serverSupabaseServiceRole } from '#supabase/server'
import type { ProfileUpdatePayload } from '~/types'
import type { Database } from '~/types/database'

// =====================================================================
// !!! 重要: 現在の既知の問題 (@nuxtjs/supabase: ^1.5.0) !!!
//
// 1. `.update()` の場合:
//    - API は 204 No Content を返すが、データベースのレコードは更新されない。
//    - RLS ポリシーを `USING (true)` に緩和し、`BEFORE UPDATE` トリガーを
//      無効化しても現象は解決しない。
//
// 2. `.upsert()` の場合:
//    - API は 401 Unauthorized エラーを返す。
//    - RLS UPDATE ポリシー緩和やトリガー無効化でも解決しない。
//      INSERT 部分の RLS ポリシーや Supabase 内部の挙動が疑われる。
//
// 根本原因は不明であり、Supabase 側の問題の可能性があるため要調査。
// =====================================================================
//
// このAPIエンドポイントは上記の問題を解決するために作成されました。
// クライアントサイドでは認証セッションとサービスロールの競合により更新が反映されないため、
// サーバーサイドでサービスロールキーを使用して処理を行います。
// これは一時的な対応策（Workaround）であり、本来はクライアントサイドでRLSポリシーを
// 適切に運用することが望ましいです。セキュリティ上の理由からサービスロールキーの
// 使用は最小限に留めるべきですが、この特定の問題では必要な措置です。
// =====================================================================

export default defineEventHandler(async (event) => {
  try {
    // リクエストボディを取得
    const body = await readBody(event)
    const { userId, updates } = body as { userId: string, updates: ProfileUpdatePayload }
    
    // バリデーション
    if (!userId) {
      return { 
        success: false, 
        error: 'ユーザーIDが指定されていません',
        errorCode: 'missing_user_id'
      }
    }
    
    if (!updates) {
      return { 
        success: false, 
        error: '更新データが指定されていません',
        errorCode: 'missing_updates'
      }
    }
    
    // サービスロールキーを使用してSupabaseクライアントを作成
    const supabase = serverSupabaseServiceRole<Database>(event)
    
    // プロフィール更新処理
    const { data, error } = await supabase
      .from('profiles')
      .update({
        nickname: updates.nickname,
        bio: updates.bio
      })
      .eq('id', userId)
      .select() // 更新後のデータを返す
    
    if (error) {
      console.error('サーバー側プロフィール更新エラー:', error.stack || error)
      return { 
        success: false, 
        error: `プロフィール更新に失敗しました: ${error.message}`,
        errorCode: 'update_failed'
      }
    }
    
    return {
      success: true,
      data
    }
  } catch (err) {
    console.error('サーバー側プロフィール更新中の例外:', err instanceof Error ? err.stack || err : err)
    return { 
      success: false, 
      error: `予期せぬエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
      errorCode: 'server_error'
    }
  }
}) 