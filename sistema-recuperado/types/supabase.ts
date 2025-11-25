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
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          description?: string | null
          order_index?: number
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          description?: string | null
          order_index?: number
          image_url?: string | null
        }
        Relationships: []
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
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          video_url?: string | null
          module_id: string
          duration_seconds?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          video_url?: string | null
          module_id?: string
          duration_seconds?: number | null
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
