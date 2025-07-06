import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import { fetchLeads } from '../store/slices/leadsSlice';
import { addNotification } from '../store/slices/uiSlice';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Users,
  Mail,
  Clock,
  TrendingUp,
  Play,
  Save,
  AlertTriangle,
  Send,
  Activity,
  BarChart3,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: analytics, loading: analyticsLoading } = useAppSelector((state) => state.analytics);
  const { leads, loading: leadsLoading } = useAppSelector((state) => state.leads);

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchLeads());
  }, [dispatch]);

  const handleCreateCampaign = () => {
    navigate('/campaigns');
  };

  const handleViewLeads = () => {
    navigate('/leads');
  };

  const handleViewLogs = () => {
    navigate('/logs');
  };

  if (analyticsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to Cold Email Pro</h1>
            <p className="text-blue-100">
              AI-powered email automation system for lead generation and outreach
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">System Status</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">Online & Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={analytics?.total_leads || leads.length || 0}
          icon={Users}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Emails Sent"
          value={analytics?.email_stats?.total_sent || 0}
          icon={Mail}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          title="Success Rate"
          value={analytics?.email_stats?.success_rate ? `${analytics.email_stats.success_rate}%` : '0%'}
          icon={TrendingUp}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          title="Response Rate"
          value={analytics?.email_stats?.response_rate ? `${analytics.email_stats.response_rate}%` : '0%'}
          icon={BarChart3}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Campaign */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Quick Campaign</h3>
              <p className="text-slate-600">Start a new email campaign</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Ready to Send</span>
                <span className="text-lg font-bold text-blue-600">
                  {leads.filter(lead => lead.status === 'new').length}
                </span>
              </div>
              <div className="text-xs text-slate-500">New leads available for outreach</div>
            </div>
            
            <button
              onClick={handleCreateCampaign}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* Lead Management */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Lead Management</h3>
              <p className="text-slate-600">Manage your lead database</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-800">{leads.length}</div>
                <div className="text-xs text-slate-500">Total Leads</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {leads.filter(lead => lead.status === 'contacted').length}
                </div>
                <div className="text-xs text-slate-500">Contacted</div>
              </div>
            </div>
            
            <button
              onClick={handleViewLeads}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity & Gmail Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            <button
              onClick={handleViewLogs}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          
          {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{activity.name}</p>
                    <p className="text-xs text-slate-600 truncate">{activity.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'contacted' ? 'bg-green-100 text-green-800' :
                    activity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2" />
              <p>No recent activity</p>
              <p className="text-sm">Start a campaign to see activity here</p>
            </div>
          )}
        </div>

        {/* Gmail Compliance Notice */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Gmail Compliance</h3>
              <p className="text-slate-600">Important sending guidelines</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-slate-700">50 emails per day limit</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-slate-700">5-second delay between emails</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-orange-500" />
              <span className="text-slate-700">App passwords required</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              This system automatically respects Gmail's sending limits and includes proper delays 
              to maintain good sender reputation.
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-green-800">Backend API</p>
              <p className="text-xs text-green-600">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-green-800">AI Generator</p>
              <p className="text-xs text-green-600">Ready</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-green-800">Email Service</p>
              <p className="text-xs text-green-600">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;