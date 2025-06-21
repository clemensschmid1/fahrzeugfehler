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
          is_main?: boolean;
          seo_score?: number;
          content_score?: number;
          expertise_score?: number;
          helpfulness_score?: number;
          meta_description?: string;
          parent_id?: string;
          conversation_id?: string;
          meta_generated?: boolean;
          related_slugs?: string[];
          question_type?: string;
          affected_components?: string[];
          error_code?: string;
          complexity_level?: string;
          related_processes?: string[];
          confidentiality_flag?: boolean;
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
