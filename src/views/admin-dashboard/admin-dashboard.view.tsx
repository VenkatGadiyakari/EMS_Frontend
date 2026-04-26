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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

export const AdminDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events', 0],
    queryFn: () => eventService.getAdminEvents(0, 50),
  });

  const handleCreateSuccess = (event: Event) => {
    setShowCreateForm(false);
    navigate(`/admin/events/${event.id}`);
  };

  const events = data?.content ?? [];
  const publishedEvents = events.filter(e => e.status === 'PUBLISHED');
  const totalPublished = publishedEvents.length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={() => setShowCreateForm(true)}>+ Create Event</Button>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="error">Failed to load events. Please try again.</Alert>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Published Events</p>
          <p className="text-4xl font-bold text-indigo-700 mt-2">
            {isLoading ? '—' : totalPublished}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Upcoming</p>
          <p className="text-4xl font-bold text-green-700 mt-2">
            {isLoading ? '—' : publishedEvents.filter(e => new Date(e.eventDate) > new Date()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Past</p>
          <p className="text-4xl font-bold text-gray-500 mt-2">
            {isLoading ? '—' : publishedEvents.filter(e => new Date(e.eventDate) <= new Date()).length}
          </p>
        </div>
      </div>

      {/* Event cards */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Published Events</h2>
        </div>

        {isLoading && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && publishedEvents.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>No published events yet.</p>
          </div>
        )}

        {!isLoading && publishedEvents.length > 0 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedEvents.map((event) => {
              const lowestPrice = event.tiers && event.tiers.length > 0
                ? Math.min(...event.tiers.map(t => t.price))
                : null;
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/admin/events/${event.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{event.title}</h3>
                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded flex-shrink-0">
                      {event.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">📅 {formatDate(event.eventDate)}</p>
                  <p className="text-xs text-gray-500 mb-2">📍 {event.venue?.city ?? '—'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {lowestPrice !== null ? `From ${formatPrice(lowestPrice)}` : 'No tiers'}
                    </span>
                    <span className="text-xs text-indigo-600 font-medium">Manage →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateForm && (
        <EventForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
      )}
    </AdminLayout>
  );
};
