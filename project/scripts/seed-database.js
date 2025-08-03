#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  try {
    console.log('テストデータを投入しています...');
    
    // seed.sqlファイルを読み込む
    const seedFile = join(__dirname, '..', 'supabase', 'test-data', 'seed.sql');
    const seedSql = readFileSync(seedFile, 'utf8');
    
    // SQLを実行
    const { error } = await supabase.rpc('exec_sql', { sql: seedSql });
    
    if (error) {
      // exec_sql RPCが存在しない場合は、個別にクエリを実行
      console.log('直接SQLを実行できないため、JavaScript実装でデータを投入します...');
      
      // adminユーザーのIDを取得
      const { data: admin, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('account_id', 'admin')
        .single();
        
      if (adminError || !admin) {
        throw new Error('Admin user not found. Please run npm run admin:create first.');
      }
      
      const adminId = admin.id;
      
      // カテゴリの作成
      const categories = [
        { name: '日常生活', creator_id: adminId },
        { name: '就労支援', creator_id: adminId },
        { name: 'バリアフリー', creator_id: adminId },
        { name: '支援技術', creator_id: adminId },
        { name: '体験談', creator_id: adminId }
      ];
      
      const { data: createdCategories, error: catError } = await supabase
        .from('categories')
        .upsert(categories, { onConflict: 'name' })
        .select();
        
      if (catError) throw catError;
      
      // カテゴリIDマップを作成
      const categoryMap = {};
      createdCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });
      
      // テスト投稿データ
      const posts = [
        {
          id: 'a1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: '発達障害と向き合う日々',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"私は30歳で発達障害（ADHD）の診断を受けました。それまでは「なぜ他の人と同じようにできないのか」と悩み続けていました。"}]},{"type":"paragraph","content":[{"type":"text","text":"診断を受けてからは、自分の特性を理解し、工夫しながら生活しています。例えば、スケジュール管理にはスマートフォンのリマインダーを活用し、タスクは細かく分割して取り組むようにしています。"}]},{"type":"paragraph","content":[{"type":"text","text":"同じような悩みを持つ方の参考になれば幸いです。"}]}]},
          excerpt: '30歳でADHDの診断を受けた経験と、日々の工夫について共有します。',
          published: true,
          published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'a2222222-2222-2222-2222-222222222222',
          author_id: adminId,
          title: '集中力を保つための環境づくり',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ADHDの特性上、集中力を維持することが困難な場合があります。私が実践している環境づくりの工夫を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"1. ノイズキャンセリングヘッドホンの使用\\n2. 作業スペースの整理整頓\\n3. ポモドーロテクニックの活用\\n4. 視覚的なタスク管理ツール"}]},{"type":"paragraph","content":[{"type":"text","text":"これらの工夫により、以前より格段に作業効率が上がりました。"}]}]},
          excerpt: 'ADHDの特性に合わせた集中力維持のための環境づくりのコツ',
          published: true,
          published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'b1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: '車いすでアクセスしやすい東京のカフェ10選',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"車椅子ユーザーとして、アクセシブルなカフェを見つけるのは重要です。実際に訪問した東京都内のバリアフリー対応カフェを紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"評価基準：\\n- 入口の段差の有無\\n- 通路の幅\\n- 多目的トイレの有無\\n- テーブルの高さ"}]},{"type":"paragraph","content":[{"type":"text","text":"詳細なレビューと写真付きで、安心して訪問できる情報をお届けします。"}]}]},
          excerpt: '車椅子でも安心して利用できる東京のカフェを実体験を基に紹介',
          published: true,
          published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'b2222222-2222-2222-2222-222222222222',
          author_id: adminId,
          title: 'バリアフリー観光地ガイド：京都編',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"歴史的な街並みが魅力の京都ですが、車椅子での観光には工夫が必要です。実際に訪問した経験を基に、アクセシブルな観光ルートを提案します。"}]},{"type":"paragraph","content":[{"type":"text","text":"おすすめスポット：\\n- 二条城（エレベーター完備）\\n- 京都国立博物館\\n- 伏見稲荷大社（一部エリア）"}]},{"type":"paragraph","content":[{"type":"text","text":"事前の計画と情報収集で、快適な京都観光を楽しめます。"}]}]},
          excerpt: '車椅子ユーザー向けの京都観光ガイド。アクセシブルなルートを紹介',
          published: true,
          published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: '音声読み上げソフトの比較とおすすめ設定',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"視覚障害者にとって、音声読み上げソフトは必須のツールです。主要なソフトウェアを比較し、使いやすい設定方法を解説します。"}]},{"type":"paragraph","content":[{"type":"text","text":"比較対象：\\n- NVDA（無料）\\n- JAWS（有料）\\n- PC-Talker（有料）"}]},{"type":"paragraph","content":[{"type":"text","text":"それぞれの特徴と、日本語環境での最適な設定を詳しく説明します。"}]}]},
          excerpt: '視覚障害者向けスクリーンリーダーの比較と効果的な設定方法',
          published: true,
          published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'c2222222-2222-2222-2222-222222222222',
          author_id: adminId,
          title: 'スマートフォンのアクセシビリティ機能活用術',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"iPhoneとAndroidのアクセシビリティ機能を最大限活用する方法を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"便利な機能：\\n- VoiceOver / TalkBack\\n- 音声コントロール\\n- 点字ディスプレイ接続\\n- 拡大鏡機能"}]},{"type":"paragraph","content":[{"type":"text","text":"これらの機能を組み合わせることで、スマートフォンがより使いやすくなります。"}]}]},
          excerpt: '視覚障害者がスマートフォンを快適に使うためのアクセシビリティ設定',
          published: true,
          published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'd1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: '障害者雇用で働く：私の体験談',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"発達障害を持ちながら、障害者雇用枠で就職した経験を共有します。"}]},{"type":"paragraph","content":[{"type":"text","text":"就職活動のポイント：\\n- 自己理解と特性の説明\\n- 配慮事項の明確化\\n- 支援機関の活用\\n- 企業研究の重要性"}]},{"type":"paragraph","content":[{"type":"text","text":"現在は事務職として安定して働いています。適切な配慮があれば、誰もが活躍できます。"}]}]},
          excerpt: '発達障害当事者が障害者雇用で就職するまでの道のりと現在',
          published: true,
          published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'e1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: 'AIアシスタントを活用した生活支援',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"音声AIアシスタント（Alexa、Google Assistant）を使った生活支援の方法を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"活用例：\\n- リマインダー設定\\n- ニュースの読み上げ\\n- スマートホーム制御\\n- 音楽再生"}]},{"type":"paragraph","content":[{"type":"text","text":"視覚に頼らない操作で、日常生活がより便利になります。"}]}]},
          excerpt: 'AIアシスタントを使った視覚障害者の生活支援テクニック',
          published: true,
          published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'f1111111-1111-1111-1111-111111111111',
          author_id: adminId,
          title: '車椅子ユーザーのための防災対策',
          content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"災害時の備えは、車椅子ユーザーにとって特に重要です。私が実践している防災対策を共有します。"}]},{"type":"paragraph","content":[{"type":"text","text":"準備しているもの：\\n- 予備の車椅子部品\\n- 非常用スロープ\\n- 医療用品\\n- 連絡先リスト"}]},{"type":"paragraph","content":[{"type":"text","text":"日頃からの準備と情報収集が、いざという時の安心につながります。"}]}]},
          excerpt: '車椅子ユーザーが災害に備えるための具体的な対策と準備',
          published: true,
          published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // 投稿を作成
      const { error: postsError } = await supabase
        .from('posts')
        .upsert(posts, { onConflict: 'id' });
        
      if (postsError) throw postsError;
      
      // 投稿とカテゴリの関連付け
      const postCategories = [
        { post_id: 'a1111111-1111-1111-1111-111111111111', category_id: categoryMap['日常生活'] },
        { post_id: 'a1111111-1111-1111-1111-111111111111', category_id: categoryMap['体験談'] },
        { post_id: 'a2222222-2222-2222-2222-222222222222', category_id: categoryMap['日常生活'] },
        { post_id: 'b1111111-1111-1111-1111-111111111111', category_id: categoryMap['バリアフリー'] },
        { post_id: 'b2222222-2222-2222-2222-222222222222', category_id: categoryMap['バリアフリー'] },
        { post_id: 'c1111111-1111-1111-1111-111111111111', category_id: categoryMap['支援技術'] },
        { post_id: 'c2222222-2222-2222-2222-222222222222', category_id: categoryMap['支援技術'] },
        { post_id: 'd1111111-1111-1111-1111-111111111111', category_id: categoryMap['就労支援'] },
        { post_id: 'e1111111-1111-1111-1111-111111111111', category_id: categoryMap['支援技術'] },
        { post_id: 'f1111111-1111-1111-1111-111111111111', category_id: categoryMap['日常生活'] },
        { post_id: 'f1111111-1111-1111-1111-111111111111', category_id: categoryMap['バリアフリー'] }
      ];
      
      const { error: pcError } = await supabase
        .from('post_categories')
        .upsert(postCategories, { onConflict: 'post_id,category_id' });
        
      if (pcError) throw pcError;
      
      // ビュー数をランダムに設定
      for (const post of posts) {
        const views = Math.floor(Math.random() * 500 + 50);
        await supabase
          .from('posts')
          .update({ views })
          .eq('id', post.id);
      }
      
      console.log('✓ テストデータの投入が完了しました');
      console.log(`  - ${categories.length}個のカテゴリ`);
      console.log(`  - ${posts.length}個の投稿`);
    }
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
}

// 実行
seedDatabase();