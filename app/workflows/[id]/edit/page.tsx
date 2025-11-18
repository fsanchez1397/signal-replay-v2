'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { WorkflowStepSchema, type WorkflowStep, type Workflow } from '@/lib/schemas/workflow';
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { StepEditor } from '@/components/StepEditor';

export default function EditWorkflowPage() {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setWorkflow(data as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!workflow) return;

    setSaving(true);
    setError('');

    try {
      // Validate workflow steps
      workflow.steps.forEach((step, index) => {
        try {
          WorkflowStepSchema.parse(step);
        } catch (err: any) {
          throw new Error(`Step ${index + 1} validation error: ${err.message}`);
        }
      });

      const { error: updateError } = await supabase
        .from('workflows')
        .update({
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          tags: workflow.tags,
          variables: workflow.variables,
          settings: workflow.settings,
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
      } else {
        alert('Workflow saved successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    }

    setSaving(false);
  };

  const handleAddStep = () => {
    if (!workflow) return;

    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type: 'goto',
      url: '',
      timeout: 5000,
      screenshot: false,
      waitUntil: 'load',
    };

    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep],
    });
  };

  const handleUpdateStep = (index: number, step: WorkflowStep) => {
    if (!workflow) return;

    const newSteps = [...workflow.steps];
    newSteps[index] = step;

    setWorkflow({
      ...workflow,
      steps: newSteps,
    });
  };

  const handleDeleteStep = (index: number) => {
    if (!workflow) return;

    const newSteps = workflow.steps.filter((_, i) => i !== index);

    setWorkflow({
      ...workflow,
      steps: newSteps,
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!workflow) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflow.steps.length) return;

    const newSteps = [...workflow.steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    setWorkflow({
      ...workflow,
      steps: newSteps,
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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-sm text-gray-600">{workflow.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Workflow Settings */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={workflow.settings.supervisedMode}
                onChange={(e) =>
                  setWorkflow({
                    ...workflow,
                    settings: { ...workflow.settings, supervisedMode: e.target.checked },
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Supervised Mode</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={workflow.settings.pauseOnError}
                onChange={(e) =>
                  setWorkflow({
                    ...workflow,
                    settings: { ...workflow.settings, pauseOnError: e.target.checked },
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Pause on Error</span>
            </label>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Steps ({workflow.steps.length})
            </h2>
            <button
              onClick={handleAddStep}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5" />
              Add Step
            </button>
          </div>

          {workflow.steps.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No steps yet. Add your first step to get started!
            </div>
          ) : (
            workflow.steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Step {index + 1}: {step.type}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === workflow.steps.length - 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(index)}
                      className="p-1 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <StepEditor
                  step={step}
                  onChange={(updatedStep) => handleUpdateStep(index, updatedStep)}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

