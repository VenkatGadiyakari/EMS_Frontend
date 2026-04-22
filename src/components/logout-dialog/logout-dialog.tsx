import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/button';

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout: clearAuthState, refreshToken } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout({ refreshToken: refreshToken || '' }),
    onSuccess: () => {
      // Clear auth state
      clearAuthState();

      // Redirect to login
      navigate('/login');
    },
    onError: () => {
      // Even if logout fails on backend, clear client storage for security
      clearAuthState();
      navigate('/login');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Logout
        </h3>

        <p className="text-gray-600 mb-6">
          Are you sure you want to log out? You'll need to sign in again to access your account.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={logoutMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            isLoading={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
