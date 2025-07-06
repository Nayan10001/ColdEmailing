import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { fetchLeads } from '../store/slices/leadsSlice';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import CampaignCreator from '../components/campaigns/CampaignCreator';
import EmailPreview from '../components/email/EmailPreview';
import CampaignMetrics from '../components/analytics/CampaignMetrics';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Mail,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause,
  Calendar,
} from 'lucide-react';

const Campaigns: React.FC = () => {
  const dispatch = useAppDispatch();
  const { leads, loading: leadsLoading } = useAppSelector((state) => state.leads);
  const { data: analytics, loading: analyticsLoading } = useAppSelector((state) => state.analytics);
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'metrics'>('create');
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchLeads());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleCampaignCreated = () => {
    dispatch(fetchAnalytics());
    dispatch(fetchLeads());
  };

  const tabs = [
    { id: 'create', label: 'Create Campaign', icon: Mail },
    { id: 'preview', label: 'Email Preview', icon: Settings },
    { id: 'metrics', label: 'Analytics', icon: BarChart3 },
  ];

  if (leadsLoading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Email Campaigns</h1>
          <p className="text-slate-600">Create, manage, and track your email campaigns</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{leads.length} leads available</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Sent</p>
              <p className="text-xl font-bold text-slate-800">
                {analytics?.email_stats?.total_sent || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Success Rate</p>
              <p className="text-xl font-bold text-slate-800">
                {analytics?.email_stats?.success_rate || 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Response Rate</p>
              <p className="text-xl font-bold text-slate-800">
                {analytics?.email_stats?.response_rate || 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Campaigns</p>
              <p className="text-xl font-bold text-slate-800">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'create' && (
            <CampaignCreator 
              leads={leads} 
              onCampaignCreated={handleCampaignCreated}
            />
          )}

          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Select Lead for Preview</h3>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                  {leads.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No leads available</p>
                      <p className="text-sm">Import leads to get started</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {leads.slice(0, 20).map((lead) => (
                        <button
                          key={lead.email}
                          onClick={() => setSelectedLead(lead)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedLead?.email === lead.email
                              ? 'bg-blue-100 border border-blue-200'
                              : 'hover:bg-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{lead.name}</p>
                              <p className="text-sm text-slate-600">{lead.email}</p>
                              <p className="text-xs text-slate-500">{lead.company}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-green-100 text-green-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Preview */}
              <EmailPreview 
                lead={selectedLead}
                senderName="Your Name"
                senderCompany="Your Company"
                onSend={() => {
                  dispatch(fetchLeads());
                  dispatch(fetchAnalytics());
                }}
              />
            </div>
          )}

          {activeTab === 'metrics' && (
            <CampaignMetrics analytics={analytics} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Campaigns;