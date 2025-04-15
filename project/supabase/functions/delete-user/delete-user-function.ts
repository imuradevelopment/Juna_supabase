// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

// システムユーザーのID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface RequestBody {
  userId: string;
}

serve(async (req: Request) => {
  // CORSプリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authorization ヘッダーから Bearer トークンを取得
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '認証エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // リクエストボディからユーザーIDを取得
    const { userId } = await req.json() as RequestBody;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ユーザーIDが指定されていません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // サービスロールキーを取得
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'サーバー構成エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // アプリのURLを取得
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'サーバー構成エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 管理者クライアントの作成
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
    
    // JWT デコード用の関数
    async function decodeAndVerifyJWT(token: string) {
      try {
        // サービスロールを使って管理者クライアントでユーザーを取得
        const { data, error } = await supabaseAdmin.auth.getUser(token)
        
        if (error) throw error
        return { user: data.user, error: null }
      } catch (error) {
        const errorToLog = error instanceof Error ? error.stack || error : error;
        console.error('JWT検証エラー:', errorToLog)
        return { user: null, error }
      }
    }

    // ユーザーIDの検証
    const { user, error: jwtError } = await decodeAndVerifyJWT(token)

    if (jwtError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '認証に失敗しました: ' + (jwtError?.message || 'トークンが無効です') 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // 要求されたユーザーIDと認証されたユーザーIDが一致することを確認
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ success: false, error: '他のユーザーアカウントは削除できません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // ストレージ削除処理
    try {
      // バケットごとに処理を分離し、エラーが発生しても続行できるように
      const buckets = ['profile_images', 'post_images', 'cover_images']
      
      for (const bucket of buckets) {
        try {
          const { data: objects, error: listError } = await supabaseAdmin.storage
            .from(bucket)
            .list(userId)
          
          if (listError) {
            console.error(`${bucket} 一覧取得エラー:`, listError.stack || listError)
            continue
          }
          
          if (objects && objects.length > 0) {
            const filePaths = objects.map(obj => `${userId}/${obj.name}`)
            
            const { error: deleteError } = await supabaseAdmin.storage
              .from(bucket)
              .remove(filePaths)
              
            if (deleteError) {
              console.error(`${bucket} 削除エラー:`, deleteError.stack || deleteError)
            }
          }
        } catch (bucketError) {
          console.error(`${bucket} 処理エラー:`, bucketError.stack || bucketError)
        }
      }
    } catch (storageError) {
      const errorToLog = storageError instanceof Error ? storageError.stack || storageError : storageError;
      console.error('ストレージ全体の削除エラー:', errorToLog)
      // エラーは記録するが処理は続行
    }

    // 投稿の削除（カスケード削除によりコメントや画像も削除される）
    try {
      const { error: postsError } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('author_id', userId)

      if (postsError) {
        const errorToLog = postsError instanceof Error ? postsError.stack || postsError : postsError;
        console.error('投稿削除エラー:', errorToLog)
      }
    } catch (error) {
      const errorToLog = error instanceof Error ? error.stack || error : error;
      console.error('投稿削除例外:', errorToLog)
      // エラーは記録するが処理は続行
    }

    // いいねの削除
    try {
      await Promise.all([
        supabaseAdmin.from('post_likes').delete().eq('user_id', userId),
        supabaseAdmin.from('comment_likes').delete().eq('user_id', userId)
      ])
    } catch (error) {
      const errorToLog = error instanceof Error ? error.stack || error : error;
      console.error('いいね削除例外:', errorToLog)
      // エラーは記録するが処理は続行
    }

    // カテゴリの処理
    try {
      // ユーザーが作成したカテゴリを取得
      const { data: userCategories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('creator_id', userId);
      
      if (categoriesError) {
        const errorToLog = categoriesError instanceof Error ? categoriesError.stack || categoriesError : categoriesError;
        console.error('カテゴリ取得エラー:', errorToLog);
        // エラーは記録するが処理は続行
      } else if (userCategories && userCategories.length > 0) {
        console.log(`ユーザー作成カテゴリ: ${userCategories.length}件`);
        
        // 他のユーザーが使用しているカテゴリを特定
        const categoryIds = userCategories.map(c => c.id);
        
        // 他のユーザーの投稿で使われているカテゴリを特定
        const { data: sharedCategoryData, error: sharedError } = await supabaseAdmin
          .from('post_categories')
          .select('category_id, posts!inner(author_id)')
          .in('category_id', categoryIds)
          .neq('posts.author_id', userId);
          
        if (sharedError) {
          const errorToLog = sharedError instanceof Error ? sharedError.stack || sharedError : sharedError;
          console.error('共有カテゴリ特定エラー:', errorToLog);
        } else {
          // 他のユーザーが使用しているカテゴリIDの配列を作成
          const sharedCategoryIds = [...new Set(
            (sharedCategoryData || []).map(item => item.category_id)
          )];
          
          if (sharedCategoryIds.length > 0) {
            console.log(`他ユーザー使用カテゴリ: ${sharedCategoryIds.length}件`);
            
            // 他のユーザーが使用しているカテゴリをシステムユーザーに移管
            const { error: updateError } = await supabaseAdmin
              .from('categories')
              .update({ creator_id: SYSTEM_USER_ID })
              .in('id', sharedCategoryIds);
              
            if (updateError) {
              const errorToLog = updateError instanceof Error ? updateError.stack || updateError : updateError;
              console.error('カテゴリ移管エラー:', errorToLog);
            }
          }
          
          // 他のユーザーが使用していないカテゴリを特定して削除
          const unusedCategoryIds = categoryIds.filter(id => !sharedCategoryIds.includes(id));
          
          if (unusedCategoryIds.length > 0) {
            console.log(`未共有カテゴリ: ${unusedCategoryIds.length}件`);
            
            // 未共有カテゴリを削除
            const { error: deleteError } = await supabaseAdmin
              .from('categories')
              .delete()
              .in('id', unusedCategoryIds);
              
            if (deleteError) {
              const errorToLog = deleteError instanceof Error ? deleteError.stack || deleteError : deleteError;
              console.error('未共有カテゴリ削除エラー:', errorToLog);
            }
          }
        }
      } else {
        console.log('ユーザー作成カテゴリなし');
      }
    } catch (error) {
      const errorToLog = error instanceof Error ? error.stack || error : error;
      console.error('カテゴリ処理例外:', errorToLog);
      // エラーは記録するが処理は続行
    }

    // プロフィール削除（最後にプロフィールを削除）
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        const errorToLog = profileError instanceof Error ? profileError.stack || profileError : profileError;
        console.error('プロフィール削除エラー:', errorToLog)
        // エラーは記録するが処理は続行
      }
    } catch (error) {
      const errorToLog = error instanceof Error ? error.stack || error : error;
      console.error('プロフィール削除例外:', errorToLog)
      // エラーは記録するが処理は続行
    }

    // 認証ユーザーの削除
    try {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteUserError) {
        const errorToLog = deleteUserError instanceof Error ? deleteUserError.stack || deleteUserError : deleteUserError;
        console.error('ユーザー削除APIエラー:', errorToLog)
        throw deleteUserError
      }
    } catch (authDeleteError) {
      const errorToLog = authDeleteError instanceof Error ? authDeleteError.stack || authDeleteError : authDeleteError;
      console.error('ユーザー削除例外:', errorToLog)
      throw authDeleteError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const errorToLog = error instanceof Error ? error.stack || error : error;
    console.error('エッジ関数全体のエラー:', errorToLog)
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || '不明なエラー') }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 