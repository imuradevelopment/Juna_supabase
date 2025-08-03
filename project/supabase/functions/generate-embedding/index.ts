import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateEmbeddingRequest {
  text: string
  postId?: string
}

Deno.serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { text, postId }: GenerateEmbeddingRequest = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Supabase AI Inferenceで埋め込みを生成
    // gte-small モデルを使用（384次元）
    const session = new Supabase.ai.Session('gte-small')
    const embedding = await session.run(text, {
      mean_pool: true,
      normalize: true,
    })

    // postIdが指定されている場合は、データベースに保存
    if (postId) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          embedding: JSON.stringify(embedding),
          embedding_generated: true 
        })
        .eq('id', postId)

      if (updateError) {
        console.error('Failed to update post embedding:', updateError)
        throw updateError
      }
    }

    return new Response(
      JSON.stringify({ 
        embedding,
        dimension: embedding.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error generating embedding:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})