import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Lead, ImportResponse } from '../../types';
import { leadApi } from '../../api/endpoints';

interface LeadsState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  importStatus: {
    loading: boolean;
    success: boolean;
    message: string;
    imported_count: number;
    failed_count: number;
    errors: string[];
  } | null;
}

const initialState: LeadsState = {
  leads: [],
  loading: false,
  error: null,
  importStatus: null,
};

export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async ({ status, limit }: { status?: string; limit?: number } = {}) => {
    const response = await leadApi.getLeads(status, limit);
    return response.leads;
  }
);

export const importLeads = createAsyncThunk(
  'leads/importLeads',
  async (file: File) => {
    const response = await leadApi.importLeads(file);
    return response;
  }
);

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ email, data }: { email: string; data: Partial<Lead> }) => {
    await leadApi.updateLead(email, data);
    return { email, data };
  }
);

export const deleteLead = createAsyncThunk(
  'leads/deleteLead',
  async (email: string) => {
    await leadApi.deleteLead(email);
    return email;
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearImportStatus: (state) => {
      state.importStatus = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch leads';
      })
      // Import leads
      .addCase(importLeads.pending, (state) => {
        state.importStatus = {
          loading: true,
          success: false,
          message: '',
          imported_count: 0,
          failed_count: 0,
          errors: [],
        };
      })
      .addCase(importLeads.fulfilled, (state, action) => {
        state.importStatus = {
          loading: false,
          ...action.payload,
        };
      })
      .addCase(importLeads.rejected, (state, action) => {
        state.importStatus = {
          loading: false,
          success: false,
          message: action.error.message || 'Failed to import leads',
          imported_count: 0,
          failed_count: 0,
          errors: [action.error.message || 'Unknown error'],
        };
      })
      // Update lead
      .addCase(updateLead.fulfilled, (state, action) => {
        const { email, data } = action.payload;
        const leadIndex = state.leads.findIndex(lead => lead.email === email);
        if (leadIndex !== -1) {
          state.leads[leadIndex] = { ...state.leads[leadIndex], ...data };
        }
      })
      // Delete lead
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter(lead => lead.email !== action.payload);
      });
  },
});

export const { clearImportStatus, clearError } = leadsSlice.actions;
export default leadsSlice.reducer;