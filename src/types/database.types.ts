export interface Database {
  public: {
    Tables: {
      sticky_messages: {
        Row: {
          channel_id: string;
          type: 'embed' | 'content';
          payload: string;
          last_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          channel_id: string;
          type: 'embed' | 'content';
          payload: string;
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          channel_id?: string;
          type?: 'embed' | 'content';
          payload?: string;
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type StickyMessageRow = Database['public']['Tables']['sticky_messages']['Row'];
