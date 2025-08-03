import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string
  limit?: number
}

Deno.serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { query, limit = 20 }: SearchRequest = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }
    
    // 短すぎるクエリを拒否
    if (query.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          results: [],
          count: 0,
          query,
          message: '検索キーワードは2文字以上入力してください'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // クエリの前処理（正規化）
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    
    // クエリの長さに応じて閾値を調整
    let similarityThreshold = 0.8;
    const queryLength = normalizedQuery.length;
    
    if (queryLength <= 3) {
      // 非常に短いクエリ（「私の」など）は閾値を上げる
      similarityThreshold = 0.87;
    } else if (queryLength <= 5) {
      // 短いクエリは少し閾値を上げる
      similarityThreshold = 0.85;
    }
    
    // 検索クエリの埋め込みを生成
    console.log('Generating embedding for query:', normalizedQuery, 'threshold:', similarityThreshold)
    const session = new Supabase.ai.Session('gte-small')
    const queryEmbedding = await session.run(normalizedQuery, {
      mean_pool: true,
      normalize: true,
    })
    

    // ベクトル検索を実行
    const { data, error } = await supabase
      .rpc('vector_search_posts', {
        query_embedding: JSON.stringify(queryEmbedding),
        similarity_threshold: similarityThreshold,
        match_count: Math.min(limit, 10)
      })

    if (error) {
      console.error('Vector search error:', error)
      throw error
    }
    
    let results = data
    
    if (data && data.length > 0) {
      
      // 類似度でソート
      const sortedResults = data.sort((a: any, b: any) => b.similarity - a.similarity)
      
      
      // 短いクエリの場合は結果を厳密に制限
      let maxResults = 5;
      if (queryLength <= 3) {
        // 非常に短いクエリは最大3件
        maxResults = 3;
      } else if (queryLength <= 5) {
        // 短いクエリは最大4件
        maxResults = 4;
      }
      
      // 上位の結果のみに制限
      const topResults = sortedResults.slice(0, maxResults)
      
      results = topResults
    }

    // 著者情報を追加で取得
    if (results && results.length > 0) {
      const authorIds = [...new Set(results.map(post => post.author_id))]
      const { data: authors } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_data')
        .in('id', authorIds)

      const authorMap = new Map(authors?.map(a => [a.id, a]) || [])
      
      results = results.map(post => ({
        ...post,
        author: authorMap.get(post.author_id)
      }))
    }

    return new Response(
      JSON.stringify({ 
        results: results || [],
        count: results?.length || 0,
        query
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error searching posts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})