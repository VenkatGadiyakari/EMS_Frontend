import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginView from './views/login';
import BuyerRegistrationView from './views/buyer-registration';
import OrganiserRegistrationView from './views/organiser-registration';
import EventListingView from './views/event-listing';
import './App.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Placeholder components for routes not yet implemented
const PlaceholderView: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600">This view is coming soon...</p>
      </div>
    </div>
  );
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/events" replace /> : <LoginView />}
      />
      <Route
        path="/register/buyer"
        element={isAuthenticated ? <Navigate to="/events" replace /> : <BuyerRegistrationView />}
      />
      <Route
        path="/register/organiser"
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <OrganiserRegistrationView />}
      />

      {/* Public event routes - accessible without auth */}
      <Route path="/events" element={<EventListingView />} />
      <Route path="/events/:eventId" element={<PlaceholderView title="Event Detail" />} />

      {/* Protected admin/organiser routes */}
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
            <PlaceholderView title="Admin Event List" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
            <PlaceholderView title="Admin Dashboard" />
          </ProtectedRoute>
        }
      />

      {/* Default route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/events" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
