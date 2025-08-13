# Juna - ソーシャルブログプラットフォーム

## 概要

Juna は、だれでも体験や知識、日々の気づきを発信・交流できる汎用的なソーシャルブログ SPA です。投稿、コメント（ツリー表示）、いいね、カテゴライズ、検索、管理画面、テーマ設定、画像ストレージなど、運用に必要な機能を一通り備えています。

## デプロイ情報
- [Netlify管理パネル](https://app.netlify.com/sites/juna-supabase/overview)
- [デプロイされたサイト](https://juna-supabase.netlify.app/)

## 特徴

- **レスポンシブデザイン**: どのデバイスからでも快適に利用
- **リッチテキストエディタ**: Tiptap による直感的な執筆体験
- **画像アップロード/圧縮**: WebP 変換・サイズ最適化・ストレージ保存
- **ユーザー認証**: サインアップ/ログイン/パスワードリセット/プロフィール
- **ソーシャル機能**: いいね、コメント（スレッド/返信/編集/削除）、閲覧数
- **カテゴリ管理**: 投稿へのカテゴリ付与、一覧/詳細表示
- **検索**: キーワード/ベクトル/ハイブリッド検索（Edge Functions）
- **管理画面**: ユーザー/投稿/コメント/サイト設定の管理
- **テーマ/サイト設定**: `site_settings` から即時反映（リアルタイム購読）
- **画像クリーンアップ**: 投稿更新時に未使用画像を自動削除
- **ダッシュボード**: 下書き/投稿/いいね/コメント管理、統計（合計/平均/人気）

## 技術スタック

- **フロントエンド:**
  - Vue 3
  - TypeScript
  - Tailwind CSS
  - Vue Router
  - Pinia（状態管理）
  - Tiptap（リッチテキストエディタ）
- **バックエンド/サービス:**
  - Supabase（認証、データベース、ストレージ、Edge Functions）

## インストールとセットアップ

### 必要条件

- Node.js v18以上
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

### メール認証の設定（本番環境）

本番環境でメール認証を有効にする場合は、カスタムSMTPサーバーの設定が必要です。

#### Gmail SMTPを使用する場合

1. **Googleアカウントの準備**
   - 2段階認証を有効にする
   - [アプリパスワードを生成](https://myaccount.google.com/apppasswords)

2. **.envファイルに設定を追加**
   ```env
   # Gmail SMTP設定
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password  # アプリパスワード（通常のパスワードではない）
   SMTP_SENDER_EMAIL=your-email@gmail.com
   SMTP_SENDER_NAME=Your App Name
   ```

3. **設定ガイドを表示**
   ```bash
   npm run setup:smtp
   ```
   このコマンドを実行すると、Supabase Dashboardでの設定手順が表示されます。

4. **Supabase Dashboardで設定**
   - [Supabase Dashboard](https://app.supabase.com) にアクセス
   - プロジェクトを選択
   - Authentication → Email Templates → SMTP Settings
   - "Enable Custom SMTP" をONにして、表示された設定値を入力

#### その他のSMTPサービス

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Amazon SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

**注意事項:**
- Gmailは開発・テスト用途に適していますが、本番環境では専用のメールサービスを推奨
- カスタムSMTPを設定しない場合、メールは組織メンバーにのみ送信されます
- メール認証を無効にしたい場合は、管理画面から設定可能です

### npm スクリプト一覧

#### メインコマンド
- `npm run setup:all` - **完全セットアップ（リンク→DB初期化→管理者作成→環境変数→デプロイ→SMTP設定ガイド）**
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
- `npm run setup:smtp` - SMTP設定ガイドの表示
- `npm run preview` - ビルドしたアプリのプレビュー

## 機能改善（TODO）

- Web Push 通知
- フォロー/フォロワー機能
- アクティビティ通知の集約・配信
- i18n（多言語化）
- E2E/ユニットテストの拡充
- 画像対応フォーマットの拡張（AVIF 等）

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

このプロジェクトが、幅広い分野の発信とコミュニティ形成に役立ちますように。