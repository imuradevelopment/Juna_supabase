-- domain_texts設定を更新
UPDATE site_settings 
SET value = '{
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
  "viewAllPosts": "すべて見る",
  "noRecentPosts": "まだ投稿がありません"
}'::jsonb,
updated_at = now()
WHERE key = 'domain_texts';