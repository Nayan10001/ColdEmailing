import { useQuery } from '@tanstack/react-query'
import {
  ChartBarIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline'
import { campaignsApi, analyticsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatPercentage, calculatePercentage } from '../lib/utils'

export default function Analytics() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getAll(),
  })

  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ['overall-stats'],
    queryFn: () => analyticsApi.getOverallStats(),
  })

  const campaignList = campaigns?.data || []
  const stats = overallStats?.data

  const metricCards = [
    {
      name: 'Total Emails Sent',
      value: stats?.emails_sent || 0,
      change: '+12%',
      changeType: 'increase' as const,
      icon: EnvelopeIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Open Rate',
      value: stats ? formatPercentage(stats.open_rate) : '0%',
      change: '+2.1%',
      changeType: 'increase' as const,
      icon: EyeIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Reply Rate',
      value: stats ? formatPercentage(stats.reply_rate) : '0%',
      change: '-0.5%',
      changeType: 'decrease' as const,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      name: 'Conversion Rate',
      value: stats ? formatPercentage(stats.conversion_rate) : '0%',
      change: '+1.2%',
      changeType: 'increase' as const,
      icon: TrendingUpIcon,
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track the performance of your email campaigns and optimize your outreach.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <div key={metric.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">
                      {statsLoading ? <LoadingSpinner size="sm" /> : metric.value}
                    </p>
                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                      metric.changeType === 'increase' ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {metric.changeType === 'increase' ? (
                        <TrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {metric.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          <div className="card-body">
            {campaignsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : campaignList.length > 0 ? (
              <div className="space-y-4">
                {campaignList.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{campaign.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 100) + 10} sent
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage(Math.random() * 30 + 10)} open rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaign data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create campaigns and send emails to see performance metrics.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[
                {
                  action: 'Email sent',
                  details: 'Cold email to John Smith at Acme Corp',
                  time: '2 minutes ago',
                  icon: EnvelopeIcon,
                  iconColor: 'text-primary-600',
                  iconBg: 'bg-primary-100',
                },
                {
                  action: 'Email opened',
                  details: 'Sarah Johnson opened your email',
                  time: '15 minutes ago',
                  icon: EyeIcon,
                  iconColor: 'text-success-600',
                  iconBg: 'bg-success-100',
                },
                {
                  action: 'Reply received',
                  details: 'Mike Davis replied to your follow-up',
                  time: '1 hour ago',
                  icon: ChatBubbleLeftRightIcon,
                  iconColor: 'text-warning-600',
                  iconBg: 'bg-warning-100',
                },
                {
                  action: 'Campaign created',
                  details: 'New campaign "Q1 Outreach" created',
                  time: '2 hours ago',
                  icon: UserGroupIcon,
                  iconColor: 'text-gray-600',
                  iconBg: 'bg-gray-100',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${activity.iconBg}`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Detailed Statistics</h3>
        </div>
        <div className="card-body">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.total_leads}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.emails_sent}</p>
                <p className="text-sm text-gray-500">Emails Sent</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.emails_opened}</p>
                <p className="text-sm text-gray-500">Emails Opened</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.emails_replied}</p>
                <p className="text-sm text-gray-500">Replies Received</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start sending emails to see detailed analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}