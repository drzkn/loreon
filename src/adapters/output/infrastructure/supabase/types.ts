export interface Database {
  public: {
    Tables: {
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type MarkdownPage = Database['public']['Tables']['markdown_pages']['Row'];
export type MarkdownPageInsert = Database['public']['Tables']['markdown_pages']['Insert'];
export type MarkdownPageUpdate = Database['public']['Tables']['markdown_pages']['Update'];

export interface MarkdownPageWithSimilarity extends MarkdownPage {
  similarity: number;
}