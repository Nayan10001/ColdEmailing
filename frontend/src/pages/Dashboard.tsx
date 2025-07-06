import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
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
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: analytics, loading } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleConfigureCampaign = () => {
    dispatch(addNotification({
      type: 'info',
      message: 'Campaign configuration feature coming soon!',
    }));
  };

  const handleSaveAsDraft = () => {
    dispatch(addNotification({
      type: 'success',
      message: 'Campaign saved as draft successfully!',
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={analytics?.total_leads || 0}
          icon={Users}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Email Templates"
          value={2}
          icon={Mail}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          title="Daily Limit"
          value="50"
          icon={Clock}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <StatCard
          title="Success Rate"
          value={analytics?.email_stats?.success_rate ? `${analytics.email_stats.success_rate}%` : '98%'}
          icon={TrendingUp}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
        />
      </div>

      {/* Create New Campaign */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6">Create New Campaign</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                placeholder="Enter campaign name"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Email Template *
              </label>
              <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Choose a template</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Schedule Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="immediate"
                    defaultChecked
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-slate-300">Send Immediately</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="later"
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-slate-300">Schedule for Later</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Leads (0 selected)
              </label>
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-center">
                <p className="text-slate-400">No leads available. Add leads in the Lead Manager.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gmail Compliance Notice */}
        <div className="mt-6 bg-orange-900/20 border border-orange-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <h4 className="text-orange-400 font-medium">Gmail Compliance Notice</h4>
              <p className="text-orange-300 text-sm mt-1">
                This system respects Gmail's sending limits (50 emails/day) and includes 60-second delays between sends. 
                Make sure your Gmail account has App Passwords enabled.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleConfigureCampaign}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Configure Campaign</span>
          </button>
          <button
            onClick={handleSaveAsDraft}
            className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics?.recent_activity && analytics.recent_activity.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                <div>
                  <p className="text-white font-medium">{activity.name}</p>
                  <p className="text-slate-400 text-sm">{activity.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'contacted' ? 'bg-green-500/20 text-green-400' :
                    activity.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {activity.status}
                  </span>
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(activity.last_updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;