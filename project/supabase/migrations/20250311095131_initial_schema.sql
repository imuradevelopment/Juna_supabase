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

-- 障害種別テーブル
CREATE TABLE disability_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE disability_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "障害種別は誰でも参照可能" 
  ON disability_types FOR SELECT USING (true);

CREATE POLICY "管理者のみ障害種別作成可能" 
  ON disability_types FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理者のみ障害種別更新可能" 
  ON disability_types FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者のみ障害種別削除可能" 
  ON disability_types FOR DELETE 
  USING (is_admin(auth.uid()));

-- カテゴリテーブル
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TRIGGER update_category_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "カテゴリは誰でも参照可能" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "管理者のみカテゴリ作成可能" 
  ON categories FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理者のみカテゴリ更新可能" 
  ON categories FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者のみカテゴリ削除可能" 
  ON categories FOR DELETE 
  USING (is_admin(auth.uid()));

-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  account_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_data TEXT,
  bio TEXT,
  disability_type_id INTEGER REFERENCES disability_types(id),
  disability_description TEXT,
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

-- 通知タイプENUM
CREATE TYPE notification_type AS ENUM (
  'comment', 'like', 'follow', 'post_like', 'comment_like', 'comment_reply', 'comment_deleted'
);

-- 通知テーブル
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の通知のみ参照可能" 
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分の通知のみ更新可能" 
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 以下を追加：通知の作成・削除ポリシー
CREATE POLICY "システムによる通知作成を許可" 
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "自分の通知のみ削除可能"
  ON notifications FOR DELETE USING (auth.uid() = user_id);

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

-- Realtimeサブスクリプション設定
ALTER PUBLICATION supabase_realtime ADD TABLE posts, comments, post_likes, comment_likes, notifications;

-- 基本的な障害種別データの登録
INSERT INTO disability_types (name, description) VALUES
('身体障害', '身体的な障害'),
('発達障害', '発達障害（ASD、ADHD、LD等）'),
('精神障害', '精神障害（うつ病、統合失調症、双極性障害等）'),
('内部障害', '内臓機能の障害'),
('難病', '指定難病や慢性疾患'),
('慢性疲労', '慢性疲労症候群等'),
('その他', 'その他の見えない障害');

-- 基本カテゴリの作成
INSERT INTO categories (name, description) VALUES
('身体障害', '身体的な障害に関する経験や情報'),
('発達障害', '発達障害に関する経験や情報'),
('精神障害', '精神障害に関する経験や情報'),
('難病', '難病に関する経験や情報'),
('その他', 'その他の見えない障害に関する経験や情報'),
('日常生活', '日常生活における工夫や経験'),
('社会参加', '社会参加や就労に関する経験や情報'),
('支援制度', '各種支援制度に関する情報');

--------------------------------------------------
-- 管理者設定（本番環境で有効化）
--------------------------------------------------
-- 最初のスーパー管理者設定（本番環境で適切なユーザーIDとメールアドレスに置き換える）
-- INSERT INTO admin_users (user_id, email, admin_level, created_by) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'super_admin', '00000000-0000-0000-0000-000000000000');

-- または、より安全な方法として、bootstrap_admin関数を使用
-- SELECT bootstrap_admin('admin@example.com', '00000000-0000-0000-0000-000000000000'); 
