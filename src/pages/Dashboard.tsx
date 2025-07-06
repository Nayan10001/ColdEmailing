import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  MegaphoneIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ChartBarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { campaignsApi, leadsApi, analyticsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatRelativeTime, formatPercentage } from '../lib/utils'

export default function Dashboard() {
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getAll(),
  })

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['overall-stats'],
    queryFn: () => analyticsApi.getOverallStats(),
  })

  const recentCampaigns = campaigns?.data?.slice(0, 5) || []
  const recentLeads = leads?.data?.slice(0, 5) || []
  const overallStats = stats?.data

  const statCards = [
    {
      name: 'Total Campaigns',
      value: campaigns?.data?.length || 0,
      icon: MegaphoneIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Total Leads',
      value: overallStats?.total_leads || 0,
      icon: UserGroupIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Emails Sent',
      value: overallStats?.emails_sent || 0,
      icon: EnvelopeIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      name: 'Reply Rate',
      value: overallStats ? formatPercentage(overallStats.reply_rate) : '0%',
      icon: ChartBarIcon,
      color: 'text-error-600',
      bgColor: 'bg-error-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/leads" className="btn-secondary">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            Upload Leads
          </Link>
          <Link to="/campaigns" className="btn-primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsLoading ? <LoadingSpinner size="sm" /> : stat.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Campaigns */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Campaigns</h3>
              <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {campaignsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentCampaigns.length > 0 ? (
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{campaign.objective}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created {formatRelativeTime(campaign.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={campaign.status} />
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaigns</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
                <div className="mt-6">
                  <Link to="/campaigns" className="btn-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Campaign
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
              <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {leadsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{lead.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{lead.email}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-400 mt-1">{lead.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={lead.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No leads</h3>
                <p className="mt-1 text-sm text-gray-500">Upload a CSV file to get started.</p>
                <div className="mt-6">
                  <Link to="/leads" className="btn-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Leads
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}