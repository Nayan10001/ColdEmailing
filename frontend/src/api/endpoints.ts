import { apiClient } from './client';
import { Lead, Analytics, ImportResponse, ApiResponse } from '../types';

export const leadApi = {
  getLeads: (status?: string, limit?: number) =>
    apiClient.get<{ success: boolean; count: number; leads: Lead[] }>('/leads', { status, limit }),

  importLeads: (file: File) =>
    apiClient.uploadFile<ImportResponse>('/import-leads', file),

  updateLead: (email: string, data: Partial<Lead>) =>
    apiClient.put<ApiResponse<Lead>>(`/leads/${email}`, data),

  deleteLead: (email: string) =>
    apiClient.delete<ApiResponse<void>>(`/leads/${email}`),
};

export const emailApi = {
  generateEmail: (data: {
    lead_email: string;
    sender_name?: string;
    sender_company?: string;
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      email_content?: { subject: string; body: string };
    }>('/generate-email', data),

  sendEmail: (data: {
    lead_email: string;
    sender_name?: string;
    sender_company?: string;
    custom_subject?: string;
    custom_body?: string;
  }) =>
    apiClient.post<{ success: boolean; message: string }>('/send-email', data),

  sendBulkEmails: (data: {
    status_filter?: string;
    max_leads?: number;
    sender_name?: string;
    sender_company?: string;
    delay_seconds?: number;
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      leads_count: number;
    }>('/send-bulk-emails', data),

  scheduleFollowups: (data: {
    lead_email: string;
    follow_up_date: string;
    message?: string;
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      follow_up_date: string;
      notes: string;
    }>('/schedule-followups', data),
};

export const analyticsApi = {
  getAnalytics: () =>
    apiClient.get<Analytics>('/analytics'),
};