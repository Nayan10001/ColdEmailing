import React from 'react';
import { Mail, Plus, Edit, Trash2, Eye } from 'lucide-react';

const EmailTemplates: React.FC = () => {
  const templates = [
    {
      id: 1,
      name: 'Cold Outreach',
      subject: 'Quick question about {company}',
      type: 'Cold Email',
      lastModified: '2024-01-15',
      usage: 45,
    },
    {
      id: 2,
      name: 'Follow Up',
      subject: 'Following up on {original_subject}',
      type: 'Follow Up',
      lastModified: '2024-01-10',
      usage: 23,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Email Templates</h1>
          <p className="text-slate-600">Create and manage your email templates</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{template.name}</h3>
                  <p className="text-sm text-slate-600">{template.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Subject Line:</p>
                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                  {template.subject}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Used {template.usage} times</span>
                <span className="text-slate-600">Modified {template.lastModified}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Template Card */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
          <Plus className="w-8 h-8 text-slate-400 mb-2" />
          <h3 className="font-medium text-slate-600 mb-1">Create New Template</h3>
          <p className="text-sm text-slate-500">Start with a blank template or use a preset</p>
        </div>
      </div>

      {/* Template Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Template Preview</h3>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="border-b border-slate-200 pb-3 mb-3">
            <p className="text-sm text-slate-600">Subject:</p>
            <p className="font-medium">Quick question about {'{company}'}</p>
          </div>
          <div className="prose prose-sm max-w-none">
            <p>Hi {'{name}'},</p>
            <p>I hope this email finds you well. I came across {'{company}'} and was impressed by your work in {'{industry}'}.</p>
            <p>I wanted to reach out because [reason for contact].</p>
            <p>[Value proposition]</p>
            <p>Would you be interested in a brief 15-minute call to discuss how we might be able to help {'{company}'} [specific benefit]?</p>
            <p>Best regards,<br />{'{sender_name}'}<br />{'{sender_company}'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;