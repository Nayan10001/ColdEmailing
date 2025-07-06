import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { fetchLeads, importLeads, clearImportStatus } from '../store/slices/leadsSlice';
import { addNotification } from '../store/slices/uiSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Upload,
  Download,
  Search,
  Filter,
  Plus,
  Mail,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

const LeadManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { leads, loading, importStatus } = useAppSelector((state) => state.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  useEffect(() => {
    if (importStatus && !importStatus.loading) {
      if (importStatus.success) {
        dispatch(addNotification({
          type: 'success',
          message: `Successfully imported ${importStatus.imported_count} leads!`,
        }));
        dispatch(fetchLeads()); // Refresh leads
      } else {
        dispatch(addNotification({
          type: 'error',
          message: importStatus.message,
        }));
      }
      dispatch(clearImportStatus());
    }
  }, [importStatus, dispatch]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        dispatch(addNotification({
          type: 'error',
          message: 'Please select a CSV file',
        }));
        return;
      }
      dispatch(importLeads(file));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportLeads = () => {
    // Create CSV content
    const headers = ['name', 'email', 'company', 'industry', 'status', 'notes'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => 
        headers.map(header => `"${lead[header as keyof typeof lead] || ''}"`).join(',')
      )
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    dispatch(addNotification({
      type: 'success',
      message: 'Leads exported successfully!',
    }));
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-400';
      case 'contacted':
        return 'bg-green-500/20 text-green-400';
      case 'responded':
        return 'bg-purple-500/20 text-purple-400';
      case 'qualified':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lead Manager</h1>
          <p className="text-slate-600">Manage your leads and import new contacts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportLeads}
            className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleUploadClick}
            disabled={importStatus?.loading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {importStatus?.loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Import CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search leads by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="responded">Responded</option>
              <option value="qualified">Qualified</option>
              <option value="closed">Closed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Leads</p>
              <p className="text-xl font-bold text-slate-800">{leads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Contacted</p>
              <p className="text-xl font-bold text-slate-800">
                {leads.filter(lead => lead.status === 'contacted').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Responded</p>
              <p className="text-xl font-bold text-slate-800">
                {leads.filter(lead => lead.status === 'responded').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Qualified</p>
              <p className="text-xl font-bold text-slate-800">
                {leads.filter(lead => lead.status === 'qualified').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No leads found</h3>
            <p className="text-slate-600 mb-4">
              {leads.length === 0 
                ? "Get started by importing your first CSV file with leads."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {leads.length === 0 && (
              <button
                onClick={handleUploadClick}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import Leads</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{lead.name}</div>
                        <div className="text-sm text-slate-600">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">{lead.company}</td>
                    <td className="px-6 py-4 text-sm text-slate-800">{lead.industry}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {lead.last_updated 
                        ? new Date(lead.last_updated).toLocaleDateString()
                        : new Date(lead.created_at).toLocaleDateString()
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManager;