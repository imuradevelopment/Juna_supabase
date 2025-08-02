# Juna Supabase プロジェクトドキュメント

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [プロジェクト構造](#プロジェクト構造)
4. [セットアップ手順](#セットアップ手順)
5. [アーキテクチャ](#アーキテクチャ)
6. [主要機能](#主要機能)
7. [ページ構成](#ページ構成)
8. [コンポーネント構成](#コンポーネント構成)
9. [データベース設計](#データベース設計)
10. [API設計](#api設計)
11. [認証とセキュリティ](#認証とセキュリティ)
12. [デプロイメント](#デプロイメント)
13. [開発ガイドライン](#開発ガイドライン)
14. [トラブルシューティング](#トラブルシューティング)

## プロジェクト概要

Juna Supabaseは、Vue 3とSupabaseを使用して構築された、モダンなブログ/コンテンツ管理システムです。リアルタイムの機能、高度なテキストエディタ、画像管理、ユーザー認証などの機能を備えています。

### 主な特徴
- **リアルタイム更新**: Supabaseのリアルタイム機能を活用
- **リッチテキストエディタ**: TipTapを使用した高機能エディタ
- **画像管理**: 複数フォーマット対応の画像アップロード
- **ユーザー認証**: メールベースの認証システム
- **レスポンシブデザイン**: モバイルファーストのUI設計
- **日本語対応**: 全文検索を含む完全な日本語サポート

## 技術スタック

### フロントエンド
- **Vue 3** (v3.4.38) - プログレッシブJavaScriptフレームワーク
- **TypeScript** (v5.5.3) - 型安全な開発環境
- **Vite** (v6.2.2) - 高速なビルドツール
- **Vue Router** (v4.3.0) - SPAルーティング
- **Pinia** - 状態管理
- **TailwindCSS** (v3.4.1) - ユーティリティファーストCSS
- **TipTap** (v2.2.4) - リッチテキストエディタ

### バックエンド
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL - データベース
  - Edge Functions - サーバーレス関数
  - Storage - ファイルストレージ
  - Realtime - リアルタイム通信
  - Auth - 認証システム

### ライブラリ
- **@phosphor-icons/vue** - アイコンライブラリ
- **browser-image-compression** - クライアントサイド画像圧縮
- **date-fns** - 日付操作
- **DOMPurify** - XSS対策
- **marked** - Markdownパーサー
- **lodash** - ユーティリティ関数

## プロジェクト構造

```
juna-supabase/
├── project/                    # メインプロジェクトディレクトリ
│   ├── src/                   # ソースコード
│   │   ├── assets/           # 静的アセット
│   │   ├── components/       # Vueコンポーネント
│   │   │   ├── App/         # アプリケーション共通コンポーネント
│   │   │   ├── common/      # 汎用コンポーネント
│   │   │   ├── DashboardPage/ # ダッシュボード関連
│   │   │   ├── PostDetailPage/ # 投稿詳細関連
│   │   │   └── PostEditorPage/ # 投稿エディタ関連
│   │   ├── composables/      # Vue Composables
│   │   ├── lib/             # ライブラリ設定
│   │   ├── pages/           # ページコンポーネント
│   │   ├── router/          # ルーティング設定
│   │   ├── stores/          # Piniaストア
│   │   ├── App.vue          # ルートコンポーネント
│   │   └── main.ts          # エントリーポイント
│   ├── supabase/            # Supabase設定
│   │   ├── functions/       # Edge Functions
│   │   │   ├── delete-user/
│   │   │   ├── login-with-account/
│   │   │   └── register-user/
│   │   └── migrations/      # データベースマイグレーション
│   ├── public/              # 静的ファイル
│   ├── scripts/             # ユーティリティスクリプト
│   └── package.json         # プロジェクト設定
├── README.md                # プロジェクトREADME
├── CLAUDE.md               # AI開発者向けドキュメント
└── LICENSE                 # ライセンス
```

## セットアップ手順

### 前提条件
- Node.js (v18以上推奨)
- npm または yarn
- Supabaseアカウント
- Git

### 1. リポジトリのクローン
```bash
git clone https://github.com/imuradevelopment/Juna_supabase.git
cd Juna_supabase
```

### 2. 依存関係のインストール
```bash
cd project
npm install
```

### 3. 環境変数の設定
```bash
# .env.exampleから.envファイルを作成
cp .env.example .env
```

`.env`ファイルに以下の値を設定：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabaseプロジェクトのセットアップ

#### データベースのマイグレーション
```bash
supabase link
supabase db push --include-all
```

#### Edge Functionsのデプロイ
```bash
supabase functions deploy register-user
supabase functions deploy login-with-account
supabase functions deploy delete-user
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

## アーキテクチャ

### アプリケーション構造

```
┌─────────────────┐     ┌──────────────────┐
│   フロントエンド  │     │    Supabase      │
│    (Vue 3)      │────▶│                  │
│                 │     │  ┌────────────┐  │
│  ┌───────────┐  │     │  │ PostgreSQL │  │
│  │  Router   │  │     │  └────────────┘  │
│  └───────────┘  │     │                  │
│                 │     │  ┌────────────┐  │
│  ┌───────────┐  │     │  │  Storage   │  │
│  │   Pinia   │  │     │  └────────────┘  │
│  └───────────┘  │     │                  │
│                 │     │  ┌────────────┐  │
│  ┌───────────┐  │     │  │Edge Funcs  │  │
│  │Components │  │     │  └────────────┘  │
│  └───────────┘  │     │                  │
└─────────────────┘     └──────────────────┘
```

### データフロー
1. ユーザーがUIを操作
2. Vueコンポーネントがアクションを処理
3. ComposablesまたはStoreを通じてSupabaseクライアントを呼び出し
4. Supabaseがデータベース操作またはストレージ操作を実行
5. レスポンスがUIに反映される

## 主要機能

### 1. ユーザー認証
- メールアドレスによる登録・ログイン
- パスワードリセット機能
- セッション管理
- ロールベースのアクセス制御

### 2. 投稿管理
- リッチテキストエディタによる投稿作成
- 下書き保存機能
- カテゴリー分類
- アイキャッチ画像設定
- 公開/非公開の切り替え

### 3. コメントシステム
- リアルタイムコメント投稿
- コメントへの返信機能
- コメント削除（権限制御付き）

### 4. いいね機能
- 投稿へのいいね
- リアルタイムカウント更新

### 5. 画像管理
- 複数フォーマット対応（WebP、JPEG、PNG等）
- 自動圧縮・最適化
- プログレッシブアップロード
- 画像プレビュー

### 6. 検索機能
- 全文検索（日本語対応）
- カテゴリー絞り込み
- ユーザー別フィルタリング

### 7. ダッシュボード
- 投稿統計
- コメント管理
- いいね履歴
- 下書き一覧

## ページ構成

### 1. ホームページ (`HomePage.vue`)
- 最新の投稿一覧
- カテゴリーフィルター
- ページネーション
- 検索機能

### 2. 認証ページ (`AuthPage.vue`)
- ログインフォーム
- 新規登録フォーム
- パスワードリセット

### 3. 投稿一覧ページ (`PostsPage.vue`)
- グリッドレイアウトの投稿表示
- 無限スクロール
- フィルタリング機能

### 4. 投稿詳細ページ (`PostDetailPage.vue`)
- 投稿内容の表示
- コメントセクション
- いいねボタン
- 共有機能

### 5. 投稿エディタページ (`PostEditorPage.vue`)
- TipTapエディタ
- リアルタイムプレビュー
- 画像アップロード
- 自動保存機能

### 6. プロフィールページ (`ProfilePage.vue`)
- ユーザー情報表示
- 投稿履歴
- フォロー/フォロワー（将来実装）

### 7. プロフィール編集ページ (`ProfileEditPage.vue`)
- プロフィール画像変更
- 自己紹介編集
- アカウント設定

### 8. ダッシュボードページ (`DashboardPage.vue`)
- 投稿統計
- アクティビティ履歴
- 管理機能

### 9. 404ページ (`NotFoundPage.vue`)
- エラーメッセージ
- ホームへのリダイレクト

## コンポーネント構成

### 共通コンポーネント
- **Navbar.vue** - ナビゲーションバー
- **Footer.vue** - フッター
- **Notifications.vue** - 通知システム
- **PostCard.vue** - 投稿カードコンポーネント

### エディタ関連
- **RichTextEditor.vue** - メインエディタ
- **EditorToolbar.vue** - エディタツールバー
- **EditorLinkMenu.vue** - リンク挿入メニュー
- **CategorySelector.vue** - カテゴリー選択
- **EyecatchUploader.vue** - アイキャッチアップローダー

### ダッシュボード関連
- **DashboardStatistics.vue** - 統計表示
- **DashboardPostsList.vue** - 投稿一覧
- **DashboardDraftsList.vue** - 下書き一覧
- **DashboardCommentsList.vue** - コメント一覧
- **DashboardLikesList.vue** - いいね履歴

### 投稿詳細関連
- **CommentSystem.vue** - コメントシステム
- **CommentItem.vue** - 個別コメント
- **RichTextContent.vue** - リッチテキスト表示

## データベース設計

### 主要テーブル

#### users テーブル
```sql
- id (UUID) - プライマリキー
- email (TEXT) - メールアドレス
- username (TEXT) - ユーザー名
- avatar_url (TEXT) - アバター画像URL
- bio (TEXT) - 自己紹介
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### posts テーブル
```sql
- id (UUID) - プライマリキー
- author_id (UUID) - 投稿者ID
- title (TEXT) - タイトル
- content (JSONB) - リッチテキストコンテンツ
- slug (TEXT) - URLスラッグ
- category (TEXT) - カテゴリー
- eyecatch_url (TEXT) - アイキャッチ画像
- published (BOOLEAN) - 公開状態
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- published_at (TIMESTAMP)
```

#### comments テーブル
```sql
- id (UUID) - プライマリキー
- post_id (UUID) - 投稿ID
- user_id (UUID) - ユーザーID
- content (TEXT) - コメント内容
- parent_id (UUID) - 親コメントID（返信用）
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### likes テーブル
```sql
- id (UUID) - プライマリキー
- post_id (UUID) - 投稿ID
- user_id (UUID) - ユーザーID
- created_at (TIMESTAMP)
```

### インデックス
- posts: title, category, published, created_at
- comments: post_id, user_id, created_at
- likes: post_id, user_id（ユニーク制約）

### RLS（Row Level Security）ポリシー
- ユーザーは自分の投稿のみ編集・削除可能
- 公開投稿は誰でも閲覧可能
- コメントは投稿者と管理者のみ削除可能

## API設計

### Supabase Edge Functions

#### 1. register-user
- **エンドポイント**: `/register-user`
- **メソッド**: POST
- **機能**: 新規ユーザー登録
- **パラメータ**:
  ```json
  {
    "email": "string",
    "password": "string",
    "username": "string"
  }
  ```

#### 2. login-with-account
- **エンドポイント**: `/login-with-account`
- **メソッド**: POST
- **機能**: ユーザーログイン
- **パラメータ**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### 3. delete-user
- **エンドポイント**: `/delete-user`
- **メソッド**: DELETE
- **機能**: ユーザーアカウント削除
- **認証**: 必須

### Supabase Realtime サブスクリプション
- 投稿の更新
- コメントの追加
- いいね数の変化

## 認証とセキュリティ

### 認証フロー
1. メールアドレスとパスワードで登録
2. Supabase Authがセッショントークンを発行
3. トークンはlocalStorageに保存
4. APIリクエスト時に自動的にトークンを送信

### セキュリティ対策
- **XSS対策**: DOMPurifyによるサニタイゼーション
- **CSRF対策**: Supabaseの組み込み保護
- **SQL Injection対策**: パラメータ化クエリ
- **RLS**: 行レベルセキュリティによるアクセス制御
- **HTTPS**: 全通信の暗号化

## デプロイメント

### Netlifyへのデプロイ
1. GitHubリポジトリと連携
2. ビルドコマンド: `npm run build`
3. 公開ディレクトリ: `project/dist`
4. 環境変数の設定

### 本番環境URL
- 管理パネル: https://app.netlify.com/sites/juna-supabase/overview
- 公開サイト: https://juna-supabase.netlify.app/

## 開発ガイドライン

### コーディング規約
- **TypeScript**: 厳密な型定義を使用
- **Vue Composition API**: `<script setup>`構文を使用
- **命名規則**: 
  - コンポーネント: PascalCase
  - 関数・変数: camelCase
  - 定数: UPPER_SNAKE_CASE

### スタイリング
- TailwindCSSのユーティリティクラスを使用
- カスタムカラーは`tailwind.config.js`で定義
- モバイルファーストのレスポンシブデザイン

### Git コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更
```

### パフォーマンス最適化
- 画像の遅延読み込み
- コンポーネントの動的インポート
- Viteのコード分割機能を活用
- 不要な再レンダリングの防止

## トラブルシューティング

### よくある問題と解決方法

#### 1. Supabase接続エラー
```
Error: Invalid Supabase URL or Key
```
**解決方法**: `.env`ファイルの環境変数を確認

#### 2. ビルドエラー
```
Error: Cannot find module '@/components/...'
```
**解決方法**: `tsconfig.json`のパスエイリアス設定を確認

#### 3. 画像アップロードエラー
```
Error: Storage bucket not found
```
**解決方法**: Supabaseダッシュボードでストレージバケットを作成

#### 4. 認証エラー
```
Error: Invalid login credentials
```
**解決方法**: Supabase Authの設定とメール確認を確認

### デバッグ方法
1. ブラウザの開発者ツールでネットワークタブを確認
2. Supabaseダッシュボードでログを確認
3. `console.log`を使用してデータフローを追跡

### サポート
- GitHub Issues: https://github.com/imuradevelopment/Juna_supabase/issues
- Supabaseドキュメント: https://supabase.com/docs

---

このドキュメントは継続的に更新されます。最新情報はGitHubリポジトリをご確認ください。