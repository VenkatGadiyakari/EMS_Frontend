import React from 'react';
import { BuyerLayout } from '@/components/buyer-layout';
import { useAuth } from '../../contexts/AuthContext';

const ProfileView: React.FC = () => {
  const { user } = useAuth();

  return (
    <BuyerLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-2xl">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Account ID</dt>
                  <dd className="text-sm font-medium text-gray-900 font-mono">{user.id}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default ProfileView;
