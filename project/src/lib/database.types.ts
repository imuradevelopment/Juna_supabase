export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string
          email: string
          admin_level: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          user_id: string
          email: string
          admin_level?: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          user_id?: string
          email?: string
          admin_level?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      disability_types: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          content: string
          type: string
          read: boolean
          related_post_id: string | null
          related_comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          type: string
          read?: boolean
          related_post_id?: string | null
          related_comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          type?: string
          read?: boolean
          related_post_id?: string | null
          related_comment_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_comment_id_fkey"
            columns: ["related_comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      post_categories: {
        Row: {
          post_id: string
          category_id: number
        }
        Insert: {
          post_id: string
          category_id: number
        }
        Update: {
          post_id?: string
          category_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      post_images: {
        Row: {
          id: string
          post_id: string | null
          storage_path: string
          author_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          storage_path: string
          author_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          storage_path?: string
          author_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_images_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: Json
          excerpt: string | null
          cover_image_path: string | null
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
          views: number
          last_edited_by: string | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: Json
          excerpt?: string | null
          cover_image_path?: string | null
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
          views?: number
          last_edited_by?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: Json
          excerpt?: string | null
          cover_image_path?: string | null
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
          views?: number
          last_edited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_last_edited_by_fkey"
            columns: ["last_edited_by"]
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          account_id: string
          nickname: string | null
          bio: string | null
          avatar_data: string | null
          disability_type_id: number | null
          disability_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          account_id: string
          nickname?: string | null
          bio?: string | null
          avatar_data?: string | null
          disability_type_id?: number | null
          disability_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          nickname?: string | null
          bio?: string | null
          avatar_data?: string | null
          disability_type_id?: number | null
          disability_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_disability_type_id_fkey"
            columns: ["disability_type_id"]
            referencedRelation: "disability_types"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_popular_posts: {
        Args: {
          days_range?: number
          limit_count?: number
        }
        Returns: {
          id: string
          author_id: string
          title: string
          excerpt: string | null
          cover_image_path: string | null
          published_at: string
          created_at: string
          views: number
          likes_count: number
        }[]
      }
      get_posts_by_disability_type: {
        Args: {
          disability_type_id: number
          limit_count?: number
        }
        Returns: {
          id: string
          author_id: string
          title: string
          excerpt: string | null
          cover_image_path: string | null
          published_at: string
          created_at: string
          views: number
        }[]
      }
      get_related_posts: {
        Args: {
          post_id: string
          limit_count?: number
        }
        Returns: {
          id: string
          author_id: string
          title: string
          excerpt: string | null
          cover_image_path: string | null
          published_at: string
          created_at: string
          views: number
        }[]
      }
      search_posts: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          author_id: string
          title: string
          content: Json
          excerpt: string | null
          cover_image_path: string | null
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
          views: number
          last_edited_by: string | null
        }[]
      }
      increment_post_views: {
        Args: {
          post_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 