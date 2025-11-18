'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';

export default function GenerateWorkflowPage() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGeneratedWorkflow(null);

    try {
      const response = await fetch('/api/agent/generate-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          context: context ? JSON.parse(context) : {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();
      setGeneratedWorkflow(data.workflow);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!generatedWorkflow) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: generatedWorkflow.name,
          description: generatedWorkflow.description,
          steps: generatedWorkflow.steps,
          tags: generatedWorkflow.tags || [],
          variables: generatedWorkflow.variables || {},
          settings: generatedWorkflow.settings || {
            supervisedMode: true,
            pauseOnError: true,
            maxRetries: 3,
            screenshotOnError: true,
          },
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/workflows/${data.id}/edit`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Generate Workflow with AI
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Goal
              </label>
              <textarea
                id="goal"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Example: Find candidates for this job across LinkedIn and Indeed, evaluate if they are a fit, message them a custom template, schedule a meeting with qualified candidates, obtain the meeting transcript from Google Meet or Zoom, summarize the candidate, and enter the information into the ATS."
              />
              <p className="mt-2 text-sm text-gray-500">
                Be as specific as possible about what you want to accomplish
              </p>
            </div>

            <div>
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Context (JSON, optional)
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                placeholder='{"jobTitle": "Senior Software Engineer", "location": "Remote"}'
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Workflow
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Generated Workflow Preview */}
        {generatedWorkflow && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {generatedWorkflow.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {generatedWorkflow.description}
                </p>
              </div>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Workflow
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Generated Steps ({generatedWorkflow.steps?.length || 0})
              </h3>
              <div className="space-y-3">
                {generatedWorkflow.steps?.map((step: any, index: number) => (
                  <div
                    key={step.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {step.type}
                        </div>
                        {step.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500 font-mono">
                          {JSON.stringify(step, null, 2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

