import React from 'react';
import { BarChart3, TrendingUp, Mail, Users, Clock, CheckCircle } from 'lucide-react';

interface CampaignMetricsProps {
  analytics?: {
    total_leads: number;
    leads_by_status: Record<string, number>;
    email_stats: {
      total_sent: number;
      successful_sends: number;
      failed_sends: number;
      response_rate: number;
      success_rate: number;
    };
  };
}

const CampaignMetrics: React.FC<CampaignMetricsProps> = ({ analytics }) => {
  const metrics = [
    {
      title: 'Total Emails Sent',
      value: analytics?.email_stats?.total_sent || 0,
      icon: Mail,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Success Rate',
      value: `${analytics?.email_stats?.success_rate || 0}%`,
      icon: CheckCircle,
      color: 'green',
      change: '+5%',
    },
    {
      title: 'Response Rate',
      value: `${analytics?.email_stats?.response_rate || 0}%`,
      icon: TrendingUp,
      color: 'purple',
      change: '+8%',
    },
    {
      title: 'Active Leads',
      value: analytics?.total_leads || 0,
      icon: Users,
      color: 'orange',
      change: '+15%',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-600',
      green: 'bg-green-500/10 text-green-600',
      purple: 'bg-purple-500/10 text-purple-600',
      orange: 'bg-orange-500/10 text-orange-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{metric.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Lead Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {analytics?.leads_by_status && Object.entries(analytics.leads_by_status).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-slate-800">{count}</div>
              <div className="text-sm text-slate-600 capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Campaign Performance</h3>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1 rounded border">7D</button>
            <button className="text-sm text-white bg-blue-600 px-3 py-1 rounded">30D</button>
            <button className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1 rounded border">90D</button>
          </div>
        </div>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Performance chart will be displayed here</p>
            <p className="text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignMetrics;