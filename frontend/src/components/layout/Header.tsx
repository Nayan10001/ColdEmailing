import React from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { Menu, Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.ui);

  const unreadCount = notifications.length;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-slate-800">
            Campaign Dashboard
          </h2>
          <p className="text-slate-600">Monitor and manage your email campaigns</p>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;