import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoutDialog } from '@/components/logout-dialog';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const { user } = useAuth();

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location.pathname.startsWith(path)
        ? 'bg-indigo-700 text-white'
        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <span className="text-white font-bold text-lg tracking-tight">EMS Admin</span>
              <div className="flex items-center gap-1">
                <Link to="/admin/events" className={navLinkClass('/admin/events')}>
                  My Events
                </Link>
                <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {user.role}
                </span>
              )}
              <button
                onClick={() => setShowLogout(true)}
                className="text-indigo-100 hover:text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <LogoutDialog isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
};
