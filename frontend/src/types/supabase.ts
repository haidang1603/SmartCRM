export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
        };
      };
      users: {
        Row: {
          id: number;
          username: string;
          email: string;
          full_name: string;
          phone_number: string | null;
          active: boolean;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          username: string;
          email: string;
          full_name: string;
          phone_number?: string | null;
          active?: boolean;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          username?: string;
          email?: string;
          full_name?: string;
          phone_number?: string | null;
          active?: boolean;
          is_demo?: boolean;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          user_id: number;
          role_id: number;
        };
        Insert: {
          user_id: number;
          role_id: number;
        };
        Update: {
          user_id?: number;
          role_id?: number;
        };
      };
      customers: {
        Row: {
          id: number;
          full_name: string;
          email: string;
          phone_number: string | null;
          company_name: string | null;
          status: string;
          assigned_to_id: number | null;
          notes: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          full_name: string;
          email: string;
          phone_number?: string | null;
          company_name?: string | null;
          status?: string;
          assigned_to_id?: number | null;
          notes?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          full_name?: string;
          email?: string;
          phone_number?: string | null;
          company_name?: string | null;
          status?: string;
          assigned_to_id?: number | null;
          notes?: string | null;
          is_demo?: boolean;
          updated_at?: string;
        };
      };
      customer_interactions: {
        Row: {
          id: number;
          customer_id: number;
          interaction_type: string;
          summary: string;
          details: string | null;
          performed_by_id: number | null;
          interaction_date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          customer_id: number;
          interaction_type: string;
          summary: string;
          details?: string | null;
          performed_by_id?: number | null;
          interaction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: number;
          interaction_type?: string;
          summary?: string;
          details?: string | null;
          performed_by_id?: number | null;
          interaction_date?: string;
        };
      };
      deals: {
        Row: {
          id: number;
          title: string;
          deal_value: number;
          stage: string;
          probability: number;
          customer_id: number;
          assigned_to_id: number | null;
          expected_close_date: string | null;
          actual_close_date: string | null;
          notes: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          deal_value?: number;
          stage?: string;
          probability?: number;
          customer_id: number;
          assigned_to_id?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          deal_value?: number;
          stage?: string;
          probability?: number;
          customer_id?: number;
          assigned_to_id?: number | null;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          is_demo?: boolean;
          updated_at?: string;
        };
      };
      deal_stage_history: {
        Row: {
          id: number;
          deal_id: number;
          previous_stage: string | null;
          new_stage: string;
          changed_by_id: number | null;
          change_date: string;
          comment: string | null;
        };
        Insert: {
          id?: number;
          deal_id: number;
          previous_stage?: string | null;
          new_stage: string;
          changed_by_id?: number | null;
          change_date?: string;
          comment?: string | null;
        };
        Update: {
          id?: number;
          deal_id?: number;
          previous_stage?: string | null;
          new_stage?: string;
          changed_by_id?: number | null;
          comment?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: number;
          action: string;
          entity_name: string;
          entity_id: number | null;
          performed_by: string;
          details: string | null;
          timestamp: string;
          ip_address: string | null;
        };
        Insert: {
          id?: number;
          action: string;
          entity_name: string;
          entity_id?: number | null;
          performed_by: string;
          details?: string | null;
          timestamp?: string;
          ip_address?: string | null;
        };
        Update: {
          id?: number;
          action?: string;
          entity_name?: string;
          entity_id?: number | null;
          performed_by?: string;
          details?: string | null;
        };
      };
      performance_benchmarks: {
        Row: {
          id: number;
          run_uuid: string;
          scenario_name: string;
          run_type: string;
          environment: string;
          virtual_users: number;
          iterations: number;
          total_requests: number;
          successful_requests: number;
          failed_requests: number;
          duration_ms: number;
          throughput_rps: number;
          min_latency_ms: number;
          avg_latency_ms: number;
          p50_latency_ms: number;
          p95_latency_ms: number;
          p99_latency_ms: number;
          max_latency_ms: number;
          error_rate: number;
          cpu_usage_pct: number | null;
          memory_used_mb: number | null;
          cache_hit_ratio: number | null;
          executed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          run_uuid: string;
          scenario_name: string;
          run_type: string;
          environment?: string;
          virtual_users?: number;
          iterations?: number;
          total_requests: number;
          successful_requests: number;
          failed_requests?: number;
          duration_ms: number;
          throughput_rps: number;
          min_latency_ms: number;
          avg_latency_ms: number;
          p50_latency_ms: number;
          p95_latency_ms: number;
          p99_latency_ms: number;
          max_latency_ms: number;
          error_rate?: number;
          cpu_usage_pct?: number | null;
          memory_used_mb?: number | null;
          cache_hit_ratio?: number | null;
          executed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          run_uuid?: string;
          scenario_name?: string;
          run_type?: string;
          environment?: string;
          virtual_users?: number;
          iterations?: number;
          total_requests?: number;
          successful_requests?: number;
          failed_requests?: number;
          duration_ms?: number;
          throughput_rps?: number;
          min_latency_ms?: number;
          avg_latency_ms?: number;
          p50_latency_ms?: number;
          p95_latency_ms?: number;
          p99_latency_ms?: number;
          max_latency_ms?: number;
          error_rate?: number;
          cpu_usage_pct?: number | null;
          memory_used_mb?: number | null;
          cache_hit_ratio?: number | null;
          executed_by?: string;
          notes?: string | null;
        };
      };
    };
  };
}
