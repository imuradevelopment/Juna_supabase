-- 検索システムのセットアップ（Supabase AI Inferenceベクトル検索のみ）

-- pgvectorの有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 埋め込みベクトルカラムを追加
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(384);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding_generated boolean DEFAULT false;

-- ベクトル検索インデックス
CREATE INDEX IF NOT EXISTS posts_embedding_idx ON posts 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ベクトル検索関数（Supabase AI Inference専用）
CREATE OR REPLACE FUNCTION vector_search_posts(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  content jsonb,
  excerpt text,
  cover_image_path text,
  published_at timestamptz,
  author_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.excerpt,
    p.cover_image_path,
    p.published_at,
    p.author_id,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM posts p
  WHERE p.published = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > similarity_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 投稿作成・更新時に埋め込みを生成するトリガー関数
CREATE OR REPLACE FUNCTION mark_post_for_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- タイトルまたはコンテンツが変更された場合、埋め込み再生成フラグを立てる
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content)) THEN
    NEW.embedding_generated = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER mark_post_for_embedding_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION mark_post_for_embedding();