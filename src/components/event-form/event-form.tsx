import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import { EventCategory } from '@/types/event';
import type { Event, CreateEventRequest } from '@/types/event';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';

const VENUES = [
  { id: '550e8400-e29b-41d4-a716-446655440000', label: 'Marine Drive Arena — Mumbai' },
  { id: '550e8400-e29b-41d4-a716-446655440001', label: 'Downtown Convention Center — Bangalore' },
  { id: '550e8400-e29b-41d4-a716-446655440002', label: 'Lakeside Stadium — Delhi' },
];

interface EventFormProps {
  event?: Event;
  onSuccess: (event: Event) => void;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  category?: string;
  eventDate?: string;
  venueId?: string;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [category, setCategory] = useState<string>(event?.category ?? '');
  const [eventDate, setEventDate] = useState(
    event?.eventDate ? event.eventDate.slice(0, 16) : ''
  );
  const [venueId, setVenueId] = useState(event?.venueId ?? '');
  const [bannerImageUrl, setBannerImageUrl] = useState(event?.bannerImageUrl ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');

  // PUBLISHED events can't change date/venue
  const isPublished = event?.status === 'PUBLISHED';

  useEffect(() => {
    setErrors({});
    setApiError('');
  }, [title, category, eventDate, venueId]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!category) next.category = 'Category is required';
    if (!eventDate) next.eventDate = 'Event date is required';
    if (!venueId) next.venueId = 'Venue is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (data: CreateEventRequest) =>
      isEdit
        ? eventService.updateEvent(event.id, data)
        : eventService.createEvent(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', result.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      onSuccess(result);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.';
      setApiError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category as EventCategory,
      eventDate: new Date(eventDate).toISOString().slice(0, 19),
      venueId,
      bannerImageUrl: bannerImageUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h2>

        {apiError && (
          <div className="mb-4">
            <Alert variant="error">{apiError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Optional event description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {Object.values(EventCategory).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              disabled={isPublished}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.eventDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isPublished && (
              <p className="mt-1 text-xs text-gray-500">Date cannot be changed after publishing</p>
            )}
            {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue <span className="text-red-500">*</span>
            </label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              disabled={isPublished}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.venueId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select venue</option>
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            {isPublished && (
              <p className="mt-1 text-xs text-gray-500">Venue cannot be changed after publishing</p>
            )}
            {errors.venueId && <p className="mt-1 text-xs text-red-600">{errors.venueId}</p>}
          </div>

          <Input
            label="Banner Image URL (optional)"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
            placeholder="https://..."
            fullWidth
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
