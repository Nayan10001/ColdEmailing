import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { EmailTemplate } from '../types'

interface PreviewTemplateModalProps {
  template: EmailTemplate
  isOpen: boolean
  onClose: () => void
}

export default function PreviewTemplateModal({ template, isOpen, onClose }: PreviewTemplateModalProps) {
  // Sample data for preview
  const sampleData = {
    name: 'John Smith',
    company: 'Acme Corp',
    position: 'Marketing Director',
  }

  const renderTemplate = (text: string) => {
    return text
      .replace(/{name}/g, sampleData.name)
      .replace(/{company}/g, sampleData.company)
      .replace(/{position}/g, sampleData.position)
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
                    Template Preview: {template.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Template Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Template Type:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.type === 'cold_email' 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'bg-success-100 text-success-800'
                      }`}>
                        {template.type === 'cold_email' ? 'Cold Email' : 'Follow-up'}
                      </span>
                    </div>
                  </div>

                  {/* Email Preview */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Email Preview</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Preview with sample data: {sampleData.name} from {sampleData.company}
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Subject
                        </label>
                        <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                          {renderTemplate(template.subject_template)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Body
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded whitespace-pre-wrap">
                          {renderTemplate(template.body_template)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw Template */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Raw Template</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Template with variables (before personalization)
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Subject Template
                        </label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded font-mono">
                          {template.subject_template}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Body Template
                        </label>
                        <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded font-mono whitespace-pre-wrap">
                          {template.body_template}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={onClose}
                    className="btn-primary"
                  >
                    Close Preview
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}