# 見えない障害ブログプラットフォーム（Juna）

## 概要

「見えない障害ブログプラットフォーム」は、見た目からは分かりにくい障害を持つ方々が、自身の体験や知識、日常の思いを安心して発信できるオンラインスペースです。

## デプロイ情報
- [Netlify管理パネル](https://app.netlify.com/sites/juna-supabase/overview)
- [デプロイされたサイト](https://juna-supabase.netlify.app/)

## 特徴

- **レスポンシブデザイン:** どのデバイスからでも快適に利用可能
- **リッチテキストエディタ:** Tiptapを活用した直感的なブログ投稿体験
- **画像アップロード機能:** ブログ記事に画像を簡単に添付可能
- **ユーザー認証:** セキュアなサインアップとログイン機能
- **コミュニティ機能:** 記事投稿、コメント

## 技術スタック

- **フロントエンド:**
  - Vue 3
  - TypeScript
  - Tailwind CSS
  - Vue Router
  - Pinia (状態管理)
  - Tiptap (リッチテキストエディタ)
- **バックエンド/サービス:**
  - Supabase (認証、データベース、ストレージ)

## インストールとセットアップ

### 必要条件

- Node.js v12以上
- Git クライアント
- npm
- Supabase CLI

### クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/imuradevelopment/Juna_supabase.git
cd Juna_supabase/project

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して実際の値を入力

# 完全セットアップ（DB、管理者、Edge Functions全て）
npm run setup:all

# 開発サーバーの起動
npm run dev
```

### 詳細なセットアップ手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/imuradevelopment/Juna_supabase.git
   cd Juna_supabase/project
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**  
   プロジェクトルートに `.env` ファイルを作成し、`.env.example` を参考に Supabase の認証情報などを設定してください。
   ```bash
   cp .env.example .env
   # .envファイルを編集して実際の値を入力
   ```

4. **Supabaseプロジェクトのリンク**
   ```bash
   npm run supabase:link
   ```

5. **ローカル環境のセットアップ**
   ```bash
   # データベースのリセット、マイグレーション適用、管理者ユーザー作成
   npm run setup:local
   ```

6. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:5173` にアクセスして動作を確認してください。

### 本番環境へのデプロイ

1. **環境変数の設定とEdge Functionsのデプロイ**
   ```bash
   # .envに本番環境用のALLOWED_ORIGINSを設定後
   npm run setup:production
   ```

### npm スクリプト一覧

#### メインコマンド
- `npm run setup:all` - **完全セットアップ（リンク→DB初期化→管理者作成→環境変数→デプロイ）**
- `npm run dev` - 開発サーバーの起動
- `npm run build` - プロダクションビルド

#### セットアップコマンド
- `npm run setup:local` - ローカル環境の初期セットアップ（DB + 管理者）
- `npm run setup:production` - 本番環境へのデプロイ準備（環境変数 + Edge Functions）

#### 個別コマンド
- `npm run supabase:link` - Supabaseプロジェクトとのリンク
- `npm run db:reset` - データベースのリセットとマイグレーション適用
- `npm run admin:create` - 管理者ユーザーの作成（.envの設定値を使用）
- `npm run functions:deploy` - Edge Functionsのデプロイ
- `npm run functions:env` - Edge Functions用環境変数の設定
- `npm run preview` - ビルドしたアプリのプレビュー

## 機能改善（TODO）

- リアルタイム購読の使用
- WebPush通知の実装
- 管理者ページの実装
- フォローの概念
- 通知機能の集約
  - useNotification.tsを使用してユーザーに対する通知を一元化
- リンクの更新
  - router/index.tsに記載されているページ以外への遷移確認
- 画像対応フォーマットの拡張
  - useImageUpload.tsで多様なフォーマットに対応（WebP、AVIF、HEIC、RAW形式など）

## 開発メモ

### よく使うプロンプト

#### DB関連
- supabaseスキーマの把握: `@supabase/migrations/20250320142446_initial_schema.sql`を参照

#### デザイン関連
- カラーの統一: `@tailwind.config.js`のカラー定義を使用
- モバイルファースト対応: レスポンシブバリアント（sm:、md:、lg:、xl:、2xl:）を適切に使用

#### 機能関連
- アプリ骨格: `@App.vue`, `@router.ts`, `@auth.ts`, `@supabase.ts`
- 各ページコンポーネント: `@pages/`ディレクトリ参照
- 共通コンポーネント: `@components/`ディレクトリ参照
- Composables: `@composables/`ディレクトリ参照

## コントリビューション

貢献は大歓迎です！  
バグ修正、新機能の提案、ドキュメント改善など、どんな改善提案もプロジェクトの向上に役立ちます。  
プルリクエストを送る前に、Issueを立てて変更内容についてディスカッションしていただけると助かります。

## ライセンス

このプロジェクトは [MITライセンス](LICENSE) の下で公開されています。詳細は LICENSE ファイルをご参照ください。

## コンタクト

ご意見やご質問、フィードバックがございましたら、GitHub の Issue、またはプロジェクトに記載のメールアドレスまでご連絡ください。

---

このプラットフォームが、見えない障害を持つ方々にとって情報発信の新たな場となり、より豊かなコミュニティ形成につながることを願っています。