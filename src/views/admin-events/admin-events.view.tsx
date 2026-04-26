import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import type { Event } from '@/types/event';
import { AdminLayout } from '@/components/admin-layout';
import { EventForm } from '@/components/event-form';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export const AdminEventsView: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events', page],
    queryFn: () => eventService.getAdminEvents(page, 10),
  });

  const handleCreateSuccess = (event: Event) => {
    setShowCreateForm(false);
    navigate(`/admin/events/${event.id}`);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500 mt-1">All your events — drafts, published, and cancelled.</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>+ Create Event</Button>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error">Failed to load events. Please try again.</Alert>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0 animate-pulse flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && data.content.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event to get started.</p>
          <Button onClick={() => setShowCreateForm(true)}>+ Create Event</Button>
        </div>
      )}

      {!isLoading && data && data.content.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.content.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{event.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={event.status ?? 'PUBLISHED'} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(event.eventDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {event.tiers && event.tiers.length > 0
                        ? formatPrice(Math.min(...event.tiers.map((t) => t.price)))
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <span className="px-4 py-2 text-gray-700 text-sm">Page {page + 1} of {data.totalPages}</span>
              <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {showCreateForm && (
        <EventForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
      )}
    </AdminLayout>
  );
};
