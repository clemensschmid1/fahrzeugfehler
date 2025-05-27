export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          question: string;
          answer: string;
          sector: string;
          created_at: string;
          slug: string;
          status: 'draft' | 'live' | 'bin';
          header?: string;
          manufacturer?: string;
          part_type?: string;
          part_series?: string;
          embedding?: number[];
          language_path: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          user_id: string;
        };
      };
    };
  };
}
