"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Play,
  Pause,
  SkipForward,
  Square,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Workflow, WorkflowRun } from "@/lib/schemas/workflow";

export default function RunWorkflowPage() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  useEffect(() => {
    if (run) {
      subscribeToLogs();
      subscribeToRunUpdates();
    }
  }, [run?.id]);

  const loadWorkflow = async () => {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading workflow:", error);
    } else {
      setWorkflow(data as any);
    }
    setLoading(false);
  };

  const subscribeToLogs = () => {
    if (!run) return;

    const channel = supabase
      .channel(`run_logs:${run.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "run_logs",
          filter: `run_id=eq.${run.id}`,
        },
        (payload) => {
          setLogs((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToRunUpdates = () => {
    if (!run) return;

    const channel = supabase
      .channel(`workflow_runs:${run.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workflow_runs",
          filter: `id=eq.${run.id}`,
        },
        (payload) => {
          setRun(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStart = async () => {
    if (!workflow) return;

    const { data: runId, error } = await supabase.rpc("start_workflow_run", {
      p_workflow_id: workflow.id,
      p_variables: {},
    });

    if (error) {
      console.error("Error starting run:", error);
      return;
    }

    // Load the created run
    const { data: runData } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (runData) {
      setRun(runData as any);

      // Notify extension to start replay
      alert(
        "Run started! Please open the Chrome extension and load this workflow to begin execution."
      );
    }
  };

  const handlePause = async () => {
    if (!run) return;

    await supabase.rpc("pause_workflow_run", {
      p_run_id: run.id,
    });
  };

  const handleResume = async () => {
    if (!run) return;

    await supabase.rpc("resume_workflow_run", {
      p_run_id: run.id,
    });
  };

  const handleStop = async () => {
    if (!run) return;

    await supabase.rpc("update_run_status", {
      p_run_id: run.id,
      p_status: "cancelled",
    });
  };

  const handleNextStep = async () => {
    if (!run) return;

    // In supervised mode, approve the next step
    await supabase.rpc("resume_workflow_run", {
      p_run_id: run.id,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">Workflow not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
          <p className="text-sm text-gray-600">Live Execution Viewer</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Controls
              </h2>

              {!run ? (
                <button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-5 h-5" />
                  Start Execution
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="text-lg font-semibold text-gray-900 capitalize">
                      {run.status}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Progress</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {run.currentStepIndex + 1} / {workflow.steps.length}
                    </div>
                  </div>

                  {run.status === "running" && (
                    <>
                      <button
                        onClick={handlePause}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                      {workflow.settings.supervisedMode && (
                        <button
                          onClick={handleNextStep}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <SkipForward className="w-5 h-5" />
                          Approve Next Step
                        </button>
                      )}
                    </>
                  )}

                  {run.status === "paused" && (
                    <button
                      onClick={handleResume}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-5 h-5" />
                      Resume
                    </button>
                  )}

                  {(run.status === "running" || run.status === "paused") && (
                    <button
                      onClick={handleStop}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Square className="w-5 h-5" />
                      Stop
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Steps and Logs */}
          <div className="col-span-2 space-y-6">
            {/* Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Workflow Steps
              </h2>
              <div className="space-y-2">
                {workflow.steps?.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border-2 ${
                      run && index === run.currentStepIndex
                        ? "border-blue-500 bg-blue-50"
                        : run && index < run.currentStepIndex
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {run && index < run.currentStepIndex && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {run && index === run.currentStepIndex && (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span className="font-medium">
                        Step {index + 1}: {step.type}
                      </span>
                    </div>
                    {step.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {step.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Execution Logs
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-sm text-gray-500">No logs yet</div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        log.level === "error"
                          ? "bg-red-50 text-red-900"
                          : log.level === "warning"
                          ? "bg-yellow-50 text-yellow-900"
                          : log.level === "success"
                          ? "bg-green-50 text-green-900"
                          : "bg-gray-50 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {log.level === "error" && (
                          <AlertCircle className="w-5 h-5 mt-0.5" />
                        )}
                        {log.level === "success" && (
                          <CheckCircle className="w-5 h-5 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {log.message}
                          </div>
                          <div className="text-xs opacity-70">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
