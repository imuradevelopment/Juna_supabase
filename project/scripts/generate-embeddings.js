#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateEmbeddings() {
  try {
    console.log('投稿の埋め込みベクトルを生成しています...');

    // 埋め込みが未生成の投稿を取得
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content')
      .eq('embedding_generated', false)
      .eq('published', true);

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      console.log('埋め込みを生成する投稿がありません');
      return;
    }

    console.log(`${posts.length}件の投稿の埋め込みを生成します`);

    // 各投稿に対して埋め込みを生成
    for (const post of posts) {
      try {
        console.log(`処理中: ${post.title}`);

        // テキストコンテンツを抽出
        let textContent = '';
        if (typeof post.content === 'object' && post.content?.type === 'doc') {
          // TipTapのJSON形式からテキストを抽出
          textContent = extractTextFromTipTap(post.content);
        } else if (typeof post.content === 'string') {
          // HTMLからテキストを抽出（簡易的）
          textContent = post.content.replace(/<[^>]*>/g, '');
        }

        // タイトルとコンテンツを結合
        const fullText = `${post.title}\n\n${textContent}`.substring(0, 1000);

        // Edge Functionを呼び出して埋め込みを生成
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            text: fullText,
            postId: post.id
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`エラー (${post.title}):`, error);
          continue;
        }

        const result = await response.json();
        console.log(`✓ 完了: ${post.title} (${result.dimension}次元)`);

      } catch (error) {
        console.error(`エラー (${post.title}):`, error.message);
      }

      // レート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n埋め込み生成が完了しました');

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

// TipTapのJSONからテキストを抽出
function extractTextFromTipTap(doc) {
  let text = '';
  
  function extractFromNode(node) {
    if (node.text) {
      text += node.text + ' ';
    }
    if (node.content) {
      node.content.forEach(extractFromNode);
    }
  }
  
  if (doc.content) {
    doc.content.forEach(extractFromNode);
  }
  
  return text.trim();
}

// 実行
generateEmbeddings();