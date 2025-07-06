import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { emailApi } from '../../api/endpoints';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  Play,
  Save,
  Calendar,
  Users,
  Mail,
  Settings,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface CampaignCreatorProps {
  leads: any[];
  onCampaignCreated?: () => void;
}

const CampaignCreator: React.FC<CampaignCreatorProps> = ({ leads, onCampaignCreated }) => {
  const dispatch = useAppDispatch();
  const [campaignData, setCampaignData] = useState({
    name: '',
    template: 'cold_outreach',
    scheduleType: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
    statusFilter: 'new',
    maxLeads: '',
    senderName: 'Your Name',
    senderCompany: 'Your Company',
    delaySeconds: 5,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const filteredLeads = leads.filter(lead => 
    campaignData.statusFilter === 'all' || lead.status === campaignData.statusFilter
  );

  const handleInputChange = (field: string, value: string | number) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const handleLeadSelection = (email: string) => {
    setSelectedLeads(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.email));
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignData.name.trim()) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please enter a campaign name',
      }));
      return;
    }

    if (selectedLeads.length === 0 && !campaignData.statusFilter) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select leads or choose a status filter',
      }));
      return;
    }

    setIsLoading(true);
    try {
      if (selectedLeads.length > 0) {
        // Send to selected leads individually
        for (const email of selectedLeads) {
          await emailApi.sendEmail({
            lead_email: email,
            sender_name: campaignData.senderName,
            sender_company: campaignData.senderCompany,
          });
        }
        dispatch(addNotification({
          type: 'success',
          message: `Campaign "${campaignData.name}" started for ${selectedLeads.length} selected leads!`,
        }));
      } else {
        // Send bulk emails by status
        const response = await emailApi.sendBulkEmails({
          status_filter: campaignData.statusFilter,
          max_leads: campaignData.maxLeads ? parseInt(campaignData.maxLeads) : undefined,
          sender_name: campaignData.senderName,
          sender_company: campaignData.senderCompany,
          delay_seconds: campaignData.delaySeconds,
        });
        dispatch(addNotification({
          type: 'success',
          message: response.message,
        }));
      }
      
      // Reset form
      setCampaignData({
        name: '',
        template: 'cold_outreach',
        scheduleType: 'immediate',
        scheduledDate: '',
        scheduledTime: '',
        statusFilter: 'new',
        maxLeads: '',
        senderName: campaignData.senderName,
        senderCompany: campaignData.senderCompany,
        delaySeconds: 5,
      });
      setSelectedLeads([]);
      
      if (onCampaignCreated) {
        onCampaignCreated();
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to start campaign',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraft = () => {
    dispatch(addNotification({
      type: 'success',
      message: `Campaign "${campaignData.name}" saved as draft!`,
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Create New Campaign</h2>
          <p className="text-slate-600">Set up and launch your email campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Campaign Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter campaign name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Template *
            </label>
            <select
              value={campaignData.template}
              onChange={(e) => handleInputChange('template', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cold_outreach">Cold Outreach</option>
              <option value="follow_up">Follow Up</option>
              <option value="meeting_request">Meeting Request</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sender Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={campaignData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                placeholder="Your Name"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={campaignData.senderCompany}
                onChange={(e) => handleInputChange('senderCompany', e.target.value)}
                placeholder="Your Company"
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Schedule Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value="immediate"
                  checked={campaignData.scheduleType === 'immediate'}
                  onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-slate-700">Send Immediately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scheduleType"
                  value="later"
                  checked={campaignData.scheduleType === 'later'}
                  onChange={(e) => handleInputChange('scheduleType', e.target.value)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-slate-700">Schedule for Later</span>
              </label>
            </div>
          </div>

          {campaignData.scheduleType === 'later' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={campaignData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={campaignData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Lead Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Leads
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <select
                  value={campaignData.statusFilter}
                  onChange={(e) => handleInputChange('statusFilter', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="new">New Leads</option>
                  <option value="contacted">Contacted</option>
                  <option value="responded">Responded</option>
                  <option value="all">All Leads</option>
                </select>
                <input
                  type="number"
                  value={campaignData.maxLeads}
                  onChange={(e) => handleInputChange('maxLeads', e.target.value)}
                  placeholder="Max leads"
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Available Leads ({filteredLeads.length})
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No leads available for the selected status
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredLeads.slice(0, 10).map((lead) => (
                    <label key={lead.email} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.email)}
                        onChange={() => handleLeadSelection(lead.email)}
                        className="mr-3 text-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
                        <p className="text-xs text-slate-600 truncate">{lead.email}</p>
                      </div>
                    </label>
                  ))}
                  {filteredLeads.length > 10 && (
                    <p className="text-xs text-slate-500 text-center p-2">
                      And {filteredLeads.length - 10} more leads...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Delay (seconds)
            </label>
            <input
              type="number"
              value={campaignData.delaySeconds}
              onChange={(e) => handleInputChange('delaySeconds', parseInt(e.target.value))}
              min="1"
              max="300"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Delay between emails to respect rate limits
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Compliance Notice */}
      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          <div>
            <h4 className="text-orange-800 font-medium">Gmail Compliance Notice</h4>
            <p className="text-orange-700 text-sm mt-1">
              This system respects Gmail's sending limits (50 emails/day) and includes delays between sends. 
              Make sure your Gmail account has App Passwords enabled for authentication.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>
            {selectedLeads.length > 0 
              ? `${selectedLeads.length} leads selected`
              : `${filteredLeads.length} leads will be targeted`
            }
          </span>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSaveAsDraft}
            className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>
          <button
            onClick={handleSendCampaign}
            disabled={isLoading || (!campaignData.name.trim())}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Starting...' : 'Start Campaign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCreator;