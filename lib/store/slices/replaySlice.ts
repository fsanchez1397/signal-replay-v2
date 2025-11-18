import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WorkflowRun } from '@/lib/schemas/workflow';

interface ReplayState {
  currentRun: WorkflowRun | null;
  logs: any[];
  isSupervised: boolean;
  awaitingApproval: boolean;
}

const initialState: ReplayState = {
  currentRun: null,
  logs: [],
  isSupervised: true,
  awaitingApproval: false,
};

const replaySlice = createSlice({
  name: 'replay',
  initialState,
  reducers: {
    setCurrentRun: (state, action: PayloadAction<WorkflowRun | null>) => {
      state.currentRun = action.payload;
    },
    updateRunStatus: (state, action: PayloadAction<WorkflowRun['status']>) => {
      if (state.currentRun) {
        state.currentRun.status = action.payload;
      }
    },
    updateCurrentStepIndex: (state, action: PayloadAction<number>) => {
      if (state.currentRun) {
        state.currentRun.currentStepIndex = action.payload;
      }
    },
    addLog: (state, action: PayloadAction<any>) => {
      state.logs.push(action.payload);
    },
    setLogs: (state, action: PayloadAction<any[]>) => {
      state.logs = action.payload;
    },
    setSupervised: (state, action: PayloadAction<boolean>) => {
      state.isSupervised = action.payload;
    },
    setAwaitingApproval: (state, action: PayloadAction<boolean>) => {
      state.awaitingApproval = action.payload;
    },
    clearReplayState: (state) => {
      state.currentRun = null;
      state.logs = [];
      state.awaitingApproval = false;
    },
  },
});

export const {
  setCurrentRun,
  updateRunStatus,
  updateCurrentStepIndex,
  addLog,
  setLogs,
  setSupervised,
  setAwaitingApproval,
  clearReplayState,
} = replaySlice.actions;

export default replaySlice.reducer;

