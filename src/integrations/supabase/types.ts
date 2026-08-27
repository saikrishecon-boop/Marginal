export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      ai_provider_keys: {
        Row: {
          api_key: string;
          base_url: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          label: string;
          model: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          api_key: string;
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          label: string;
          model: string;
          provider: string;
          updated_at?: string;
        };
        Update: {
          api_key?: string;
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          model?: string;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage_log: {
        Row: {
          completion_tokens: number | null;
          created_at: string;
          error_message: string | null;
          feature: string;
          id: string;
          latency_ms: number | null;
          model: string;
          ok: boolean;
          prompt_tokens: number | null;
          user_id: string | null;
        };
        Insert: {
          completion_tokens?: number | null;
          created_at?: string;
          error_message?: string | null;
          feature: string;
          id?: string;
          latency_ms?: number | null;
          model: string;
          ok?: boolean;
          prompt_tokens?: number | null;
          user_id?: string | null;
        };
        Update: {
          completion_tokens?: number | null;
          created_at?: string;
          error_message?: string | null;
          feature?: string;
          id?: string;
          latency_ms?: number | null;
          model?: string;
          ok?: boolean;
          prompt_tokens?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      calibration_anchors: {
        Row: {
          active: boolean;
          band_label: string;
          created_at: string;
          created_by: string | null;
          essay_text: string;
          id: string;
          mark: number;
          max_mark: number;
          notes: string | null;
          question: string;
        };
        Insert: {
          active?: boolean;
          band_label?: string;
          created_at?: string;
          created_by?: string | null;
          essay_text: string;
          id?: string;
          mark: number;
          max_mark?: number;
          notes?: string | null;
          question: string;
        };
        Update: {
          active?: boolean;
          band_label?: string;
          created_at?: string;
          created_by?: string | null;
          essay_text?: string;
          id?: string;
          mark?: number;
          max_mark?: number;
          notes?: string | null;
          question?: string;
        };
        Relationships: [];
      };
      custom_diagrams: {
        Row: {
          created_at: string;
          created_by: string | null;
          exam_questions: string[];
          how_to_read: string[];
          id: string;
          labels: Json;
          level: string;
          mistakes: string[];
          real_world: string[];
          related: string[];
          represents: string;
          section: string;
          slug: string;
          spec: Json;
          tips: string[];
          title: string;
          topic: string;
          updated_at: string;
          when_to_draw: string;
          why_used: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          exam_questions?: string[];
          how_to_read?: string[];
          id?: string;
          labels?: Json;
          level?: string;
          mistakes?: string[];
          real_world?: string[];
          related?: string[];
          represents?: string;
          section?: string;
          slug: string;
          spec?: Json;
          tips?: string[];
          title: string;
          topic?: string;
          updated_at?: string;
          when_to_draw?: string;
          why_used?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          exam_questions?: string[];
          how_to_read?: string[];
          id?: string;
          labels?: Json;
          level?: string;
          mistakes?: string[];
          real_world?: string[];
          related?: string[];
          represents?: string;
          section?: string;
          slug?: string;
          spec?: Json;
          tips?: string[];
          title?: string;
          topic?: string;
          updated_at?: string;
          when_to_draw?: string;
          why_used?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          chunk_index: number;
          content: string;
          created_at: string;
          document_id: string;
          embedding: string | null;
          heading: string | null;
          id: string;
          model_version: string;
          token_estimate: number;
          topic_id: string | null;
        };
        Insert: {
          chunk_index: number;
          content: string;
          created_at?: string;
          document_id: string;
          embedding?: string | null;
          heading?: string | null;
          id?: string;
          model_version?: string;
          token_estimate?: number;
          topic_id?: string | null;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          created_at?: string;
          document_id?: string;
          embedding?: string | null;
          heading?: string | null;
          id?: string;
          model_version?: string;
          token_estimate?: number;
          topic_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_chunks_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      essay_versions: {
        Row: {
          ao1_awarded: number | null;
          ao2_awarded: number | null;
          ao3_awarded: number | null;
          audited: boolean;
          confidence: number | null;
          created_at: string;
          essay_id: string;
          essay_text: string;
          grading: Json;
          id: string;
          model: string | null;
          sources: Json;
          total_mark: number | null;
          user_id: string;
          version: number;
        };
        Insert: {
          ao1_awarded?: number | null;
          ao2_awarded?: number | null;
          ao3_awarded?: number | null;
          audited?: boolean;
          confidence?: number | null;
          created_at?: string;
          essay_id: string;
          essay_text: string;
          grading?: Json;
          id?: string;
          model?: string | null;
          sources?: Json;
          total_mark?: number | null;
          user_id: string;
          version?: number;
        };
        Update: {
          ao1_awarded?: number | null;
          ao2_awarded?: number | null;
          ao3_awarded?: number | null;
          audited?: boolean;
          confidence?: number | null;
          created_at?: string;
          essay_id?: string;
          essay_text?: string;
          grading?: Json;
          id?: string;
          model?: string | null;
          sources?: Json;
          total_mark?: number | null;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "essay_versions_essay_id_fkey";
            columns: ["essay_id"];
            isOneToOne: false;
            referencedRelation: "essays";
            referencedColumns: ["id"];
          },
        ];
      };
      essays: {
        Row: {
          created_at: string;
          id: string;
          latest_mark: number | null;
          max_mark: number;
          question: string;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latest_mark?: number | null;
          max_mark?: number;
          question: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          latest_mark?: number | null;
          max_mark?: number;
          question?: string;
          topic_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "essays_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_documents: {
        Row: {
          char_count: number;
          chunk_count: number;
          content_hash: string | null;
          created_at: string;
          doc_type: Database["public"]["Enums"]["doc_type"];
          error_message: string | null;
          exam_series: string | null;
          id: string;
          source_name: string | null;
          status: Database["public"]["Enums"]["ingest_status"];
          storage_path: string | null;
          subject_id: string | null;
          title: string;
          topic_id: string | null;
          unit_id: string | null;
          updated_at: string;
          uploaded_by: string | null;
          version: number;
        };
        Insert: {
          char_count?: number;
          chunk_count?: number;
          content_hash?: string | null;
          created_at?: string;
          doc_type?: Database["public"]["Enums"]["doc_type"];
          error_message?: string | null;
          exam_series?: string | null;
          id?: string;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["ingest_status"];
          storage_path?: string | null;
          subject_id?: string | null;
          title: string;
          topic_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          version?: number;
        };
        Update: {
          char_count?: number;
          chunk_count?: number;
          content_hash?: string | null;
          created_at?: string;
          doc_type?: Database["public"]["Enums"]["doc_type"];
          error_message?: string | null;
          exam_series?: string | null;
          id?: string;
          source_name?: string | null;
          status?: Database["public"]["Enums"]["ingest_status"];
          storage_path?: string | null;
          subject_id?: string | null;
          title?: string;
          topic_id?: string | null;
          unit_id?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_documents_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_documents_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      mcq_attempts: {
        Row: {
          answers: Json;
          completed_at: string | null;
          created_at: string;
          id: string;
          level: string;
          model: string | null;
          questions: Json;
          score: number | null;
          status: string;
          title: string;
          topic: string | null;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          level?: string;
          model?: string | null;
          questions?: Json;
          score?: number | null;
          status?: string;
          title?: string;
          topic?: string | null;
          total?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          level?: string;
          model?: string | null;
          questions?: Json;
          score?: number | null;
          status?: string;
          title?: string;
          topic?: string | null;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          school: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          school?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          school?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          level: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          level?: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          level?: string;
          name?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          code: string | null;
          created_at: string;
          difficulty: number;
          id: string;
          is_extension: boolean;
          learning_outcomes: string[];
          name: string;
          parent_id: string | null;
          position: number;
          syllabus_ref: string | null;
          unit_id: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          difficulty?: number;
          id?: string;
          is_extension?: boolean;
          learning_outcomes?: string[];
          name: string;
          parent_id?: string | null;
          position?: number;
          syllabus_ref?: string | null;
          unit_id: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          difficulty?: number;
          id?: string;
          is_extension?: boolean;
          learning_outcomes?: string[];
          name?: string;
          parent_id?: string | null;
          position?: number;
          syllabus_ref?: string | null;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topics_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      units: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          name: string;
          paper: string | null;
          position: number;
          subject_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          name: string;
          paper?: string | null;
          position?: number;
          subject_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          name?: string;
          paper?: string | null;
          position?: number;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      match_document_chunks: {
        Args: {
          filter_doc_types?: Database["public"]["Enums"]["doc_type"][];
          filter_topic_id?: string;
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          chunk_id: string;
          content: string;
          doc_type: Database["public"]["Enums"]["doc_type"];
          document_id: string;
          document_title: string;
          heading: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      app_role: "student" | "teacher" | "admin";
      doc_type:
        | "coursebook"
        | "syllabus"
        | "mark_scheme"
        | "past_paper"
        | "mcq_calibration"
        | "examiner_report"
        | "notes"
        | "other";
      ingest_status: "pending" | "processing" | "ready" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
      doc_type: [
        "coursebook",
        "syllabus",
        "mark_scheme",
        "past_paper",
        "mcq_calibration",
        "examiner_report",
        "notes",
        "other",
      ],
      ingest_status: ["pending", "processing", "ready", "failed"],
    },
  },
} as const;
