-- サイト設定テーブル
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- 更新日時の自動更新
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLSポリシー
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 誰でも設定を参照可能
CREATE POLICY "Site settings are viewable by everyone" 
  ON site_settings FOR SELECT USING (true);

-- 管理者のみ設定を更新可能
CREATE POLICY "Only admins can manage settings" 
  ON site_settings FOR ALL 
  USING (auth.jwt() -> 'user_metadata' ->> 'is_admin' = 'true');

-- デフォルト設定の挿入（汎用的なソーシャルブログプラットフォーム用）
INSERT INTO site_settings (key, value, description) VALUES
  ('theme', '{
    "colors": {
      "primary": "#7C4DFF",
      "primaryLight": "#9575CD",
      "primaryDark": "#5E35B1",
      "secondary": "#9C27B0",
      "secondaryLight": "#BA68C8",
      "secondaryDark": "#7B1FA2",
      "accent": "#E91E63",
      "error": "#F44336",
      "errorDark": "#D32F2F",
      "warning": "#FF9800",
      "success": "#4CAF50",
      "info": "#2196F3",
      "background": "#1A0E2E",
      "surface": "#231640",
      "surfaceVariant": "#2D1B4E",
      "border": "#4A3A6B",
      "borderLight": "#5D4E7F",
      "text": "#E8E3F5",
      "textMuted": "#B8AECD",
      "textWhite": "#ffffff",
      "heading": "#F3E5F5"
    }
  }', 'テーマカラー設定'),
  ('site_metadata', '{
    "siteName": "My Social Blog",
    "siteDescription": "知識と経験を共有するソーシャルブログプラットフォーム",
    "siteKeywords": "ブログ,コミュニティ,ソーシャル,共有,知識",
    "copyrightText": "© 2024 My Social Blog. All rights reserved.",
    "logoText": "My Social Blog"
  }', 'サイト基本情報'),
  ('domain_texts', '{
    "heroTitle": "知識と経験を共有しよう",
    "heroSubtitle": "あなたの声が誰かの力になる、みんなでつくるコミュニティ",
    "aboutTitle": "このサイトについて",
    "aboutDescription": "このプラットフォームは、様々な分野の知識や経験を共有し、互いに学び合うためのソーシャルブログです。あなたの専門知識、日々の発見、学びの記録を投稿して、コミュニティの成長に貢献しましょう。",
    "feature1Title": "簡単投稿",
    "feature1Description": "マークダウン対応のエディタで、記事の作成・編集が簡単に行えます。",
    "feature2Title": "活発なコミュニティ",
    "feature2Description": "コメントやいいね機能で、読者との交流を深められます。",
    "feature3Title": "カテゴリ管理",
    "feature3Description": "興味のある分野の記事を簡単に見つけることができます。",
    "targetDisabilitiesTitle": "人気のカテゴリ",
    "targetDisabilities": [
      "テクノロジー",
      "ライフスタイル",
      "ビジネス",
      "教育・学習",
      "趣味・エンタメ",
      "その他"
    ],
    "callToAction": "あなたの知識と経験をシェアして、コミュニティの一員になりませんか？",
    "startPostingButton": "今すぐ投稿する",
    "viewPostsButton": "記事を探す",
    "recentPostsTitle": "最新の記事",
    "viewAllPosts": "すべて見る",
    "noRecentPosts": "まだ記事がありません。"
  }', 'ドメイン固有の文言設定'),
  ('features', '{
    "enableComments": true,
    "enableLikes": true,
    "enableCategories": true,
    "enableSearch": true,
    "requireEmailVerification": false,
    "allowGuestComments": false
  }', '機能の有効/無効設定');