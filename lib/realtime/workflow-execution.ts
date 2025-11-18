import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { WorkflowRun } from '@/lib/schemas/workflow';

export interface ExecutionEvent {
  type: 'status_change' | 'step_completed' | 'log' | 'error' | 'approval_needed';
  runId: string;
  data: any;
  timestamp: string;
}

export class WorkflowExecutionManager {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private runId: string;
  private listeners: Map<string, ((event: ExecutionEvent) => void)[]> = new Map();

  constructor(runId: string) {
    this.runId = runId;
  }

  async start() {
    // Subscribe to run updates
    this.channel = this.supabase
      .channel(`workflow_execution:${this.runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_runs',
          filter: `id=eq.${this.runId}`,
        },
        (payload) => {
          this.emit({
            type: 'status_change',
            runId: this.runId,
            data: payload.new,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_logs',
          filter: `run_id=eq.${this.runId}`,
        },
        (payload) => {
          this.emit({
            type: 'log',
            runId: this.runId,
            data: payload.new,
            timestamp: new Date().toISOString(),
          });
        }
      )
      .subscribe();
  }

  stop() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  on(eventType: string, callback: (event: ExecutionEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: ExecutionEvent) => void) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: ExecutionEvent) {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((callback) => callback(event));
    }
  }

  async pause() {
    await this.supabase.rpc('pause_workflow_run', {
      p_run_id: this.runId,
    });
  }

  async resume() {
    await this.supabase.rpc('resume_workflow_run', {
      p_run_id: this.runId,
    });
  }

  async approveNextStep() {
    // In supervised mode, resuming allows the next step
    await this.resume();
  }

  async stop() {
    await this.supabase.rpc('update_run_status', {
      p_run_id: this.runId,
      p_status: 'cancelled',
    });
  }

  async addLog(
    stepId: string,
    level: 'info' | 'warning' | 'error' | 'success',
    message: string,
    screenshot?: string,
    metadata?: Record<string, any>
  ) {
    await this.supabase.rpc('add_run_log', {
      p_run_id: this.runId,
      p_step_id: stepId,
      p_level: level,
      p_message: message,
      p_screenshot: screenshot,
      p_metadata: metadata,
    });
  }
}

// Hook for React components
import { useEffect, useState } from 'react';

export function useWorkflowExecution(runId: string | null) {
  const [manager, setManager] = useState<WorkflowExecutionManager | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!runId) return;

    const newManager = new WorkflowExecutionManager(runId);
    
    newManager.on('status_change', (event) => {
      setRun(event.data);
    });

    newManager.on('log', (event) => {
      setLogs((prev) => [...prev, event.data]);
    });

    newManager.start();
    setManager(newManager);

    return () => {
      newManager.stop();
    };
  }, [runId]);

  return {
    manager,
    run,
    logs,
    pause: () => manager?.pause(),
    resume: () => manager?.resume(),
    approveNextStep: () => manager?.approveNextStep(),
    stop: () => manager?.stop(),
  };
}

