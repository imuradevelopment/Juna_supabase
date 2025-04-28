import { User } from '@supabase/supabase-js'
import { defineEventHandler, readBody, createError } from 'h3'
import { createSupabaseServerClient } from '~/server/utils/supabaseServerClient'
import type { Database, TablesInsert } from '~/types/database'

export default defineEventHandler(async (event) => {
  // [API処理] /server/api/posts/create.post.ts
  // 概要: 新規投稿データをデータベースに保存する。
  // 認証ユーザーとして SSR Client を使用するバージョン

  // [理由] リクエストのCookieに基づき、認証ユーザーとして動作するSupabaseクライアントを作成するため。
  const client = createSupabaseServerClient(event)

  // [理由] 現在認証されているユーザーの情報を取得するため。
  const { data: { user }, error: userError } = await client.auth.getUser()

  // [理由] ユーザー情報取得時にエラーが発生した場合、またはユーザーが認証されていない場合。
  if (userError || !user) {
    console.error('[API ERROR: posts/create] Error fetching user or user not authenticated:', userError?.message)
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: `ユーザー認証に失敗しました: ${userError?.message || '認証されていません'}`,
    })
  }

  // [理由] リクエストボディから投稿データを取得するため。
  const body = await readBody<Omit<TablesInsert<'posts'>, 'author_id'> & { categoryIds?: number[] }>(event)
  // author_id はDBのRLSで設定されるため、型から除外 (Omitを使用)

  // [理由] リクエストボディに必要なデータが含まれているか検証するため。
  if (!body || !body.title || !body.content) {
    console.warn('[API WARN: posts/create] Missing required fields (title or content). Body:', body)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'タイトルと内容は必須です。',
    })
  }

  // [理由] データベースに挿入する投稿データを準備するため。
  // author_id は RLS ポリシー `CHECK (auth.uid() = author_id)` によりDB側で検証・設定されることを期待する。
  const postData: Omit<TablesInsert<'posts'>, 'author_id'> = {
    title: body.title,
    content: body.content,
    excerpt: body.excerpt || null,
    cover_image_path: body.cover_image_path || null,
    published: body.published ?? false,
    published_at: body.published ? new Date().toISOString() : null,
    // author_id: user.id, // RLSに任せるためコメントアウト (設定しても動作はするはず)
  }

  try {
    // --- 投稿データの挿入 ---
    // [理由] 認証ユーザーとして posts テーブルに挿入するため。
    const { data: newPost, error: postError } = await client
      .from('posts')
      .insert({ ...postData, author_id: user.id }) // ★ 明示的に author_id を設定する方が安全かもしれないので追記
      .select()
      .single()

    // [理由] posts テーブルへの挿入時にエラーが発生した場合。
    if (postError) {
      console.error('[API ERROR: posts/create] Error inserting post:', postError.message, postError.details)
      // RLS違反の可能性も考慮して詳細もログ出力
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: `投稿の保存中にエラーが発生しました: ${postError.message}`,
      })
    }

    // [理由] 投稿挿入後にデータが取得できなかった場合。
    if (!newPost) {
      console.error('[API ERROR: posts/create] Failed to retrieve the newly created post.')
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        message: '作成された投稿データの取得に失敗しました。',
      })
    }

    // --- カテゴリ関連データの挿入 ---
    // [理由] リクエストボディにカテゴリIDが含まれている場合。
    // post_categories の RLS (`CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()))`) も
    // このクライアント (認証ユーザー) での操作であれば正しく評価されるはず。
    if (body.categoryIds && body.categoryIds.length > 0) {
      const postCategoryData = body.categoryIds.map(categoryId => ({
        post_id: newPost.id,
        category_id: categoryId,
      }))

      // [理由] 認証ユーザーとして post_categories テーブルに挿入するため。
      const { error: categoryError } = await client
        .from('post_categories')
        .insert(postCategoryData)

      // [理由] post_categories テーブルへの挿入時にエラーが発生した場合。
      if (categoryError) {
        console.error(
          '[API ERROR: posts/create] Error inserting post categories:',
          categoryError.message,
          categoryError.details, // RLS違反の可能性も考慮
          'Post ID:', newPost.id,
          'Category IDs:', body.categoryIds
        )
        // カテゴリ挿入エラーは警告ログに留める
      }
    }

    // [理由] すべての処理が正常に完了した場合。
    console.log(`[API SUCCESS: posts/create] Post created successfully. ID: ${newPost.id}, Title: ${newPost.title}`)
    return newPost

  } catch (error: any) {
    // [理由] tryブロック内で予期せぬエラーが発生した場合。
    console.error('[API CATCH ERROR: posts/create] Unexpected error:', error.stack || error)
    const statusCode = error.statusCode || 500
    const message = error.message || 'サーバー内部で予期せぬエラーが発生しました。'
    throw createError({
      statusCode: statusCode,
      statusMessage: error.statusMessage || 'Internal Server Error',
      message: message,
    })
  }
}) 