import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { setCurrentPage } from '../../store/slices/uiSlice';
import {
  BarChart3,
  Users,
  Mail,
  Settings,
  FileText,
  CheckCircle,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'leads', label: 'Lead Manager', icon: Users, path: '/leads' },
  { id: 'templates', label: 'Email Templates', icon: Mail, path: '/templates' },
  { id: 'setup', label: 'Setup Guide', icon: Settings, path: '/setup' },
  { id: 'script', label: 'Python Script', icon: FileText, path: '/script' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  const handleMenuClick = (item: typeof menuItems[0]) => {
    dispatch(setCurrentPage(item.id));
    navigate(item.path);
  };

  return (
    <div className={`bg-slate-800 text-white transition-all duration-300 ${
      sidebarOpen ? 'w-64' : 'w-16'
    } min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">Smark Solutions</h1>
              <p className="text-sm text-slate-400">Cold Email Automation System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      {sidebarOpen && (
        <div className="p-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Leads</span>
              <span className="text-white">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Templates</span>
              <span className="text-white">2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Daily Limit</span>
              <span className="text-orange-400">50 emails</span>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          {sidebarOpen && <span className="text-sm text-green-400">System Ready</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;