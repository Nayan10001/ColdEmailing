export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  industry: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'closed' | 'follow_up_scheduled' | 'failed';
  created_at: string;
  last_updated?: string;
  notes?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export interface Campaign {
  id: number;
  name: string;
  template_id: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  created_at: string;
  scheduled_at?: string;
  target_leads: number;
  sent_count: number;
}

export interface Analytics {
  total_leads: number;
  leads_by_status: Record<string, number>;
  recent_activity: Array<{
    email: string;
    name: string;
    status: string;
    last_updated: string;
    notes: string;
  }>;
  email_stats: {
    total_sent: number;
    successful_sends: number;
    failed_sends: number;
    response_rate: number;
    success_rate: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  imported_count: number;
  failed_count: number;
  errors: string[];
}