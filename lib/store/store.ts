import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './slices/workflowSlice';
import replayReducer from './slices/replaySlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    workflow: workflowReducer,
    replay: replayReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

