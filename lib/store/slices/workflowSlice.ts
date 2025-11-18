import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Workflow, WorkflowStep } from '@/lib/schemas/workflow';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setWorkflows: (state, action: PayloadAction<Workflow[]>) => {
      state.workflows = action.payload;
    },
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    updateWorkflowStep: (state, action: PayloadAction<{ stepIndex: number; step: WorkflowStep }>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow.steps[action.payload.stepIndex] = action.payload.step;
      }
    },
    addWorkflowStep: (state, action: PayloadAction<WorkflowStep>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow.steps.push(action.payload);
      }
    },
    removeWorkflowStep: (state, action: PayloadAction<number>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow.steps.splice(action.payload, 1);
      }
    },
    reorderWorkflowSteps: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.currentWorkflow) {
        const { fromIndex, toIndex } = action.payload;
        const [removed] = state.currentWorkflow.steps.splice(fromIndex, 1);
        state.currentWorkflow.steps.splice(toIndex, 0, removed);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setWorkflows,
  setCurrentWorkflow,
  updateWorkflowStep,
  addWorkflowStep,
  removeWorkflowStep,
  reorderWorkflowSteps,
  setLoading,
  setError,
} = workflowSlice.actions;

export default workflowSlice.reducer;

