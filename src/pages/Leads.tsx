import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { leadsApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { formatRelativeTime, downloadCsv } from '../lib/utils'
import type { Lead } from '../types'

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(),
  })

  const uploadMutation = useMutation({
    mutationFn: leadsApi.uploadCsv,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(response.data.message)
      if (response.data.failed_records > 0) {
        toast.error(`${response.data.failed_records} records failed to upload`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload leads')
    },
  })

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleExport = () => {
    if (!leads?.data || leads.data.length === 0) {
      toast.error('No leads to export')
      return
    }
    
    const exportData = leads.data.map(lead => ({
      name: lead.name,
      email: lead.email,
      company: lead.company || '',
      position: lead.position || '',
      status: lead.status,
      created_at: lead.created_at,
    }))
    
    downloadCsv(exportData, `leads-export-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Leads exported successfully')
  }

  const leadList = leads?.data || []
  const filteredLeads = statusFilter === 'all' 
    ? leadList 
    : leadList.filter(lead => lead.status === statusFilter)

  const statusCounts = leadList.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your lead database and upload new contacts.
          </p>
        </div>
        <div className="flex space-x-3">
          {leadList.length > 0 && (
            <button onClick={handleExport} className="btn-secondary">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Click to upload
                  </button>{' '}
                  or drag and drop your CSV file here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CSV should contain: name, email (required), company, position (optional)
                </p>
              </div>
            </div>
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-2 text-sm text-gray-600">Uploading leads...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      {leadList.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All ({leadList.length})</option>
              <option value="new">New ({statusCounts.new || 0})</option>
              <option value="contacted">Contacted ({statusCounts.contacted || 0})</option>
              <option value="replied">Replied ({statusCounts.replied || 0})</option>
              <option value="converted">Converted ({statusCounts.converted || 0})</option>
              <option value="unsubscribed">Unsubscribed ({statusCounts.unsubscribed || 0})</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredLeads.length} of {leadList.length} leads
          </div>
        </div>
      )}

      {/* Leads List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="card">
          <div className="card-body">
            {leadList.length === 0 ? (
              <EmptyState
                icon={<UserGroupIcon className="h-12 w-12" />}
                title="No leads yet"
                description="Upload a CSV file to start building your lead database."
                action={
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                  >
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Upload CSV
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={<UserGroupIcon className="h-12 w-12" />}
                title="No leads match your filter"
                description="Try adjusting your filter criteria to see more leads."
                action={
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="btn-secondary"
                  >
                    Clear Filter
                  </button>
                }
              />
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead: Lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}