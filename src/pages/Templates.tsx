import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  DocumentTextIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { templatesApi } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import CreateTemplateModal from '../components/CreateTemplateModal'
import PreviewTemplateModal from '../components/PreviewTemplateModal'
import { formatRelativeTime } from '../lib/utils'
import type { EmailTemplate } from '../types'

export default function Templates() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll(),
  })

  const templateList = templates?.data?.templates || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage email templates for your campaigns.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : templateList.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12" />}
              title="No templates yet"
              description="Create your first email template to streamline your campaign creation process."
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Template
                </button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templateList.map((template: EmailTemplate) => (
            <div key={template.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.type === 'cold_email' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-success-100 text-success-800'
                    }`}>
                      {template.type === 'cold_email' ? 'Cold Email' : 'Follow-up'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</p>
                    <p className="text-sm text-gray-900 truncate">{template.subject_template}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Body Preview</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{template.body_template}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(template.created_at)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Preview template"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit template"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Preview Template Modal */}
      {previewTemplate && (
        <PreviewTemplateModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}