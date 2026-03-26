export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          bankroll: number;
          starting_bankroll: number;
          total_profit: number;
          races_played: number;
          biggest_win: number;
          last_active: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          bankroll?: number;
          starting_bankroll?: number;
          total_profit?: number;
          races_played?: number;
          biggest_win?: number;
          last_active?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bankroll?: number;
          starting_bankroll?: number;
          total_profit?: number;
          races_played?: number;
          biggest_win?: number;
          last_active?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          player_id: string;
          race_epoch: number;
          bet_type: string;
          selections: string[];
          amount: number;
          total_cost: number;
          combinations: number;
          payout: number;
          won: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          race_epoch: number;
          bet_type: string;
          selections: string[];
          amount: number;
          total_cost: number;
          combinations: number;
          payout?: number;
          won?: boolean;
          created_at?: string;
        };
        Update: {
          payout?: number;
          won?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
