export interface Lead {
  id: string
  name: string
  email: string
  company?: string
  position?: string
  linkedin_url?: string
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'unsubscribed'
  custom_data?: Record<string, any>
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  objective: string
  tone: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject_template: string
  body_template: string
  type: 'cold_email' | 'followup'
  created_at: string
}

export interface Email {
  id: string
  lead_id: string
  campaign_id: string
  subject: string
  body: string
  status: 'generated' | 'sent' | 'delivered' | 'opened' | 'replied' | 'failed'
  email_type: 'cold_email' | 'followup'
  sent_at?: string
  opened_at?: string
  replied_at?: string
  error_message?: string
  gmail_message_id?: string
  gmail_thread_id?: string
  created_at: string
}

export interface CampaignStats {
  total_leads: number
  emails_sent: number
  emails_opened: number
  emails_replied: number
  followups_sent: number
  conversion_rate: number
  open_rate: number
  reply_rate: number
}

export interface BulkUploadResponse {
  message: string
  successful_uploads: number
  failed_records: number
  errors: Array<{
    row: number
    details: string
  }>
}

export interface EmailGenerationRequest {
  lead_id: string
  campaign_id: string
  lead_name: string
  lead_email: string
  lead_company?: string
  lead_position?: string
  lead_linkedin?: string
  campaign_type: 'cold_email' | 'followup'
  custom_context?: Record<string, any>
  template_id?: string
}

export interface EmailSendRequest {
  email_log_id: number
  lead_id: string
  campaign_id: string
  recipient_email: string
  subject: string
  body: string
  body_type?: 'plain' | 'html'
  schedule_followup?: boolean
  followup_days?: number
}

export interface BulkEmailRequest {
  campaign_id: string
  lead_ids: string[]
  custom_context?: Record<string, any>
}

export interface EmailResponse {
  success: boolean
  message: string
  email_id?: string | number
  subject?: string
  body?: string
  sent_at?: string
}