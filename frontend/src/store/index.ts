import { configureStore } from '@reduxjs/toolkit';
import leadsSlice from './slices/leadsSlice';
import analyticsSlice from './slices/analyticsSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    leads: leadsSlice,
    analytics: analyticsSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;