import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { templatesApi } from '../lib/api'
import LoadingSpinner from './LoadingSpinner'

interface CreateTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTemplateModal({ isOpen, onClose }: CreateTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject_template: '',
    body_template: '',
    type: 'cold_email' as 'cold_email' | 'followup',
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template created successfully')
      onClose()
      setFormData({
        name: '',
        subject_template: '',
        body_template: '',
        type: 'cold_email',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create template')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.subject_template.trim() || !formData.body_template.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create Email Template
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input"
                        placeholder="Enter template name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Template Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="cold_email">Cold Email</option>
                        <option value="followup">Follow-up</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject_template" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Template *
                    </label>
                    <input
                      type="text"
                      id="subject_template"
                      name="subject_template"
                      value={formData.subject_template}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Quick question about {company}"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variables like {'{company}'}, {'{name}'}, {'{position}'} for personalization
                    </p>
                  </div>

                  <div>
                    <label htmlFor="body_template" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Body Template *
                    </label>
                    <textarea
                      id="body_template"
                      name="body_template"
                      value={formData.body_template}
                      onChange={handleChange}
                      rows={8}
                      className="input"
                      placeholder={`Hi {name},

I noticed that {company} is doing great work in the industry. I'd love to share how we've helped similar companies...

Best regards,
[Your name]`}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variables for personalization. Keep it concise and focused on value.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create Template'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}