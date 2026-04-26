import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import type { LoginRequest } from '@/types/auth';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Store auth state
      setAuthState(data);

      // Redirect based on role
      const redirectPath =
        data.user.role === 'BUYER'
          ? '/events'
          : data.user.role === 'ADMIN'
            ? '/admin/dashboard'
            : '/admin/events';
      navigate(redirectPath);
    },
    onError: (error: any) => {
      // Clear password for security
      setPassword('');

      // Handle different error responses
      if (error.response?.status === 401) {
        setGeneralError(error.response.data?.error || 'Invalid email or password');
      } else if (error.response?.status === 403) {
        setGeneralError(error.response.data?.error || 'Your account has been deactivated. Please contact support.');
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setGeneralError('Connection timeout. Please check your internet and try again.');
      } else {
        setGeneralError('An error occurred. Please try again.');
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    if (validateForm()) {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/register/buyer')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <Alert variant="error">{generalError}</Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              fullWidth
              autoComplete="email"
              disabled={loginMutation.isPending}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              fullWidth
              autoComplete="current-password"
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Want to create events?{' '}
              <button
                type="button"
                onClick={() => navigate('/register/organiser')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up as an Organiser
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
