import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { ProfileUpdatePayload } from '~/types'
// Database 型と Tables 型をインポート
import type { Database, Tables, TablesUpdate } from '~/types/database'
// Supabase Service Role クライアントを作成するためのユーティリティをインポート
import { createSupabaseServiceRoleClient } from '~/server/utils/supabaseServiceRole'

// API の成功レスポンスの型を定義
// select で指定したカラムに対応する型 + success: true
type ProfileUpdateSuccessResponse = {
  success: true;
  data: Pick<Tables<'profiles'>, 'id' | 'nickname' | 'bio' | 'updated_at'>;
}

// API の失敗レスポンスの型を定義
type ProfileUpdateErrorResponse = {
  success: false;
  error: string;
  errorCode: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
}

export default defineEventHandler(async (event): Promise<ProfileUpdateSuccessResponse | ProfileUpdateErrorResponse> => {
  // Service Role クライアントを作成 (Runtime Config を渡す)
  // Service Role は RLS をバイパスするため、サーバーサイドでのみ使用すること
  const supabase = createSupabaseServiceRoleClient(useRuntimeConfig(event))

  try {
    // リクエストボディを取得
    const body = await readBody(event)
    // リクエストボディの型をアサーション (本番では Zod などで厳密に検証推奨)
    const { userId, updates } = body as { userId: string, updates: ProfileUpdatePayload }

    // ユーザーIDが存在しない場合はエラー
    if (!userId) {
      setResponseStatus(event, 400) // Bad Request
      return { success: false, error: 'ユーザーIDが必要です', errorCode: 'missing_user_id' }
    }

    // 更新データ (updates) が存在し、かつ nickname か bio の少なくとも一方が指定されているか検証
    if (!updates || (updates.nickname === undefined && updates.bio === undefined)) {
      setResponseStatus(event, 400) // Bad Request
      return { success: false, error: '更新データ（nicknameまたはbio）が必要です', errorCode: 'missing_updates' }
    }

    // 更新データオブジェクトの型をより具体的に
    const updateData: Pick<TablesUpdate<'profiles'>, 'nickname' | 'bio'> = {}
    if (updates.nickname !== undefined) {
      // null も許容する場合は TablesUpdate<'profiles'>['nickname'] 型にする
      updateData.nickname = updates.nickname ?? null // nullish coalescing で null にフォールバック
    }
    if (updates.bio !== undefined) {
      updateData.bio = updates.bio ?? null // nullish coalescing で null にフォールバック
    }

    // 更新対象のキーが存在しない場合は更新処理をスキップしてもよい
    if (Object.keys(updateData).length === 0) {
        setResponseStatus(event, 400) // Or potentially 200 OK with no changes
        return { success: false, error: '更新するデータがありません。', errorCode: 'no_data_to_update' }
    }

    // Supabase の profiles テーブルを更新
    // Service Role Client を使用しているため、RLS ポリシーは適用されない
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      // .select() で取得するデータ型を Pick で明示
      .select('id, nickname, bio, updated_at')
      .single<Pick<Tables<'profiles'>, 'id' | 'nickname' | 'bio' | 'updated_at'> | null>() // .single() の戻り値型を指定

    // Supabase からのエラー処理
    if (error) {
      // ★理由: Supabase DB 操作 (update) でエラーが発生した場合の原因特定のため
      console.error('サーバー側プロフィール更新エラー:', error.stack || error)
      // Supabaseのエラーコードに基づいてHTTPステータスコードとカスタムエラーコードを設定
      let statusCode = 500; // デフォルトは Internal Server Error
      let errorCode = 'update_failed';
      if (error.code) {
        console.log('Supabase Error Code:', error.code);
        // 特定のエラーコードに対するハンドリング
        if (error.code === '23505') { // unique_violation
          statusCode = 400; // Bad Request (例: ニックネームが重複)
          errorCode = 'unique_violation';
        } else if (error.code.startsWith('22')) { // data_exception
          statusCode = 400; // Bad Request (例: データ型不正)
          errorCode = 'data_exception';
        } else if (error.code === 'PGRST116') { // Resource Not Found (eq で指定した id が存在しない)
          statusCode = 404; // Not Found
          errorCode = 'profile_not_found';
        }
        // 他の Supabase エラーコードに対するハンドリングを追加可能
      }
      setResponseStatus(event, statusCode)
      // クライアントに返すエラーレスポンス
      return {
         success: false,
         error: `プロフィール更新に失敗しました: ${error.message}`,
         errorCode: errorCode,
         details: error.details || null, // Supabaseからの詳細情報
         hint: error.hint || null,     // Supabaseからのヒント情報
         code: error.code || null      // Supabaseエラーコード
      }
    }

    // 更新が成功し、データが返却された場合
    // .single() を使用しているため、エラーがなければ data は存在するはずだが念のためチェック
    if (data) {
      // 成功レスポンスを返す
      return { success: true, data }
    } else {
      // データが返ってこないという予期せぬ状況 (通常は .single() でエラーになるはず)
      // ★理由: DB更新は成功したが、select でデータが返ってこないという矛盾した状態の調査のため
      console.error('サーバー側プロフィール更新後、データが取得できませんでした。userId:', userId)
      setResponseStatus(event, 404) // Not Found or internal issue
      return { success: false, error: '更新対象のプロフィールが見つからないか、更新後にデータを取得できませんでした。', errorCode: 'update_not_found_or_fetch_failed' }
    }

  } catch (err) {
    // 予期せぬ例外処理
    // ★理由: この API ハンドラ内の try ブロックで捕捉されなかった JavaScript 例外の原因特定のため
    console.error('サーバー側プロフィール更新中の予期せぬ例外:', err instanceof Error ? err.stack || err : err)
    const error = err instanceof Error ? err : new Error(String(err));
    setResponseStatus(event, 500) // Internal Server Error
    // クライアントに返すエラーレスポンス
    return {
      success: false,
      error: `予期せぬサーバーエラーが発生しました: ${error.message}`,
      errorCode: 'internal_server_error',
      details: null, // 詳細不明
      hint: null,
      code: null
    }
  }
})
