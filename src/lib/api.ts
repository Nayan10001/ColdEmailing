import axios from 'axios'
import type {
  Lead,
  Campaign,
  EmailTemplate,
  Email,
  CampaignStats,
  BulkUploadResponse,
  EmailGenerationRequest,
  EmailSendRequest,
  BulkEmailRequest,
  EmailResponse
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Leads API
export const leadsApi = {
  getAll: () => api.get<Lead[]>('/leads'),
  getById: (id: string) => api.get<Lead>(`/leads/${id}`),
  uploadCsv: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<BulkUploadResponse>('/leads/upload/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Campaigns API
export const campaignsApi = {
  getAll: () => api.get<Campaign[]>('/campaigns'),
  getById: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  create: (data: Omit<Campaign, 'id' | 'created_at'>) => 
    api.post<Campaign>('/campaigns', data),
  update: (id: string, data: Partial<Campaign>) => 
    api.patch<Campaign>(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  getEmails: (id: string, skip = 0, limit = 100) => 
    api.get<{ success: boolean; emails: Email[]; count: number }>(`/campaigns/${id}/emails?skip=${skip}&limit=${limit}`),
}

// Templates API
export const templatesApi = {
  getAll: () => api.get<{ success: boolean; templates: EmailTemplate[]; count: number }>('/emails/templates'),
  create: (data: Omit<EmailTemplate, 'id' | 'created_at'>) => 
    api.post<{ success: boolean; message: string; template_id: string }>('/emails/templates', data),
}

// Emails API
export const emailsApi = {
  generate: (data: EmailGenerationRequest) => 
    api.post<EmailResponse>('/emails/generate', data),
  send: (data: EmailSendRequest) => 
    api.post<EmailResponse>('/emails/send', data),
  generateAndSend: (data: EmailGenerationRequest) => 
    api.post<EmailResponse>('/emails/generate-and-send', data),
  bulkSend: (data: BulkEmailRequest) => 
    api.post<{
      success: boolean
      message: string
      results: Array<{
        lead_id: string
        success: boolean
        email_id?: string
        subject?: string
        error?: string
      }>
    }>('/emails/bulk-send'),
  getStatus: (id: string) => api.get<Email>(`/emails/status/${id}`),
  getLeadEmails: (leadId: string) => 
    api.get<{ success: boolean; emails: Email[]; count: number }>(`/emails/lead/${leadId}/emails`),
  testConnection: () => 
    api.post<{ success: boolean; message: string; labels_count: number }>('/emails/test-connection'),
}

// Analytics API (mock for now - you can implement these endpoints in your backend)
export const analyticsApi = {
  getCampaignStats: (campaignId: string): Promise<{ data: CampaignStats }> => {
    // Mock implementation - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            total_leads: Math.floor(Math.random() * 1000) + 100,
            emails_sent: Math.floor(Math.random() * 800) + 50,
            emails_opened: Math.floor(Math.random() * 400) + 20,
            emails_replied: Math.floor(Math.random() * 100) + 5,
            followups_sent: Math.floor(Math.random() * 200) + 10,
            conversion_rate: Math.random() * 15 + 2,
            open_rate: Math.random() * 40 + 20,
            reply_rate: Math.random() * 20 + 5,
          }
        })
      }, 1000)
    })
  },
  getOverallStats: (): Promise<{ data: CampaignStats }> => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            total_leads: Math.floor(Math.random() * 5000) + 1000,
            emails_sent: Math.floor(Math.random() * 4000) + 500,
            emails_opened: Math.floor(Math.random() * 2000) + 200,
            emails_replied: Math.floor(Math.random() * 500) + 50,
            followups_sent: Math.floor(Math.random() * 1000) + 100,
            conversion_rate: Math.random() * 12 + 3,
            open_rate: Math.random() * 35 + 25,
            reply_rate: Math.random() * 15 + 8,
          }
        })
      }, 1000)
    })
  },
}

export default api