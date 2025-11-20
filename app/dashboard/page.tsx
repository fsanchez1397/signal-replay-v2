"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Play, Edit, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Workflow } from "@/lib/schemas/workflow";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading workflows:", error);
    } else {
      setWorkflows(data as any[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    const { error } = await supabase.from("workflows").delete().eq("id", id);

    if (error) {
      console.error("Error deleting workflow:", error);
    } else {
      loadWorkflows();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Signal Recorder</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/workflows/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </Link>
          <Link
            href="/workflows/generate"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Sparkles className="w-5 h-5" />
            Generate with AI
          </Link>
        </div>

        {/* Workflows List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Workflows
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No workflows yet. Create your first workflow to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {workflow.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>{workflow.steps?.length ?? 0} steps</span>
                        {workflow.tags && workflow.tags.length > 0 && (
                          <div className="flex gap-1">
                            {workflow.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/workflows/${workflow.id}/run`}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Run workflow"
                      >
                        <Play className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/workflows/${workflow.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit workflow"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(workflow.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete workflow"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
