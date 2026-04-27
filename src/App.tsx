import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginView from './views/login';
import BuyerRegistrationView from './views/buyer-registration';
import OrganiserRegistrationView from './views/organiser-registration';
import EventListingView from './views/event-listing';
import EventDetailView from './views/event-detail';
import { AdminEventsView } from './views/admin-events';
import { AdminEventDetailView } from './views/admin-event-detail';
import { AdminDashboardView } from './views/admin-dashboard';
import CheckoutView from './views/checkout';
import OrderStatusView from './views/order-status';
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


function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  const defaultRedirect = !isAuthenticated
    ? '/login'
    : user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'ORGANISER'
        ? '/admin/events'
        : '/events';

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={defaultRedirect} replace /> : <LoginView />}
      />
      <Route
        path="/register/buyer"
        element={isAuthenticated ? <Navigate to={defaultRedirect} replace /> : <BuyerRegistrationView />}
      />
      <Route
        path="/register/organiser"
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <OrganiserRegistrationView />}
      />

      {/* Public event routes - accessible without auth */}
      <Route path="/events" element={<EventListingView />} />
      <Route path="/events/:eventId" element={<EventDetailView />} />

      {/* Protected checkout route — any authenticated user */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutView />
          </ProtectedRoute>
        }
      />

      {/* Protected order status route — any authenticated user */}
      <Route
        path="/order-status"
        element={
          <ProtectedRoute>
            <OrderStatusView />
          </ProtectedRoute>
        }
      />

      {/* Protected admin/organiser routes */}
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
            <AdminEventsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:id"
        element={
          <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
            <AdminEventDetailView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ORGANISER', 'ADMIN']}>
            <AdminDashboardView />
          </ProtectedRoute>
        }
      />

      {/* Default route */}
      <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
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
