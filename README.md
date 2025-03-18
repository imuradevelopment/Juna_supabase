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

## 機能改善

- 通知機能の集約
    - @App.vue @Notifications.vue App.vueでprovideされている通知機能を注入して全てのユーザーに対する通知を一元化してください。

- リンクの更新
    - index.tsに記載されているページ以外に遷移していませんか？

## よく使うプロンプト


### DB関連

#### supabaseスキーマの把握
@20250311102412_initial_schema.sql supabaseスキーマを拡張機能と基本設定、ストレージバケット設定、セキュリティ関数、カラムを含むテーブル詳細、トリガー関数、ユーティリティ関数、リアルタイム機能、セキュリティモデル、RLSなどを含めて、完全に把握してください。スキーマは修正しないでください。


### デザイン関連

#### カラーの統一とモバイルファースト対応
@tailwind.config.js コンテキストに追加したコンポーネントのカラー使用箇所でカラーをハードコーディングしている箇所や、tailwind.config.jsの「colors:」を使用していない箇所、tailwind.cssのユーティリティカラークラスを使用している箇所があれば修正してください。カラーを使用する際は全てtailwind.config.jsのクラスを使用してください。クラスの記載順は「コンポーネント内に定義されたtailwindcss以外のクラス名 + モバイルファーストの原則に基づき、各プロパティカテゴリ（ポジション、ディスプレイ、フレックス、グリッド、幅、高さ、マージン、パディング、ボーダー、角丸、背景、テキスト、色、タイポグラフィ、間隔、効果、トランジション、アニメーション、ホバー状態、フォーカス、アクセシビリティ）ごとにグループ化し、各グループ内では基本スタイル（プレフィックスなし）を最小画面サイズ（モバイル）向けに定義してから、レスポンシブバリアント（sm:、md:、lg:、xl:、2xl:）を画面サイズの小さい順に並べる。」でお願いします。機能は絶対に変更しないでください。tailwind.config.jsは修正しないで下さい。


### 機能関連

#### アプリ骨格
@Notifications.vue @Navbar.vue @Footer.vue @auth.ts @App.vue @main.ts @index.html @tailwind.config.js @index.ts @storage.ts @supabase.ts アプリケーションの骨格です。どのようになっていますか？説明してください。

#### 認証ページ
@AuthPage.vue @auth.ts @index.ts @tailwind.config.js @storage.ts @supabase.ts これは認証ページです。どのようになっていますか？説明してください。

#### ダッシュボードページ
@DashboardPage.vue @auth.ts @DashboardPostsList.vue @DashboardDraftsList.vue @DashboardCommentsList.vue @DashboardLikesList.vue @DashboardStatistics.vue @index.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはダッシュボードページです。どのようになっていますか？説明してください。

#### ホームページ
@HomePage.vue @supabase.ts @PostCard.vue @index.ts  @tailwind.config.js @storage.ts @auth.ts これはホームページです。どのようになっていますか？説明してください。

#### NotFoundページ
@NotFoundPage.vue @index.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはNotFoundページです。どのようになっていますか？説明してください。

#### 投稿詳細ページ
@PostDetailPage.vue @supabase.ts @auth.ts @RichTextContent.vue @CommentSystem.vue @CommentItem.vue @storage.ts @index.ts @tailwind.config.js これは投稿詳細ページです。どのようになっていますか？説明してください。

#### 投稿作成、編集ページ
@PostEditorPage.vue @supabase.ts @auth.ts @RichTextEditor.vue @storage.ts @index.ts @tailwind.config.js @storage.ts これは投稿作成、編集ページです。どのようになっていますか？説明してください。

#### 投稿一覧ページ
@PostsPage.vue @supabase.ts @PostCard.vue @index.ts @tailwind.config.js @storage.ts @auth.ts これは投稿一覧ページです。どのようになっていますか？説明してください。

#### プロフィール編集ページ
@ProfileEditPage.vue @supabase.ts @auth.ts @storage.ts @index.ts @tailwind.config.js これはプロフィール編集ページです。どのようになっていますか？説明してください。

#### プロフィールページ
@ProfilePage.vue @supabase.ts @auth.ts @storage.ts @PostCard.vue @tailwind.config.js @index.ts これはプロフィールページです。どのようになっていますか？説明してください。

#### 一時的
各ファイルでsupabase.tsとstorage.ts、auth.tsはどのように使用されていますか？