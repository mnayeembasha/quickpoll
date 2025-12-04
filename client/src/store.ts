
import { configureStore } from '@reduxjs/toolkit';
import pollReducer from '@/features/pollSlice';

export const store = configureStore({
  reducer: {
    poll: pollReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;