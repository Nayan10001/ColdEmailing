import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  ArrowLeftIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  EnvelopeIcon,
  UserGroupIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { campaignsApi, leadsApi, emailsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatRelativeTime, formatPercentage } from '../lib/utils'
import type { Campaign, Lead } from '../types'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Campaign>>({})
  const queryClient = useQueryClient()

  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getById(id!),
    enabled: !!id,
  })

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  })

  const { data: emails, isLoading: emailsLoading } = useQuery({
    queryKey: ['campaign-emails', id],
    queryFn: () => campaignsApi.getEmails(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      campaignsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign updated successfully')
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update campaign')
    },
  })

  const bulkSendMutation = useMutation({
    mutationFn: emailsApi.bulkSend,
    onSuccess: (response) => {
      const successCount = response.data.results.filter(r => r.success).length
      toast.success(`Successfully sent ${successCount} emails`)
      queryClient.invalidateQueries({ queryKey: ['campaign-emails', id] })
      setSelectedLeads([])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send emails')
    },
  })

  const handleEdit = () => {
    setEditData({
      name: campaign?.data.name,
      objective: campaign?.data.objective,
      tone: campaign?.data.tone,
      status: campaign?.data.status,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!id) return
    updateMutation.mutate({ id, data: editData })
  }

  const handleBulkSend = () => {
    if (!id || selectedLeads.length === 0) return
    
    if (window.confirm(`Send emails to ${selectedLeads.length} selected leads?`)) {
      bulkSendMutation.mutate({
        campaign_id: id,
        lead_ids: selectedLeads,
      })
    }
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const toggleSelectAll = () => {
    const availableLeads = leads?.data || []
    if (selectedLeads.length === availableLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(availableLeads.map(lead => lead.id))
    }
  }

  if (campaignLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!campaign?.data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campaign not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The campaign you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  const campaignData = campaign.data
  const emailList = emails?.data?.emails || []
  const leadList = leads?.data || []

  // Calculate stats
  const totalEmails = emailList.length
  const sentEmails = emailList.filter(e => e.status === 'sent').length
  const openedEmails = emailList.filter(e => e.status === 'opened').length
  const repliedEmails = emailList.filter(e => e.status === 'replied').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/campaigns"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{campaignData.name}</h1>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Created {formatRelativeTime(campaignData.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <StatusBadge status={campaignData.status} />
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={handleEdit} className="btn-secondary">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Campaign Details</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objective
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.objective || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, objective: e.target.value }))}
                    rows={3}
                    className="input"
                  />
                ) : (
                  <p className="text-sm text-gray-600">{campaignData.objective}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tone
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.tone || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, tone: e.target.value }))}
                      className="input"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="witty">Witty</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 capitalize">{campaignData.tone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.status || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <StatusBadge status={campaignData.status} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Performance</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Emails Sent</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{sentEmails}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <EyeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Opened</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {openedEmails} ({sentEmails > 0 ? formatPercentage((openedEmails / sentEmails) * 100) : '0%'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Replied</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {repliedEmails} ({sentEmails > 0 ? formatPercentage((repliedEmails / sentEmails) * 100) : '0%'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Selection */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Send Emails to Leads</h3>
            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkSend}
                disabled={bulkSendMutation.isPending}
                className="btn-primary"
              >
                {bulkSendMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Send to {selectedLeads.length} leads
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {leadsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : leadList.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leadList.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select all ({leadList.length} leads)
                  </span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedLeads.length} selected
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {leadList.map((lead: Lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <label className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                        {lead.company && (
                          <p className="text-xs text-gray-400">{lead.company}</p>
                        )}
                      </div>
                    </label>
                    <StatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No leads available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload leads to start sending emails for this campaign.
              </p>
              <div className="mt-6">
                <Link to="/leads" className="btn-primary">
                  Upload Leads
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}