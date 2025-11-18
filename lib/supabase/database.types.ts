export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          tags: string[]
          steps: Json
          variables: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          tags?: string[]
          steps?: Json
          variables?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          tags?: string[]
          steps?: Json
          variables?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      workflow_runs: {
        Row: {
          id: string
          workflow_id: string
          user_id: string
          status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          current_step_index: number
          variables: Json
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          user_id: string
          status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          current_step_index?: number
          variables?: Json
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          user_id?: string
          status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
          current_step_index?: number
          variables?: Json
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      run_logs: {
        Row: {
          id: string
          run_id: string
          step_id: string
          level: 'info' | 'warning' | 'error' | 'success'
          message: string
          screenshot: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          run_id: string
          step_id: string
          level: 'info' | 'warning' | 'error' | 'success'
          message: string
          screenshot?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          run_id?: string
          step_id?: string
          level?: 'info' | 'warning' | 'error' | 'success'
          message?: string
          screenshot?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          user_id: string
          meeting_id: string | null
          platform: 'zoom' | 'google_meet' | 'teams' | null
          content: string
          summary: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meeting_id?: string | null
          platform?: 'zoom' | 'google_meet' | 'teams' | null
          content: string
          summary?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meeting_id?: string | null
          platform?: 'zoom' | 'google_meet' | 'teams' | null
          content?: string
          summary?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      agent_goals: {
        Row: {
          id: string
          user_id: string
          goal: string
          context: Json
          generated_workflow_id: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal: string
          context?: Json
          generated_workflow_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal?: string
          context?: Json
          generated_workflow_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agent_states: {
        Row: {
          id: string
          goal_id: string
          current_phase: 'planning' | 'executing' | 'evaluating' | 'recovering' | 'completed'
          plan: Json
          context: Json
          memory: Json
          tool_calls: Json
          errors: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          current_phase?: 'planning' | 'executing' | 'evaluating' | 'recovering' | 'completed'
          plan?: Json
          context?: Json
          memory?: Json
          tool_calls?: Json
          errors?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          current_phase?: 'planning' | 'executing' | 'evaluating' | 'recovering' | 'completed'
          plan?: Json
          context?: Json
          memory?: Json
          tool_calls?: Json
          errors?: Json
          created_at?: string
          updated_at?: string
        }
      }
      recorded_events: {
        Row: {
          id: string
          user_id: string
          session_id: string
          event_type: string
          timestamp: number
          target: Json
          data: Json
          url: string
          viewport: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          event_type: string
          timestamp: number
          target: Json
          data?: Json
          url: string
          viewport?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          event_type?: string
          timestamp?: number
          target?: Json
          data?: Json
          url?: string
          viewport?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_recorded_events: {
        Args: {
          p_session_id: string
          p_events: Json
        }
        Returns: string
      }
      create_workflow_from_events: {
        Args: {
          p_session_id: string
          p_name: string
          p_description?: string
        }
        Returns: string
      }
      start_workflow_run: {
        Args: {
          p_workflow_id: string
          p_variables?: Json
        }
        Returns: string
      }
      update_run_status: {
        Args: {
          p_run_id: string
          p_status: string
          p_current_step_index?: number
          p_error?: string
        }
        Returns: boolean
      }
      add_run_log: {
        Args: {
          p_run_id: string
          p_step_id: string
          p_level: string
          p_message: string
          p_screenshot?: string
          p_metadata?: Json
        }
        Returns: string
      }
      pause_workflow_run: {
        Args: {
          p_run_id: string
        }
        Returns: boolean
      }
      resume_workflow_run: {
        Args: {
          p_run_id: string
        }
        Returns: boolean
      }
      get_next_step: {
        Args: {
          p_run_id: string
        }
        Returns: Json
      }
      update_run_variables: {
        Args: {
          p_run_id: string
          p_variables: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

