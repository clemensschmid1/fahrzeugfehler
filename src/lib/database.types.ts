// src/lib/database.types.ts
export type Database = {
    public: {
      Tables: {
        comments: {
          Row: {
            id: string;
            content: string;
            created_at: string;
            user_id: string;
          };
        };
        questions: {
          Row: {
            id: string;
            slug: string;
            question: string;
            answer: string;
            language_path: string;
            created_at: string;
            status: 'draft' | 'live' | 'bin';
            header?: string;
            manufacturer?: string;
            part_type?: string;
            part_series?: string;
            embedding?: number[];
            seo_score?: number;
            content_score?: number;
            expertise_score?: number;
            helpfulness_score?: number;
            meta_description?: string;
            parent_id?: string;
            conversation_id?: string;
            is_main?: boolean;
            meta_generated?: boolean;
            sector?: string;
            related_slugs?: string[];
            question_type?: string;
            affected_components?: string[];
            error_code?: string;
            complexity_level?: string;
            related_processes?: string[];
            confidentiality_flag?: boolean;
          };
        };
      };
    };
  };
  