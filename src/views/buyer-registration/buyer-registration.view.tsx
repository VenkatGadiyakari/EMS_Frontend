import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import type { RegisterRequest } from '@/types/auth';

export const BuyerRegistrationView: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'BUYER' as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      // Store auth state
      setAuthState(data);

      // Redirect to events page
      setTimeout(() => {
        navigate('/events');
      }, 1000);
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        setErrors({ email: error.response.data?.error || 'This email is already registered. Please login or use a different email.' });
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.field) {
          setErrors({ [errorData.field]: errorData.error });
        } else if (errorData.fields) {
          setErrors(errorData.fields);
        } else {
          setGeneralError(errorData.error || 'Validation failed. Please check your inputs.');
        }
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        setGeneralError('Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 503) {
        setGeneralError('Service temporarily unavailable. Please try again in a few moments.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one digit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({});

    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your buyer account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {generalError && (
            <Alert variant="error">{generalError}</Alert>
          )}

          {registerMutation.isSuccess && (
            <Alert variant="success">
              Account created successfully! Welcome to Event Ticketing. Redirecting...
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={errors.email}
              fullWidth
              autoComplete="email"
              disabled={registerMutation.isPending}
            />

            <Input
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              error={errors.fullName}
              fullWidth
              autoComplete="name"
              disabled={registerMutation.isPending}
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              error={errors.password}
              fullWidth
              autoComplete="new-password"
              disabled={registerMutation.isPending}
            />
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters with at least one digit
            </p>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Want to organize events?{' '}
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
