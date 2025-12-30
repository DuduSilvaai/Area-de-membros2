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
      modules: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          title: string
          description: string | null
          order_index: number
          image_url: string | null
          portal_id: string | null
          parent_module_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          description?: string | null
          order_index?: number
          image_url?: string | null
          portal_id?: string | null
          parent_module_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          description?: string | null
          order_index?: number
          image_url?: string | null
          portal_id?: string | null
          parent_module_id?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "modules_portal_id_fkey"
            columns: ["portal_id"]
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_parent_module_id_fkey"
            columns: ["parent_module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      contents: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          title: string
          video_url: string | null
          module_id: string
          duration_seconds: number | null
          order_index: number
          content_type: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          video_url?: string | null
          module_id: string
          duration_seconds?: number | null
          order_index?: number
          content_type?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          video_url?: string | null
          module_id?: string
          duration_seconds?: number | null
          order_index?: number
          content_type?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contents_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      portals: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string | null
          created_by: string | null
          is_active: boolean
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          is_active?: boolean
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string | null
          created_by?: string | null
          is_active?: boolean
          settings?: Json | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          portal_id: string
          permissions: Json
          enrolled_at: string
          enrolled_by: string | null
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          portal_id: string
          permissions?: Json
          enrolled_at?: string
          enrolled_by?: string | null
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          portal_id?: string
          permissions?: Json
          enrolled_at?: string
          enrolled_by?: string | null
          expires_at?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_portal_id_fkey"
            columns: ["portal_id"]
            referencedRelation: "portals"
            referencedColumns: ["id"]
          }
        ]
      },
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      },
      comments: {
        Row: {
          id: string
          user_id: string
          content_id: string
          text: string
          created_at: string
          updated_at: string | null
          parent_comment_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          text: string
          created_at?: string
          updated_at?: string | null
          parent_comment_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          text?: string
          created_at?: string
          updated_at?: string | null
          parent_comment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_content_id_fkey"
            columns: ["content_id"]
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      },
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      },
      access_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: Json | null
          content_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Json | null
          content_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          content_id?: string | null
          created_at?: string
        }
        Relationships: []
      },
      progress: {
        Row: {
          id: string
          user_id: string
          content_id: string
          is_completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_content_id_fkey"
            columns: ["content_id"]
            referencedRelation: "contents"
            referencedColumns: ["id"]
          }
        ]
      },
      conversations: {
        Row: {
          id: string
          student_id: string
          admin_id: string | null
          portal_id: string | null
          last_message_at: string
          last_message_preview: string | null
          unread_count_admin: number
          unread_count_student: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          admin_id?: string | null
          portal_id?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          unread_count_admin?: number
          unread_count_student?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          admin_id?: string | null
          portal_id?: string | null
          last_message_at?: string
          last_message_preview?: string | null
          unread_count_admin?: number
          unread_count_student?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_portal_id_fkey"
            columns: ["portal_id"]
            referencedRelation: "portals"
            referencedColumns: ["id"]
          }
        ]
      },
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          type: 'text' | 'image' | 'file' | 'video' | 'meeting'
          content: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          type?: 'text' | 'image' | 'file' | 'video' | 'meeting'
          content: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          type?: 'text' | 'image' | 'file' | 'video' | 'meeting'
          content?: Json
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Module = Tables<'modules'>
export type Content = Tables<'contents'>

export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
