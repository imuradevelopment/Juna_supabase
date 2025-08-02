-- domain_texts設定を更新
UPDATE site_settings 
SET value = '{
  "heroTitle": "インフラとクラウドを学ぶ最短ルート",
  "heroSubtitle": "Rinstack Cloudのプロが教える実践講座で、今日からスキルアップ",
  "aboutTitle": "Rinstack Universityとは",
  "aboutDescription": "「Rinstack University」は、未経験者からプロフェッショナルまで、インフラの基礎知識からRinstack Cloudの高度な活用法までを体系的に学べるオンライン学習プラットフォームです。動画・ハンズオン・コミュニティを通じて、学習と実践をシームレスに結びつけます。",
  "feature1Title": "ハンズオン教材",
  "feature1Description": "ブラウザだけで実行できるインタラクティブラボで、実際のクラウド環境を操作しながら学習できます。",
  "feature2Title": "認定バッジ",
  "feature2Description": "コース修了後は、スキルを証明するRinstack認定バッジを取得し、履歴書やSNSで共有できます。",
  "feature3Title": "コミュニティサポート",
  "feature3Description": "専任講師と受講生コミュニティが24時間サポート。質問やフィードバックを即座に共有できます。",
  "targetDisabilitiesTitle": "コースカテゴリ",
  "targetDisabilities": [
    "インフラ基礎",
    "ネットワーク",
    "コンテナ / Kubernetes",
    "Rinstack Cloud入門",
    "Rinstack Cloud開発",
    "運用 / DevOps",
    "セキュリティ & ガバナンス",
    "認定試験対策"
  ],
  "callToAction": "Rinstack Universityで学び、クラウドを自由自在に使いこなそう。今すぐ無料で登録！",
  "startPostingButton": "無料で始める",
  "viewPostsButton": "コース一覧を見る",
  "recentPostsTitle": "最新のコース",
  "viewAllPosts": "すべてのコースを見る",
  "noRecentPosts": "まだコースがありません"
}'::jsonb,
updated_at = now()
WHERE key = 'domain_texts';

-- site_metadata設定を更新
UPDATE site_settings 
SET value = '{
  "siteName": "Rinstack University",
  "siteDescription": "インフラの基礎から Rinstack Cloud の実践活用まで学べる公式ラーニングプラットフォーム",
  "siteKeywords": "Rinstack,クラウド,インフラ,学習,ハンズオン,認定資格",
  "copyrightText": "© 2024 Rinstack University. All rights reserved.",
  "logoText": "Rinstack University"
}'::jsonb,
updated_at = now()
WHERE key = 'site_metadata';

-- theme設定を更新
UPDATE site_settings 
SET value = '{
  "colors": {
    "primary": "#5E35B1",
    "primaryLight": "#7E57C2",
    "primaryDark": "#4527A0",
    "secondary": "#9575CD",
    "secondaryLight": "#B39DDB",
    "secondaryDark": "#7E57C2",
    "accent": "#7C4DFF",
    "error": "#B00020",
    "errorDark": "#8E0016",
    "warning": "#FFB300",
    "success": "#43A047",
    "info": "#7A86FF",
    "background": "#140E24",
    "surface": "#1C142F",
    "surfaceVariant": "#291E45",
    "border": "#40325F",
    "borderLight": "#574678",
    "text": "#E4E0F5",
    "textMuted": "#A8A0C4",
    "textWhite": "#ffffff",
    "heading": "#F5EBFF"
  }
}'::jsonb,
updated_at = now()
WHERE key = 'theme';