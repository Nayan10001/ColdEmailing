import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { emailApi } from '../../api/endpoints';
import LoadingSpinner from '../common/LoadingSpinner';
import { Eye, Send, Edit, Copy, RefreshCw } from 'lucide-react';

interface EmailPreviewProps {
  lead?: {
    name: string;
    email: string;
    company: string;
    industry: string;
  };
  senderName?: string;
  senderCompany?: string;
  onSend?: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  lead,
  senderName = 'Your Name',
  senderCompany = 'Your Company',
  onSend,
}) => {
  const dispatch = useAppDispatch();
  const [emailContent, setEmailContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState({ subject: '', body: '' });

  const generateEmail = async () => {
    if (!lead) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select a lead first',
      }));
      return;
    }

    setIsGenerating(true);
    try {
      const response = await emailApi.generateEmail({
        lead_email: lead.email,
        sender_name: senderName,
        sender_company: senderCompany,
      });

      if (response.success && response.email_content) {
        setEmailContent(response.email_content);
        setEditedContent(response.email_content);
        dispatch(addNotification({
          type: 'success',
          message: 'Email content generated successfully!',
        }));
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to generate email',
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!lead || !emailContent) return;

    setIsSending(true);
    try {
      const response = await emailApi.sendEmail({
        lead_email: lead.email,
        sender_name: senderName,
        sender_company: senderCompany,
        custom_subject: isEditing ? editedContent.subject : undefined,
        custom_body: isEditing ? editedContent.body : undefined,
      });

      dispatch(addNotification({
        type: 'success',
        message: response.message,
      }));

      if (onSend) {
        onSend();
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to send email',
      }));
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    const content = isEditing ? editedContent : emailContent;
    if (content) {
      const fullEmail = `Subject: ${content.subject}\n\n${content.body}`;
      navigator.clipboard.writeText(fullEmail);
      dispatch(addNotification({
        type: 'success',
        message: 'Email content copied to clipboard!',
      }));
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      setEmailContent(editedContent);
    }
    setIsEditing(!isEditing);
  };

  const displayContent = isEditing ? editedContent : emailContent;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Eye className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Email Preview</h3>
            <p className="text-slate-600">
              {lead ? `Preview for ${lead.name}` : 'Select a lead to preview email'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {emailContent && (
            <>
              <button
                onClick={copyToClipboard}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={toggleEdit}
                className={`p-2 transition-colors ${
                  isEditing 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-slate-400 hover:text-blue-600'
                }`}
                title={isEditing ? 'Save changes' : 'Edit email'}
              >
                <Edit className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={generateEmail}
            disabled={!lead || isGenerating}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>

      {!lead ? (
        <div className="text-center py-12 text-slate-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Select a lead from the list to generate and preview email content</p>
        </div>
      ) : !emailContent ? (
        <div className="text-center py-12 text-slate-500">
          <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Click "Generate" to create AI-powered email content for {lead.name}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Email Header */}
          <div className="bg-slate-50 rounded-lg p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">To:</span>
                <span className="ml-2 text-slate-600">{lead.name} &lt;{lead.email}&gt;</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">From:</span>
                <span className="ml-2 text-slate-600">{senderName} &lt;your-email@gmail.com&gt;</span>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject Line
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedContent.subject}
                onChange={(e) => setEditedContent(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="font-medium text-slate-800">{displayContent?.subject}</p>
              </div>
            )}
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Body
            </label>
            {isEditing ? (
              <textarea
                value={editedContent.body}
                onChange={(e) => setEditedContent(prev => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {displayContent?.body}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              {isEditing && (
                <span className="text-orange-600">
                  ⚠️ You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              {isEditing && (
                <button
                  onClick={() => {
                    setEditedContent(emailContent);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={sendEmail}
                disabled={isSending || !emailContent}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSending ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPreview;