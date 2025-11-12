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
            voltage?: string;
            current?: string;
            power_rating?: string;
            machine_type?: string;
            application_area?: string[];
            product_category?: string;
            electrical_type?: string;
            control_type?: string;
            relevant_standards?: string[];
            mounting_type?: string;
            cooling_method?: string;
            communication_protocols?: string[];
            manufacturer_mentions?: string[];
            risk_keywords?: string[];
            tools_involved?: string[];
            installation_context?: string;
            sensor_type?: string;
            mechanical_component?: string;
            industry_tag?: string;
            maintenance_relevance?: boolean;
            failure_mode?: string;
            software_context?: string;
          };
        };
        generated_questions: {
          Row: {
            id: string;
            question_text: string;
            question_hash: string;
            language: string;
            generated_at: string;
            exported_at?: string;
            export_filename?: string;
            prompt_used?: string;
            ai_model_used?: string;
          };
        };
        removed_slugs: {
          Row: {
            id: string;
            slug: string;
            language: string;
            removed_at: string;
          };
        };
        questions2: {
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
            voltage?: string;
            current?: string;
            power_rating?: string;
            machine_type?: string;
            application_area?: string[];
            product_category?: string;
            electrical_type?: string;
            control_type?: string;
            relevant_standards?: string[];
            mounting_type?: string;
            cooling_method?: string;
            communication_protocols?: string[];
            manufacturer_mentions?: string[];
            risk_keywords?: string[];
            tools_involved?: string[];
            installation_context?: string;
            sensor_type?: string;
            mechanical_component?: string;
            industry_tag?: string;
            maintenance_relevance?: boolean;
            failure_mode?: string;
            software_context?: string;
            reviewed_by?: string;
            reviewed_at?: string;
            last_updated?: string;
            update_count?: number;
            editor_notes?: string;
          };
        };
        reviews: {
          Row: {
            id: string;
            user_id?: string;
            username?: string;
            rating: number;
            review_text: string;
            language_path: string;
            status: 'pending' | 'approved' | 'rejected';
            created_at: string;
            updated_at: string;
            job_title?: string;
            company?: string;
          };
        };
      };
    };
  };
  