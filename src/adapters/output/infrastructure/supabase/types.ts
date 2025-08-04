export interface Database {
  public: {
    Tables: {
      // Sistema legacy - mantener para compatibilidad
      markdown_pages: {
        Row: {
          id: string;
          notion_page_id: string;
          title: string;
          content: string;
          notion_url: string | null;
          created_at: string;
          updated_at: string;
          notion_created_time: string | null;
          notion_last_edited_time: string | null;
          tags: string[];
          metadata: Record<string, unknown>;
          embedding: number[] | null; // vector(768) - Google Generative AI
        };
        Insert: {
          id?: string;
          notion_page_id: string;
          title: string;
          content: string;
          notion_url?: string | null;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string | null;
          notion_last_edited_time?: string | null;
          tags?: string[];
          metadata?: Record<string, unknown>;
          embedding?: number[] | null; // vector(768) - Google Generative AI
        };
        Update: {
          id?: string;
          notion_page_id?: string;
          title?: string;
          content?: string;
          notion_url?: string | null;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string | null;
          notion_last_edited_time?: string | null;
          tags?: string[];
          metadata?: Record<string, unknown>;
          embedding?: number[]; // vector(768) - Google Generative AI
        };
      };

      // Sistema nativo - tablas principales
      notion_pages: {
        Row: {
          id: string;
          notion_id: string;
          title: string;
          parent_id?: string;
          database_id?: string;
          url?: string;
          icon_emoji?: string;
          icon_url?: string;
          cover_url?: string;
          created_at: string;
          updated_at: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived: boolean;
          properties: Record<string, unknown>;
          raw_data: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          notion_id: string;
          title: string;
          parent_id?: string;
          database_id?: string;
          url?: string;
          icon_emoji?: string;
          icon_url?: string;
          cover_url?: string;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived?: boolean;
          properties: Record<string, unknown>;
          raw_data: Record<string, unknown>;
        };
        Update: {
          id?: string;
          notion_id?: string;
          title?: string;
          parent_id?: string;
          database_id?: string;
          url?: string;
          icon_emoji?: string;
          icon_url?: string;
          cover_url?: string;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived?: boolean;
          properties?: Record<string, unknown>;
          raw_data?: Record<string, unknown>;
        };
      };

      notion_blocks: {
        Row: {
          id: string;
          notion_id: string;
          page_id: string;
          parent_block_id?: string;
          type: string;
          content: Record<string, unknown>;
          plain_text: string;
          html_content: string;
          hierarchy_path?: string;
          position: number;
          has_children: boolean;
          created_at: string;
          updated_at: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived: boolean;
          raw_data: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          notion_id: string;
          page_id: string;
          parent_block_id?: string;
          type: string;
          content: Record<string, unknown>;
          plain_text: string;
          html_content: string;
          hierarchy_path?: string;
          position: number;
          has_children: boolean;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived?: boolean;
          raw_data: Record<string, unknown>;
        };
        Update: {
          id?: string;
          notion_id?: string;
          page_id?: string;
          parent_block_id?: string;
          type?: string;
          content?: Record<string, unknown>;
          plain_text?: string;
          html_content?: string;
          hierarchy_path?: string;
          position?: number;
          has_children?: boolean;
          created_at?: string;
          updated_at?: string;
          notion_created_time?: string;
          notion_last_edited_time?: string;
          archived?: boolean;
          raw_data?: Record<string, unknown>;
        };
      };

      notion_embeddings: {
        Row: {
          id: string;
          block_id: string;
          page_id: string;
          embedding: number[]; // vector(768) - Google Generative AI
          content_hash: string;
          chunk_index: number;
          chunk_text: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          block_id: string;
          page_id: string;
          embedding: number[]; // vector(768) - Google Generative AI
          content_hash: string;
          chunk_index: number;
          chunk_text: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          block_id?: string;
          page_id?: string;
          embedding?: number[]; // vector(768) - Google Generative AI
          content_hash?: string;
          chunk_index?: number;
          chunk_text?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };

      notion_sync_log: {
        Row: {
          id: string;
          sync_type: 'full' | 'incremental' | 'page' | 'block';
          status: 'pending' | 'running' | 'completed' | 'failed';
          started_at: string;
          completed_at?: string;
          pages_processed: number;
          blocks_processed: number;
          embeddings_generated: number;
          errors?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          sync_type: 'full' | 'incremental' | 'page' | 'block';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string;
          completed_at?: string;
          pages_processed?: number;
          blocks_processed?: number;
          embeddings_generated?: number;
          errors?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          sync_type?: 'full' | 'incremental' | 'page' | 'block';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          started_at?: string;
          completed_at?: string;
          pages_processed?: number;
          blocks_processed?: number;
          embeddings_generated?: number;
          errors?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      // Funciones RPC para búsqueda vectorial
      match_documents: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: Array<{
          id: string;
          title: string;
          content: string;
          notion_url: string | null;
          similarity: number;
        }>;
      };
      match_embeddings: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: Array<{
          id: string;
          block_id: string;
          page_id: string;
          embedding: number[];
          content_hash: string;
          chunk_index: number;
          chunk_text: string;
          metadata: Record<string, unknown>;
          similarity: number;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Tipos extraídos para facilidad de uso
export type MarkdownPage = Database['public']['Tables']['markdown_pages']['Row'];
export type MarkdownPageInsert = Database['public']['Tables']['markdown_pages']['Insert'];
export type MarkdownPageUpdate = Database['public']['Tables']['markdown_pages']['Update'];

export type NotionPage = Database['public']['Tables']['notion_pages']['Row'];
export type NotionPageInsert = Database['public']['Tables']['notion_pages']['Insert'];
export type NotionPageUpdate = Database['public']['Tables']['notion_pages']['Update'];

export type NotionBlock = Database['public']['Tables']['notion_blocks']['Row'];
export type NotionBlockInsert = Database['public']['Tables']['notion_blocks']['Insert'];
export type NotionBlockUpdate = Database['public']['Tables']['notion_blocks']['Update'];

export type NotionEmbedding = Database['public']['Tables']['notion_embeddings']['Row'];
export type NotionEmbeddingInsert = Database['public']['Tables']['notion_embeddings']['Insert'];
export type NotionEmbeddingUpdate = Database['public']['Tables']['notion_embeddings']['Update'];

export type NotionSyncLog = Database['public']['Tables']['notion_sync_log']['Row'];
export type NotionSyncLogInsert = Database['public']['Tables']['notion_sync_log']['Insert'];
export type NotionSyncLogUpdate = Database['public']['Tables']['notion_sync_log']['Update'];

// Nuevo tipo para resultados de búsqueda del sistema nativo
export interface NotionSearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  notion_url?: string | null;
  chunk_text?: string;
  section?: string;
}

// Compatibilidad con el sistema legacy
export interface MarkdownPageWithSimilarity extends MarkdownPage {
  similarity: number;
}