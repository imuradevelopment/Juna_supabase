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
