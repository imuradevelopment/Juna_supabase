# セットアップ

## デプロイ情報
- [Netlify管理パネル](https://app.netlify.com/sites/juna-supabase/overview)
- [デプロイされたサイト](https://juna-supabase.netlify.app/)

## 依存関係をインストール
```bash
cd project
npm install
```

## supabaseで新しいプロジェクトを作成
1. 「.env.example」から「.env」ファイルを作成
2. supabaseから値を取得し「.env」ファイルを編集

## supabaseにDBをマイグレーション
```bash
cd project
supabase link
supabase db push --include-all
```

## supabaseにfunctionsをデプロイ
```bash
supabase functions deploy register-user --project-ref SUPABASE_PROJECT_IDの値
supabase functions deploy login-with-account --project-ref SUPABASE_PROJECT_IDの値
supabase functions deploy delete-user --project-ref SUPABASE_PROJECT_IDの値
```

## ローカルサーバーを起動
```bash
cd project
npm run dev
```

## スキーマ

- 初期スキーマ
```sql
-- 拡張機能と基本設定
-- 拡張機能と基本設定
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 日本語検索用の設定
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION japanese (COPY = pg_catalog.simple);
  END IF;
END $$;

-- ユーティリティ関数（事前定義）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ストレージバケット設定
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile_images', 'プロフィール画像', true);

INSERT INTO storage.buckets (id, name, public) VALUES 
('post_images', '投稿画像', true);

INSERT INTO storage.buckets (id, name, public) VALUES 
('cover_images', 'アイキャッチ画像', true);

-- ストレージポリシー設定
CREATE POLICY "プロフィール画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'profile_images');

CREATE POLICY "ユーザーは自分のプロフィール画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分のプロフィール画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'profile_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "投稿画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'post_images');

CREATE POLICY "ユーザーは自分の投稿画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分の投稿画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'post_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "アイキャッチ画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'cover_images');

CREATE POLICY "ユーザーは自分のアイキャッチ画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'cover_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分のアイキャッチ画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'cover_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- セキュリティ関数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(uid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = uid AND admin_level = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_post_author(uid uuid, p_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM posts WHERE id = p_id AND author_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_post_published(p_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM posts WHERE id = p_id AND published = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_delete_comment(comment_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  is_parent_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM comments WHERE id = comment_id AND author_id = user_id
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM comments c
    JOIN comments parent ON c.parent_comment_id = parent.id
    WHERE c.id = comment_id AND parent.author_id = user_id
  ) INTO is_parent_owner;
  
  RETURN is_parent_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  account_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_data TEXT,
  bio TEXT,
  personal_attributes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TRIGGER update_profile_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールは誰でも参照可能" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "認証済みユーザーのみプロフィール作成可能" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能" 
  ON profiles FOR DELETE USING (auth.uid() = id);

-- 管理者ユーザーテーブル
CREATE TABLE admin_users (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  admin_level TEXT NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT admin_level_check CHECK (admin_level IN ('moderator', 'super_admin'))
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "初期セットアップ用参照ポリシー" 
  ON admin_users FOR SELECT 
  USING (true);

CREATE POLICY "スーパー管理者のみ管理者追加可能" 
  ON admin_users FOR INSERT 
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "スーパー管理者のみ管理者更新可能" 
  ON admin_users FOR UPDATE 
  USING (is_super_admin(auth.uid()));

CREATE POLICY "スーパー管理者のみ管理者削除可能" 
  ON admin_users FOR DELETE 
  USING (is_super_admin(auth.uid()));

-- フォロー関係テーブル
CREATE TABLE followers (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 行レベルセキュリティを有効化
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- セキュリティポリシーを設定
CREATE POLICY "フォロー関係は誰でも参照可能" 
  ON followers FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみフォロー可能" 
  ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "自分のフォローのみ削除可能" 
  ON followers FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "管理者は全てのフォロー関係を操作可能" 
  ON followers FOR ALL 
  USING (is_admin(auth.uid()));

-- カテゴリテーブル
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  creator_id UUID REFERENCES profiles(id)
);

CREATE TRIGGER update_category_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "カテゴリは誰でも参照可能" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーはカテゴリを作成可能" 
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "作成者と管理者はカテゴリを更新可能" 
  ON categories FOR UPDATE 
  USING (creator_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "作成者と管理者はカテゴリを削除可能" 
  ON categories FOR DELETE 
  USING (creator_id = auth.uid() OR is_admin(auth.uid()));

-- ブログ投稿テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  excerpt TEXT,
  cover_image_path TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  views INTEGER DEFAULT 0,
  last_edited_by UUID REFERENCES auth.users(id),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') || 
    setweight(to_tsvector('simple', coalesce(cast(content->>'text' as text), '')), 'B')
  ) STORED
);

CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);

CREATE TRIGGER update_post_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公開済み投稿は誰でも参照可能" 
  ON posts FOR SELECT USING (published = true);

CREATE POLICY "非公開投稿は作者のみ参照可能" 
  ON posts FOR SELECT USING (auth.uid() = author_id AND published = false);

CREATE POLICY "認証済みユーザーのみ投稿作成可能" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿更新可能" 
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿削除可能" 
  ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "管理者は全ての投稿を操作可能" 
  ON posts FOR ALL 
  USING (is_admin(auth.uid()));

-- 投稿カテゴリ関連テーブル
CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿カテゴリは誰でも参照可能" 
  ON post_categories FOR SELECT USING (true);

CREATE POLICY "作者のみ投稿カテゴリ追加可能" 
  ON post_categories FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "作者のみ投稿カテゴリ削除可能" 
  ON post_categories FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "管理者は全ての投稿カテゴリを操作可能" 
  ON post_categories FOR ALL 
  USING (is_admin(auth.uid()));

-- カテゴリのお気に入り機能
CREATE TABLE favorite_categories (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, category_id)
);

ALTER TABLE favorite_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "お気に入りカテゴリは誰でも参照可能" 
  ON favorite_categories FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分のお気に入りカテゴリのみ作成可能" 
  ON favorite_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のお気に入りカテゴリのみ削除可能" 
  ON favorite_categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "管理者は全てのお気に入りカテゴリを操作可能" 
  ON favorite_categories FOR ALL 
  USING (is_admin(auth.uid()));

-- 属性タイプテーブル
CREATE TABLE attribute_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  creator_id UUID REFERENCES profiles(id)
);

ALTER TABLE attribute_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "属性タイプは誰でも参照可能" 
  ON attribute_types FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーは属性タイプを作成可能" 
  ON attribute_types FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "作成者と管理者は属性タイプを更新可能" 
  ON attribute_types FOR UPDATE 
  USING (creator_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "作成者と管理者は属性タイプを削除可能" 
  ON attribute_types FOR DELETE 
  USING (creator_id = auth.uid() OR is_admin(auth.uid()));

-- ユーザーと属性タイプの多対多関連テーブル
CREATE TABLE user_attributes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attribute_type_id INTEGER REFERENCES attribute_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, attribute_type_id)
);

-- 行レベルセキュリティを有効化
ALTER TABLE user_attributes ENABLE ROW LEVEL SECURITY;

-- セキュリティポリシーを設定
CREATE POLICY "ユーザー属性は誰でも参照可能" 
  ON user_attributes FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分の属性のみ作成可能" 
  ON user_attributes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の属性のみ削除可能" 
  ON user_attributes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "管理者は全てのユーザー属性を操作可能" 
  ON user_attributes FOR ALL 
  USING (is_admin(auth.uid()));

-- 投稿画像テーブル（修正版）
CREATE TABLE post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  image_path TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿画像は誰でも参照可能" 
  ON post_images FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ投稿画像追加可能" 
  ON post_images FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿画像更新可能" 
  ON post_images FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿画像削除可能" 
  ON post_images FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "管理者は全ての投稿画像を操作可能" 
  ON post_images FOR ALL 
  USING (is_admin(auth.uid()));

-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

CREATE TRIGGER update_comment_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントは誰でも参照可能" 
  ON comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND published = true
    ) OR 
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "認証済みユーザーのみコメント可能" 
  ON comments FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM posts WHERE id = post_id AND published = true
      ) OR 
      EXISTS (
        SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
      )
    )
  );

CREATE POLICY "自分のコメントのみ更新可能" 
  ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "自分のコメントのみ削除可能" 
  ON comments FOR DELETE USING (
    auth.uid() = author_id OR 
    can_delete_comment(id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "管理者は全てのコメントを操作可能" 
  ON comments FOR ALL 
  USING (is_admin(auth.uid()));

-- 投稿いいねテーブル
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿いいねは誰でも参照可能" 
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみいいね可能" 
  ON post_likes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts p WHERE p.id = post_id AND p.published = true
    )
  );

CREATE POLICY "自分のいいねのみ削除可能" 
  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- コメントいいねテーブル
CREATE TABLE comment_likes (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントいいねは誰でも参照可能" 
  ON comment_likes FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみコメントにいいね可能" 
  ON comment_likes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = comment_id AND p.published = true
    )
  );

CREATE POLICY "自分のコメントいいねのみ削除可能" 
  ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- トリガー関数
CREATE OR REPLACE FUNCTION link_post_images_on_post_create()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE post_images
  SET post_id = NEW.id
  WHERE author_id = NEW.author_id AND post_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER link_post_images_on_post_create
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION link_post_images_on_post_create();

CREATE OR REPLACE FUNCTION delete_post_images_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  image_record RECORD;
BEGIN
  FOR image_record IN SELECT image_path FROM post_images WHERE post_id = OLD.id LOOP
    DELETE FROM storage.objects WHERE name = image_record.image_path;
  END LOOP;
  
  IF OLD.cover_image_path IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = OLD.cover_image_path;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delete_post_images_from_storage
BEFORE DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION delete_post_images_from_storage();

-- 既存のデータに作成者情報を設定するトリガー関数
CREATE OR REPLACE FUNCTION set_creator_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 属性タイプとカテゴリの作成者を自動設定するトリガー
CREATE TRIGGER set_attribute_type_creator
BEFORE INSERT ON attribute_types
FOR EACH ROW EXECUTE FUNCTION set_creator_id();

CREATE TRIGGER set_category_creator
BEFORE INSERT ON categories
FOR EACH ROW EXECUTE FUNCTION set_creator_id();

-- ユーティリティ関数
CREATE OR REPLACE FUNCTION search_posts(search_term TEXT)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE published = true 
    AND search_vector @@ plainto_tsquery('simple', search_term)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', search_term)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_related_posts(post_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  WITH post_categories AS (
    SELECT category_id FROM post_categories WHERE post_id = get_related_posts.post_id
  )
  SELECT DISTINCT p.*
  FROM posts p
  JOIN post_categories pc ON p.id = pc.post_id
  WHERE p.published = true
    AND p.id != get_related_posts.post_id
    AND pc.category_id IN (SELECT category_id FROM post_categories)
  ORDER BY 
    (SELECT COUNT(*) FROM post_categories pc2 
     WHERE pc2.post_id = p.id AND pc2.category_id IN (SELECT category_id FROM post_categories)) DESC,
    p.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION bootstrap_admin(admin_email text, admin_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users) THEN
    INSERT INTO admin_users (user_id, email, admin_level, created_by)
    VALUES (admin_id, admin_email, 'super_admin', admin_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーティリティ関数：フォロワー数取得
CREATE OR REPLACE FUNCTION get_follower_count(profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM followers 
    WHERE following_id = profile_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーティリティ関数：フォロー数取得
CREATE OR REPLACE FUNCTION get_following_count(profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM followers 
    WHERE follower_id = profile_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーティリティ関数：フォロー確認
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM followers 
    WHERE follower_id = follower AND following_id = following
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- メンション検出機能
CREATE OR REPLACE FUNCTION extract_mentions(text_content TEXT)
RETURNS SETOF TEXT AS $$
DECLARE
  mentions TEXT[];
  mention TEXT;
BEGIN
  -- @username形式のメンションを抽出
  SELECT ARRAY(
    SELECT regexp_matches(text_content, '@([a-zA-Z0-9_]+)', 'g')
  ) INTO mentions;
  
  -- 結果を平坦化
  FOREACH mention IN ARRAY mentions LOOP
    RETURN NEXT mention;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Realtimeサブスクリプション設定
ALTER PUBLICATION supabase_realtime ADD TABLE posts, comments, post_likes, comment_likes, user_attributes, followers, favorite_categories;

--------------------------------------------------
-- 管理者設定（本番環境で有効化）
--------------------------------------------------
-- 最初のスーパー管理者設定（本番環境で適切なユーザーIDとメールアドレスに置き換える）
-- INSERT INTO admin_users (user_id, email, admin_level, created_by) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'super_admin', '00000000-0000-0000-0000-000000000000');

-- または、より安全な方法として、bootstrap_admin関数を使用
-- SELECT bootstrap_admin('admin@example.com', '00000000-0000-0000-0000-000000000000');
```

- WebPushスキーマ
```sql
-- WebPush通知機能拡張スキーマ
-- 依存関係: 20250316073437_initial_schema.sql

-- 通知タイプENUM
CREATE TYPE notification_type AS ENUM (
  'comment', 'post_like', 'comment_like', 'comment_reply', 'follow',
  'system_message', 'mention', 'followed_user_post', 'category_new_post'
);

-- 通知テーブル
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  action_url TEXT,
  data JSONB DEFAULT '{}',
  web_push_status TEXT,
  web_push_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の通知のみ参照可能" 
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分の通知のみ更新可能" 
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "システムによる通知作成を許可" 
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "自分の通知のみ削除可能"
  ON notifications FOR DELETE USING (auth.uid() = user_id);

-- WebPush購読情報テーブル
CREATE TABLE web_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE web_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のWebPush購読情報のみ参照可能" 
  ON web_push_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のWebPush購読情報のみ作成可能" 
  ON web_push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のWebPush購読情報のみ更新可能" 
  ON web_push_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のWebPush購読情報のみ削除可能" 
  ON web_push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- WebPush送信キュー
CREATE TABLE web_push_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES web_push_subscriptions(id) ON DELETE CASCADE NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 通知生成トリガー
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, content, type, related_post_id, related_comment_id)
    VALUES (
      (SELECT author_id FROM posts WHERE id = NEW.post_id),
      '投稿にコメントがつきました',
      'comment',
      NEW.post_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_comment_notification
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

CREATE OR REPLACE FUNCTION create_post_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, content, type, related_post_id)
    VALUES (
      (SELECT author_id FROM posts WHERE id = NEW.post_id),
      '投稿にいいねがつきました',
      'post_like',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_post_like_notification
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION create_post_like_notification();

CREATE OR REPLACE FUNCTION create_comment_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT author_id FROM comments WHERE id = NEW.comment_id) THEN
    INSERT INTO notifications (user_id, content, type, related_comment_id)
    VALUES (
      (SELECT author_id FROM comments WHERE id = NEW.comment_id),
      'コメントにいいねがつきました',
      'comment_like',
      NEW.comment_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_comment_like_notification
AFTER INSERT ON comment_likes
FOR EACH ROW EXECUTE FUNCTION create_comment_like_notification();

CREATE OR REPLACE FUNCTION process_comment_replies()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_comment_id IS NOT NULL THEN
      IF NEW.author_id != (SELECT author_id FROM comments WHERE id = NEW.parent_comment_id) THEN
        INSERT INTO notifications (
          user_id, 
          content,
          type,
          related_post_id,
          related_comment_id
        )
        VALUES (
          (SELECT author_id FROM comments WHERE id = NEW.parent_comment_id),
          'コメントに返信がつきました',
          'comment_reply',
          NEW.post_id,
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_reply_added
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION process_comment_replies();

CREATE OR REPLACE FUNCTION process_comment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications 
  WHERE related_comment_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_deleted
BEFORE DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION process_comment_deletion();

-- フォロー通知トリガー
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, content, type)
  VALUES (
    NEW.following_id,
    'あなたをフォローしました',
    'follow'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_follow_notification
AFTER INSERT ON followers
FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- メンション処理
CREATE OR REPLACE FUNCTION process_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_account TEXT;
  mentioned_user_id UUID;
BEGIN
  FOR mentioned_account IN SELECT * FROM extract_mentions(NEW.content) LOOP
    -- アカウントIDからユーザーIDを取得
    SELECT id INTO mentioned_user_id 
    FROM profiles 
    WHERE account_id = mentioned_account;
    
    -- ユーザーが存在し、自分自身でなければ通知
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
      INSERT INTO notifications (
        user_id, 
        actor_id,
        content, 
        type, 
        related_post_id,
        related_comment_id
      )
      VALUES (
        mentioned_user_id,
        NEW.author_id,
        'コメントであなたがメンションされました',
        'mention',
        NEW.post_id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_mentions
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION process_comment_mentions();

CREATE OR REPLACE FUNCTION process_post_mentions()
RETURNS TRIGGER AS $$
DECLARE
  content_text TEXT;
  mentioned_account TEXT;
  mentioned_user_id UUID;
BEGIN
  -- JSONBからテキスト部分を抽出
  content_text := NEW.content->>'text';
  
  IF content_text IS NOT NULL THEN
    FOR mentioned_account IN SELECT * FROM extract_mentions(content_text) LOOP
      -- アカウントIDからユーザーIDを取得
      SELECT id INTO mentioned_user_id 
      FROM profiles 
      WHERE account_id = mentioned_account;
      
      -- ユーザーが存在し、自分自身でなければ通知
      IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
        INSERT INTO notifications (
          user_id, 
          actor_id,
          content, 
          type, 
          related_post_id
        )
        VALUES (
          mentioned_user_id,
          NEW.author_id,
          '投稿であなたがメンションされました',
          'mention',
          NEW.id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_mentions
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION process_post_mentions();

-- フォローユーザーの新規投稿通知
CREATE OR REPLACE FUNCTION notify_followers_of_new_post()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
BEGIN
  -- 投稿が公開状態の場合のみ通知
  IF NEW.published = true THEN
    FOR follower_record IN 
      SELECT follower_id 
      FROM followers 
      WHERE following_id = NEW.author_id
    LOOP
      INSERT INTO notifications (
        user_id, 
        actor_id,
        content, 
        type, 
        related_post_id,
        data
      )
      VALUES (
        follower_record.follower_id,
        NEW.author_id,
        'フォロー中のユーザーが新しい投稿を公開しました',
        'followed_user_post',
        NEW.id,
        jsonb_build_object('title', NEW.title)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_published_notify_followers
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW
WHEN (NEW.published = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.published = false)))
EXECUTE FUNCTION notify_followers_of_new_post();

-- お気に入りカテゴリの新規投稿通知
CREATE OR REPLACE FUNCTION notify_category_favorites()
RETURNS TRIGGER AS $$
DECLARE
  category_id INTEGER;
  user_record RECORD;
BEGIN
  IF NEW.published = true THEN
    FOR category_id IN 
      SELECT pc.category_id 
      FROM post_categories pc 
      WHERE pc.post_id = NEW.id
    LOOP
      FOR user_record IN 
        SELECT fc.user_id 
        FROM favorite_categories fc 
        WHERE fc.category_id = category_id AND fc.user_id != NEW.author_id
      LOOP
        -- 重複チェック：既に同じ投稿とカテゴリで通知が存在するか確認
        IF NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE user_id = user_record.user_id 
            AND related_post_id = NEW.id
            AND type = 'category_new_post'
            AND (data->>'category_id')::integer = category_id
            AND created_at > (NOW() - interval '1 hour')
        ) THEN
          INSERT INTO notifications (
            user_id, 
            actor_id,
            content, 
            type, 
            related_post_id,
            data
          )
          VALUES (
            user_record.user_id,
            NEW.author_id,
            'お気に入りカテゴリに新しい投稿がありました',
            'category_new_post',
            NEW.id,
            jsonb_build_object(
              'title', NEW.title, 
              'category_id', category_id,
              'category_name', (SELECT name FROM categories WHERE id = category_id)
            )
          );
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_published_notify_category_favorites
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW
WHEN (NEW.published = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.published = false)))
EXECUTE FUNCTION notify_category_favorites();

-- お気に入りカテゴリと投稿が関連付けられた場合の通知
CREATE OR REPLACE FUNCTION notify_category_favorites_on_categorize()
RETURNS TRIGGER AS $$
DECLARE
  post_record RECORD;
  user_record RECORD;
BEGIN
  -- 関連付けられた投稿情報を取得
  SELECT * INTO post_record 
  FROM posts 
  WHERE id = NEW.post_id;
  
  -- 投稿が公開状態の場合のみ通知
  IF post_record.published = true THEN
    -- カテゴリをお気に入りにしているユーザーに通知
    FOR user_record IN 
      SELECT fc.user_id 
      FROM favorite_categories fc 
      WHERE fc.category_id = NEW.category_id AND fc.user_id != post_record.author_id
    LOOP
      -- 重複チェック：既に同じ投稿とカテゴリで通知が存在するか確認
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = user_record.user_id 
          AND related_post_id = NEW.post_id
          AND type = 'category_new_post'
          AND (data->>'category_id')::integer = NEW.category_id
          AND created_at > (NOW() - interval '1 hour')
      ) THEN
        INSERT INTO notifications (
          user_id, 
          actor_id,
          content, 
          type, 
          related_post_id,
          data
        )
        VALUES (
          user_record.user_id,
          post_record.author_id,
          'お気に入りカテゴリに新しい投稿がありました',
          'category_new_post',
          NEW.post_id,
          jsonb_build_object(
            'title', post_record.title, 
            'category_id', NEW.category_id,
            'category_name', (SELECT name FROM categories WHERE id = NEW.category_id)
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_categorized
AFTER INSERT ON post_categories
FOR EACH ROW
EXECUTE FUNCTION notify_category_favorites_on_categorize();

-- システムメッセージ送信ユーティリティ関数
CREATE OR REPLACE FUNCTION send_system_message(message_content TEXT, target_users TEXT DEFAULT 'all')
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF target_users = 'all' THEN
    FOR user_record IN SELECT id FROM profiles LOOP
      INSERT INTO notifications (user_id, content, type, data)
      VALUES (
        user_record.id,
        message_content,
        'system_message',
        jsonb_build_object('sender', 'system', 'importance', 'normal')
      );
    END LOOP;
  ELSIF target_users = 'admins' THEN
    FOR user_record IN SELECT user_id AS id FROM admin_users LOOP
      INSERT INTO notifications (user_id, content, type, data)
      VALUES (
        user_record.id,
        message_content,
        'system_message',
        jsonb_build_object('sender', 'system', 'importance', 'high')
      );
    END LOOP;
  ELSE
    -- カスタムユーザーグループに対するメッセージ送信を将来実装可能
    RAISE EXCEPTION 'Unsupported target_users: %', target_users;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- WebPush通知トリガー関数
CREATE OR REPLACE FUNCTION queue_web_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  subscription_record RECORD;
  payload JSONB;
BEGIN
  -- 通知タイプに応じたペイロードを作成
  payload := jsonb_build_object(
    'title', 'お知らせ',
    'body', NEW.content,
    'data', jsonb_build_object(
      'notification_id', NEW.id,
      'type', NEW.type,
      'action_url', NEW.action_url
    )
  );
  
  -- ユーザーのすべての購読を取得
  FOR subscription_record IN 
    SELECT * FROM web_push_subscriptions WHERE user_id = NEW.user_id
  LOOP
    -- キューに登録
    INSERT INTO web_push_queue (
      notification_id, 
      subscription_id, 
      payload
    )
    VALUES (
      NEW.id,
      subscription_record.id,
      payload
    );
  END LOOP;
  
  -- 通知のWebPushステータスを更新
  UPDATE notifications
  SET web_push_status = 'queued'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER queue_web_push_notification
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION queue_web_push_notification();

-- WebPush管理機能
CREATE OR REPLACE FUNCTION delete_old_push_subscriptions(days_threshold INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM web_push_subscriptions
  WHERE last_used_at < NOW() - (days_threshold * interval '1 day')
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 通知ユーティリティ拡張
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(for_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = for_user_id AND is_read = false
  RETURNING COUNT(*) INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtimeサブスクリプション設定
ALTER PUBLICATION supabase_realtime ADD TABLE notifications, web_push_subscriptions, web_push_queue; 
```

## 機能改善

- リアルタイム購読の使用
- WebPush通知の実装
- 管理者ページの実装
- フォローの概念
- 通知機能の集約
    - @useNotification.ts useNotification.tsを使用してユーザーに対する通知を一元化してください。入力フィールド固有の物などはそのままにしてください。

- リンクの更新
    - @index.ts index.tsに記載されているページ以外に遷移していませんか？

- 画像対応フォーマットの拡張
    - @useImageUpload.ts useImageUpload.tsで下記のフォーマットに対応してください。 
    ```markdown
        # 対応フォーマット一覧（全27種類）

        1. original（オリジナル形式を維持）
        2. webp（WebP）
        3. jpeg/jpg（JPEG）
        4. png（PNG）
        5. gif（GIF）
        6. bmp（BMP）
        7. tiff/tif（TIFF）
        8. avif（AVIF）
        9. heic（HEIC - Apple）
        10. heif（HEIF - 高効率画像形式）
        11. svg（SVG - ベクター画像）
        12. ico（アイコン）
        13. apng（アニメーションPNG）
        14. jxl（JPEG XL）
        15. jp2（JPEG 2000）
        16. jpx（JPEG 2000 Part-2）
        17. j2k（JPEG 2000 CodeStream）
        18. jxr（JPEG XR）
        19. wdp（Windows Digital Photo - JPEG XRの別名）
        20. dng（Adobe Digital Negative - RAW）
        21. arw（Sony Alpha RAW）
        22. cr2/cr3（Canon RAW）
        23. nef（Nikon Electronic Format - RAW）
        24. orf（Olympus RAW Format）
        25. raf（Fuji RAW Format）
        26. rw2（Panasonic RAW）
        27. pef（Pentax Electronic Format）
        28. srw（Samsung RAW）
        29. raw（汎用RAW形式）
    ```


## よく使うプロンプト


### DB関連

#### supabaseスキーマの把握
@20250320142446_initial_schema.sql supabaseスキーマを日本語検索用の設定、ユーティリティ関数、ストレージバケット設定、ストレージポリシー設定、セキュリティ関数、カラムを含むテーブル詳細、RLS、ポリシー、トリガー、インデックス、タイプ、トリガー関数、Realtimeサブスクリプション設定などを含めて、完全に把握してください。スキーマは修正しないでください。


### デザイン関連

#### カラーの統一とモバイルファースト対応
@tailwind.config.js コンテキストに追加したコンポーネントのカラー使用箇所でカラーをハードコーディングしている箇所や、tailwind.config.jsの「colors:」を使用していない箇所、tailwind.cssのユーティリティカラークラスを使用している箇所があれば修正してください。カラーを使用する際は全てtailwind.config.jsのクラスを使用してください。クラスの記載順は「コンポーネント内に定義されたtailwindcss以外のクラス名 + モバイルファーストの原則に基づき、各プロパティカテゴリ（ポジション、ディスプレイ、フレックス、グリッド、幅、高さ、マージン、パディング、ボーダー、角丸、背景、テキスト、色、タイポグラフィ、間隔、効果、トランジション、アニメーション、ホバー状態、フォーカス、アクセシビリティ）ごとにグループ化し、各グループ内では基本スタイル（プレフィックスなし）を最小画面サイズ（モバイル）向けに定義してから、レスポンシブバリアント（sm:、md:、lg:、xl:、2xl:）を画面サイズの小さい順に並べる。」でお願いします。機能は絶対に変更しないでください。tailwind.config.jsは修正しないで下さい。


### 機能関連

#### アプリ骨格
@Notifications.vue @Navbar.vue @Footer.vue @auth.ts @App.vue @useNotification.ts @main.ts @index.html @tailwind.config.js @index.ts @storage.ts @supabase.ts アプリケーションの骨格です。どのようになっていますか？説明してください。

#### 認証ページ
@AuthPage.vue @useNotification.ts @auth.ts @index.ts @tailwind.config.js @storage.ts @supabase.ts これは認証ページです。どのようになっていますか？説明してください。

#### ダッシュボードページ
@DashboardPage.vue @useNotification.ts @auth.ts @DashboardPostsList.vue @DashboardDraftsList.vue @DashboardCommentsList.vue @DashboardLikesList.vue @DashboardStatistics.vue @index.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはダッシュボードページです。どのようになっていますか？説明してください。

#### ホームページ
@HomePage.vue @useNotification.ts @supabase.ts @PostCard.vue @index.ts  @tailwind.config.js @storage.ts @auth.ts これはホームページです。どのようになっていますか？説明してください。

#### NotFoundページ
@NotFoundPage.vue @useNotification.ts @index.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはNotFoundページです。どのようになっていますか？説明してください。

#### 投稿詳細ページ
@PostDetailPage.vue @useNotification.ts @supabase.ts @auth.ts @RichTextContent.vue @CommentSystem.vue @CommentItem.vue @storage.ts @index.ts @tailwind.config.js これは投稿詳細ページです。どのようになっていますか？説明してください。

#### 投稿作成、編集ページ
@PostEditorPage.vue @useNotification.ts @supabase.ts @auth.ts @RichTextEditor.vue @EditorToolbar.vue @EditorLinkMenu.vue @CategorySelector.vue @EyecatchUploader.vue @useImageUpload.ts @storage.ts @index.ts @tailwind.config.js @storage.ts これは投稿作成、編集ページです。どのようになっていますか？説明してください。

#### 投稿一覧ページ
@PostsPage.vue @useNotification.ts @supabase.ts @PostCard.vue @index.ts @tailwind.config.js @storage.ts @auth.ts これは投稿一覧ページです。どのようになっていますか？説明してください。

#### プロフィール編集ページ
@ProfileEditPage.vue @useNotification.ts @supabase.ts @auth.ts @useImageUpload.ts @storage.ts @index.ts @tailwind.config.js これはプロフィール編集ページです。どのようになっていますか？説明してください。

#### プロフィールページ
@ProfilePage.vue @useNotification.ts @supabase.ts @auth.ts @storage.ts @PostCard.vue @tailwind.config.js @index.ts これはプロフィールページです。どのようになっていますか？説明してください。

#### 一時的
各ファイルでsupabase.tsとstorage.ts、auth.tsはどのように使用されていますか？