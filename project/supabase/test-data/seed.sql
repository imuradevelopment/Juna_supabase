-- シードデータ for 検索機能テスト
-- 注意: このファイルは開発・テスト用です。本番環境では使用しないでください。

-- テスト用投稿データ（adminユーザーで作成）
DO $$
DECLARE
  admin_id UUID;
  cat_daily_life INTEGER;
  cat_employment INTEGER;
  cat_barrier_free INTEGER;
  cat_support_tech INTEGER;
  cat_experience INTEGER;
BEGIN
  -- adminユーザーのIDを取得
  SELECT id INTO admin_id FROM profiles WHERE account_id = 'admin' LIMIT 1;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please run npm run admin:create first.';
  END IF;

  -- カテゴリの作成
  INSERT INTO categories (name, creator_id) VALUES 
    ('日常生活', admin_id),
    ('就労支援', admin_id),
    ('バリアフリー', admin_id),
    ('支援技術', admin_id),
    ('体験談', admin_id)
  ON CONFLICT (name) DO NOTHING;

  -- カテゴリIDを取得
  SELECT id INTO cat_daily_life FROM categories WHERE name = '日常生活';
  SELECT id INTO cat_employment FROM categories WHERE name = '就労支援';
  SELECT id INTO cat_barrier_free FROM categories WHERE name = 'バリアフリー';
  SELECT id INTO cat_support_tech FROM categories WHERE name = '支援技術';
  SELECT id INTO cat_experience FROM categories WHERE name = '体験談';

  -- テスト用投稿データ
  INSERT INTO posts (id, author_id, title, content, excerpt, published, published_at) VALUES 
    -- 発達障害関連
    ('a1111111-1111-1111-1111-111111111111', admin_id, 
     '発達障害と向き合う日々', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"私は30歳で発達障害（ADHD）の診断を受けました。それまでは「なぜ他の人と同じようにできないのか」と悩み続けていました。"}]},{"type":"paragraph","content":[{"type":"text","text":"診断を受けてからは、自分の特性を理解し、工夫しながら生活しています。例えば、スケジュール管理にはスマートフォンのリマインダーを活用し、タスクは細かく分割して取り組むようにしています。"}]},{"type":"paragraph","content":[{"type":"text","text":"同じような悩みを持つ方の参考になれば幸いです。"}]}]}',
     '30歳でADHDの診断を受けた経験と、日々の工夫について共有します。',
     true, NOW() - INTERVAL '10 days'),

    ('a2222222-2222-2222-2222-222222222222', admin_id, 
     '集中力を保つための環境づくり', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ADHDの特性上、集中力を維持することが困難な場合があります。私が実践している環境づくりの工夫を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"1. ノイズキャンセリングヘッドホンの使用\\n2. 作業スペースの整理整頓\\n3. ポモドーロテクニックの活用\\n4. 視覚的なタスク管理ツール"}]},{"type":"paragraph","content":[{"type":"text","text":"これらの工夫により、以前より格段に作業効率が上がりました。"}]}]}',
     'ADHDの特性に合わせた集中力維持のための環境づくりのコツ',
     true, NOW() - INTERVAL '8 days'),

    -- 車椅子・バリアフリー関連
    ('b1111111-1111-1111-1111-111111111111', admin_id, 
     '車いすでアクセスしやすい東京のカフェ10選', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"車椅子ユーザーとして、アクセシブルなカフェを見つけるのは重要です。実際に訪問した東京都内のバリアフリー対応カフェを紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"評価基準：\\n- 入口の段差の有無\\n- 通路の幅\\n- 多目的トイレの有無\\n- テーブルの高さ"}]},{"type":"paragraph","content":[{"type":"text","text":"詳細なレビューと写真付きで、安心して訪問できる情報をお届けします。"}]}]}',
     '車椅子でも安心して利用できる東京のカフェを実体験を基に紹介',
     true, NOW() - INTERVAL '7 days'),

    ('b2222222-2222-2222-2222-222222222222', admin_id, 
     'バリアフリー観光地ガイド：京都編', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"歴史的な街並みが魅力の京都ですが、車椅子での観光には工夫が必要です。実際に訪問した経験を基に、アクセシブルな観光ルートを提案します。"}]},{"type":"paragraph","content":[{"type":"text","text":"おすすめスポット：\\n- 二条城（エレベーター完備）\\n- 京都国立博物館\\n- 伏見稲荷大社（一部エリア）"}]},{"type":"paragraph","content":[{"type":"text","text":"事前の計画と情報収集で、快適な京都観光を楽しめます。"}]}]}',
     '車椅子ユーザー向けの京都観光ガイド。アクセシブルなルートを紹介',
     true, NOW() - INTERVAL '5 days'),

    -- 視覚障害関連
    ('c1111111-1111-1111-1111-111111111111', admin_id, 
     '音声読み上げソフトの比較とおすすめ設定', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"視覚障害者にとって、音声読み上げソフトは必須のツールです。主要なソフトウェアを比較し、使いやすい設定方法を解説します。"}]},{"type":"paragraph","content":[{"type":"text","text":"比較対象：\\n- NVDA（無料）\\n- JAWS（有料）\\n- PC-Talker（有料）"}]},{"type":"paragraph","content":[{"type":"text","text":"それぞれの特徴と、日本語環境での最適な設定を詳しく説明します。"}]}]}',
     '視覚障害者向けスクリーンリーダーの比較と効果的な設定方法',
     true, NOW() - INTERVAL '6 days'),

    ('c2222222-2222-2222-2222-222222222222', admin_id, 
     'スマートフォンのアクセシビリティ機能活用術', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"iPhoneとAndroidのアクセシビリティ機能を最大限活用する方法を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"便利な機能：\\n- VoiceOver / TalkBack\\n- 音声コントロール\\n- 点字ディスプレイ接続\\n- 拡大鏡機能"}]},{"type":"paragraph","content":[{"type":"text","text":"これらの機能を組み合わせることで、スマートフォンがより使いやすくなります。"}]}]}',
     '視覚障害者がスマートフォンを快適に使うためのアクセシビリティ設定',
     true, NOW() - INTERVAL '4 days'),

    -- 就労支援関連
    ('d1111111-1111-1111-1111-111111111111', admin_id, 
     '障害者雇用で働く：私の体験談', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"発達障害を持ちながら、障害者雇用枠で就職した経験を共有します。"}]},{"type":"paragraph","content":[{"type":"text","text":"就職活動のポイント：\\n- 自己理解と特性の説明\\n- 配慮事項の明確化\\n- 支援機関の活用\\n- 企業研究の重要性"}]},{"type":"paragraph","content":[{"type":"text","text":"現在は事務職として安定して働いています。適切な配慮があれば、誰もが活躍できます。"}]}]}',
     '発達障害当事者が障害者雇用で就職するまでの道のりと現在',
     true, NOW() - INTERVAL '3 days'),

    -- 支援技術関連
    ('e1111111-1111-1111-1111-111111111111', admin_id, 
     'AIアシスタントを活用した生活支援', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"音声AIアシスタント（Alexa、Google Assistant）を使った生活支援の方法を紹介します。"}]},{"type":"paragraph","content":[{"type":"text","text":"活用例：\\n- リマインダー設定\\n- ニュースの読み上げ\\n- スマートホーム制御\\n- 音楽再生"}]},{"type":"paragraph","content":[{"type":"text","text":"視覚に頼らない操作で、日常生活がより便利になります。"}]}]}',
     'AIアシスタントを使った視覚障害者の生活支援テクニック',
     true, NOW() - INTERVAL '2 days'),

    -- 最新の投稿
    ('f1111111-1111-1111-1111-111111111111', admin_id, 
     '車椅子ユーザーのための防災対策', 
     '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"災害時の備えは、車椅子ユーザーにとって特に重要です。私が実践している防災対策を共有します。"}]},{"type":"paragraph","content":[{"type":"text","text":"準備しているもの：\\n- 予備の車椅子部品\\n- 非常用スロープ\\n- 医療用品\\n- 連絡先リスト"}]},{"type":"paragraph","content":[{"type":"text","text":"日頃からの準備と情報収集が、いざという時の安心につながります。"}]}]}',
     '車椅子ユーザーが災害に備えるための具体的な対策と準備',
     true, NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- 投稿とカテゴリの関連付け
  INSERT INTO post_categories (post_id, category_id) VALUES
    ('a1111111-1111-1111-1111-111111111111', cat_daily_life),
    ('a1111111-1111-1111-1111-111111111111', cat_experience),
    ('a2222222-2222-2222-2222-222222222222', cat_daily_life),
    ('b1111111-1111-1111-1111-111111111111', cat_barrier_free),
    ('b2222222-2222-2222-2222-222222222222', cat_barrier_free),
    ('c1111111-1111-1111-1111-111111111111', cat_support_tech),
    ('c2222222-2222-2222-2222-222222222222', cat_support_tech),
    ('d1111111-1111-1111-1111-111111111111', cat_employment),
    ('e1111111-1111-1111-1111-111111111111', cat_support_tech),
    ('f1111111-1111-1111-1111-111111111111', cat_daily_life),
    ('f1111111-1111-1111-1111-111111111111', cat_barrier_free)
  ON CONFLICT DO NOTHING;

  -- ビュー数をランダムに設定
  UPDATE posts SET views = floor(random() * 500 + 50) WHERE author_id = admin_id;

END $$;