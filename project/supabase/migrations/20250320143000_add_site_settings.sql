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

-- デフォルト設定の挿入
INSERT INTO site_settings (key, value, description) VALUES
  ('theme', '{
    "colors": {
      "primary": "#38bdaa",
      "primaryLight": "#5cd4c2",
      "primaryDark": "#199687",
      "secondary": "#78a0c3",
      "secondaryLight": "#95b8d6",
      "secondaryDark": "#5a7fa8",
      "accent": "#ff915a",
      "error": "#f55f5a",
      "errorDark": "#dc3c32",
      "warning": "#ffbe3c",
      "success": "#4bd273",
      "info": "#4191ff",
      "background": "#122328",
      "surface": "#19282d",
      "surfaceVariant": "#1e2d32",
      "border": "#37465a",
      "borderLight": "#465569",
      "text": "#d2e6f5",
      "textMuted": "#91a0af",
      "textWhite": "#ffffff",
      "heading": "#fff5e1"
    }
  }', 'テーマカラー設定'),
  ('site_metadata', '{
    "siteName": "Juna",
    "siteDescription": "みんなでつくるソーシャルブログ",
    "siteKeywords": "ブログ,コミュニティ,ソーシャル",
    "copyrightText": "© 2024 Juna. All rights reserved.",
    "logoText": "Juna"
  }', 'サイト基本情報'),
  ('domain_texts', '{
    "heroTitle": "見えない障害と共に生きる",
    "heroSubtitle": "経験を共有し、互いに学び、支え合うコミュニティへようこそ",
    "aboutTitle": "当サイトについて",
    "aboutDescription": "「見えない障害と共に生きる」は、身体的な症状が外見からはわかりにくい障害を持つ方々の経験を共有し、互いに支え合うためのコミュニティプラットフォームです。",
    "feature1Title": "経験の共有",
    "feature1Description": "日常生活での工夫や対処法、成功体験や困難を乗り越えた経験を共有できます。",
    "feature2Title": "コミュニティ",
    "feature2Description": "同じ障害や似た経験を持つ人とつながり、理解し合える関係を築けます。",
    "feature3Title": "安心できる場所",
    "feature3Description": "理解されにくい障害や症状について偏見なく話せる安全な環境を提供します。",
    "targetDisabilitiesTitle": "対象となる障害・症状",
    "targetDisabilities": [
      "発達障害（ASD、ADHD、LD等）",
      "精神障害（うつ病、統合失調症等）",
      "慢性疲労症候群",
      "線維筋痛症",
      "内部障害",
      "その他の見えない障害"
    ],
    "callToAction": "あなたの経験は、誰かの助けになります。このコミュニティに参加して、あなたの物語を共有しませんか？",
    "startPostingButton": "今すぐ投稿を始める",
    "viewPostsButton": "投稿を見る",
    "recentPostsTitle": "最新の投稿",
    "viewAllPosts": "すべての投稿を見る",
    "noRecentPosts": "まだ投稿がありません"
  }', 'ドメイン固有の文言設定'),
  ('features', '{
    "enableComments": true,
    "enableLikes": true,
    "enableCategories": true,
    "enableSearch": true,
    "requireEmailVerification": false,
    "allowGuestComments": false
  }', '機能の有効/無効設定');