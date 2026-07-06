export interface Database {
  public: {
    Tables: {
      participants: {
        Row: {
          discord_id: string;
          github_username: string | null;
          skills_boost_profile: string | null;
          is_verified: boolean;
          xp: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          discord_id: string;
          github_username?: string | null;
          skills_boost_profile?: string | null;
          is_verified?: boolean;
          xp?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          discord_id?: string;
          github_username?: string | null;
          skills_boost_profile?: string | null;
          is_verified?: boolean;
          xp?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          participant_id: string;
          type: 'lab' | 'badge';
          name: string;
          status: 'pending' | 'approved' | 'rejected';
          xp_awarded: number;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          type: 'lab' | 'badge';
          name: string;
          status?: 'pending' | 'approved' | 'rejected';
          xp_awarded?: number;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          type?: 'lab' | 'badge';
          name?: string;
          status?: 'pending' | 'approved' | 'rejected';
          xp_awarded?: number;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      xp_log: {
        Row: {
          id: string;
          participant_id: string;
          amount: number;
          source: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          amount: number;
          source: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          amount?: number;
          source?: string;
          reference_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type ParticipantRow = Database['public']['Tables']['participants']['Row'];
export type SubmissionRow = Database['public']['Tables']['submissions']['Row'];
export type XpLogRow = Database['public']['Tables']['xp_log']['Row'];
