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
          };
        };
      };
    };
  };
  