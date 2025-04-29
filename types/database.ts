// types/database.ts
// このファイルは Supabase の `supabase gen types typescript --local > types/database.ts` コマンドによって自動生成されます。
// データベーススキーマの変更後に再生成する必要があります。手動での編集は推奨されません。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// PostgreSQL特有の型定義
export type TsVector = string; // 全文検索用のベクトル型
export type Trigram = string; // Trigram 拡張機能用の型 (現在は使用していない可能性あり)

// メインのデータベーススキーマ定義
export type Database = {
  public: { // public スキーマ
    Tables: { // テーブル定義
      categories: {
        Row: { // SELECT で取得される行の型
          created_at: string
          creator_id: string | null // 作成者ID (profiles.id を参照)
          id: number // カテゴリID (主キー、シリアル)
          name: string // カテゴリ名 (ユニーク)
          updated_at: string
        }
        Insert: { // INSERT 時の型 (デフォルト値や生成される列はオプショナル)
          created_at?: string
          creator_id?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: { // UPDATE 時の型 (全ての列がオプショナル)
          created_at?: string
          creator_id?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [ // 外部キー制約の定義
          {
            foreignKeyName: "categories_creator_id_fkey"
            columns: ["creator_id"] // このテーブルのカラム
            isOneToOne: false
            referencedRelation: "profiles" // 参照先テーブル
            referencedColumns: ["id"] // 参照先テーブルのカラム
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string // コメントID (comments.id を参照)
          created_at: string
          user_id: string // いいねしたユーザーID (profiles.id を参照)
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string // コメント投稿者のID (profiles.id を参照)
          content: string // コメント本文
          created_at: string
          id: string // コメントID (主キー、UUID)
          parent_comment_id: string | null // 親コメントID (自己参照、ツリー構造用)
          post_id: string // 投稿ID (posts.id を参照)
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments" // 自己参照
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: { // 投稿とカテゴリの中間テーブル
        Row: {
          category_id: number // カテゴリID (categories.id を参照)
          post_id: string // 投稿ID (posts.id を参照)
        }
        Insert: {
          category_id: number
          post_id: string
        }
        Update: {
          category_id?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          author_id: string // 画像投稿者のID (profiles.id を参照)
          created_at: string
          id: string // 画像ID (主キー、UUID)
          image_path: string // Storage 内の画像パス
          post_id: string // 関連する投稿ID (posts.id を参照)
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          image_path: string
          post_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          image_path?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: { // 投稿いいねの中間テーブル
        Row: {
          created_at: string
          post_id: string // いいねされた投稿ID (posts.id を参照)
          user_id: string // いいねしたユーザーID (profiles.id を参照)
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string // 投稿者のID (profiles.id を参照)
          content: Json // 投稿本文 (Tiptap等のリッチテキストエディタのJSON形式を想定)
          cover_image_path: string | null // アイキャッチ画像のパス (Storage)
          created_at: string
          excerpt: string | null // 抜粋
          id: string // 投稿ID (主キー、UUID)
          last_edited_by: string | null // 最終編集者のID (auth.users.id を参照)
          published: boolean | null // 公開状態 (true: 公開, false: 下書き, null: ?)
          published_at: string | null // 公開日時
          search_vector: TsVector | null // 全文検索用ベクトル (生成列)
          title: string // 投稿タイトル
          updated_at: string
          views: number | null // 閲覧数
        }
        Insert: {
          author_id: string
          content: Json
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          last_edited_by?: string | null
          published?: boolean | null
          published_at?: string | null
          search_vector?: TsVector | null // Insert時には指定不要
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_id?: string
          content?: Json
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          last_edited_by?: string | null
          published?: boolean | null
          published_at?: string | null
          search_vector?: TsVector | null // Update時には指定不要
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          // last_edited_by の Relationship が自動生成されていない点に注意
          // 必要であれば手動で追加するか、profiles.id を参照する形にする
          // {
          //   foreignKeyName: "posts_last_edited_by_fkey" // 仮の名前
          //   columns: ["last_edited_by"]
          //   isOneToOne: false
          //   referencedRelation: "users" // auth スキーマの users テーブル
          //   referencedColumns: ["id"]
          // }
        ]
      }
      profiles: { // ユーザープロフィールテーブル
        Row: {
          account_id: string // アカウントID (@...) (ユニーク)
          avatar_data: string | null // アバター画像パス (Storage) またはデータURIなど (実装による)
          bio: string | null // 自己紹介文
          created_at: string
          id: string // ユーザーID (auth.users.id を参照, 主キー)
          nickname: string | null // 表示名
          updated_at: string
        }
        Insert: {
          account_id: string
          avatar_data?: string | null
          bio?: string | null
          created_at?: string
          id: string // auth.users.id と一致させる必要あり
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          avatar_data?: string | null
          bio?: string | null
          created_at?: string
          id?: string // 通常、id は更新しない
          nickname?: string | null
          updated_at?: string
        }
        Relationships: [
          // profiles.id が auth.users.id を参照する外部キー制約は
          // テーブル作成時に SQL で直接定義されているため、ここには含まれない
          // Relationships 配列は Supabase が自動検出した制約のみを表示する
        ]
      }
    }
    Views: { // ビュー定義 (現在は空)
      // 例: recent_posts: { Row: { ... }, Relationships: [] }
    }
    Functions: { // 関数定義
      can_delete_comment: { // コメント削除権限チェック関数
        Args: { comment_id: string; user_id: string } // 引数: コメントID, ユーザーID
        Returns: boolean // 戻り値: 削除可能か (true/false)
      }
      get_related_posts: { // 関連投稿取得関数
        Args: { input_post_id: string; limit_count?: number } // 引数: 基準投稿ID, 取得件数 (デフォルト5)
        Returns: { // 戻り値: posts テーブルの行の配列
          author_id: string
          content: Json
          cover_image_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          last_edited_by: string | null
          published: boolean | null
          published_at: string | null
          search_vector: TsVector | null
          title: string
          updated_at: string
          views: number | null
        }[]
      }
      // gtrgm_* 関数群: PostgreSQL の pg_trgm 拡張機能に関連する内部関数 (通常直接使用しない)
      gtrgm_compress: {
        Args: { "": Trigram }
        Returns: Trigram
      }
      gtrgm_decompress: {
        Args: { "": Trigram }
        Returns: Trigram
      }
      gtrgm_in: {
        Args: { "": string }
        Returns: Trigram
      }
      gtrgm_options: {
        Args: { "": string }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": Trigram }
        Returns: string
      }
      is_post_author: { // 投稿の作者かチェックする関数
        Args: { uid: string; p_id: string } // 引数: ユーザーID, 投稿ID
        Returns: boolean // 戻り値: 作者か (true/false)
      }
      is_post_published: { // 投稿が公開済みかチェックする関数
        Args: { p_id: string } // 引数: 投稿ID
        Returns: boolean // 戻り値: 公開済みか (true/false)
      }
      search_posts: { // 投稿検索関数
        Args: { search_term: string } // 引数: 検索キーワード
        Returns: { // 戻り値: posts テーブルの行の配列 (検索結果)
          author_id: string
          content: Json
          cover_image_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          last_edited_by: string | null
          published: boolean | null
          published_at: string | null
          search_vector: TsVector | null
          title: string
          updated_at: string
          views: number | null
        }[]
      }
      // set_limit, show_limit, show_trgm: pg_trgm 拡張機能の設定関連関数 (通常直接使用しない)
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: { // Enum 定義 (現在は空)
      // 例: user_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: { // 複合型定義 (現在は空)
      // 例: address: { street: string, city: string, postal_code: string }
    }
  }
}

// デフォルトの public スキーマへのエイリアス
type DefaultSchema = Database[Extract<keyof Database, "public">]

// テーブルの行型を取得するためのユーティリティ型
// 使用例: type ProfileRow = Tables<'profiles'>
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) // テーブル名またはビュー名
    | { schema: keyof Database }, // またはスキーマ指定オブジェクト
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & // スキーマ指定がある場合
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R // Row 型を抽出
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & // スキーマ指定がない場合 (public を想定)
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R // Row 型を抽出
      }
      ? R
      : never
    : never

// テーブルの Insert 型を取得するためのユーティリティ型
// 使用例: type ProfileInsert = TablesInsert<'profiles'>
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"] // テーブル名のみ (ビューは Insert/Update を持たない)
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I // Insert 型を抽出
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I // Insert 型を抽出
      }
      ? I
      : never
    : never

// テーブルの Update 型を取得するためのユーティリティ型
// 使用例: type ProfileUpdate = TablesUpdate<'profiles'>
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"] // テーブル名のみ
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U // Update 型を抽出
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U // Update 型を抽出
      }
      ? U
      : never
    : never

// Enum 型を取得するためのユーティリティ型
// 使用例: type UserRoleEnum = Enums<'user_role'>
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// 複合型を取得するためのユーティリティ型
// 使用例: type AddressType = CompositeTypes<'address'>
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// 定数定義（現在は空）
// 将来的に Enum の値などを定数としてエクスポートする場合に使用する可能性あり
export const Constants = {
  public: {
    Enums: {},
  },
} as const

