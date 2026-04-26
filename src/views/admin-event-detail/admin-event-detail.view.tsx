import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import type { TicketTier } from '@/types/event';
import { AdminLayout } from '@/components/admin-layout';
import { EventForm } from '@/components/event-form';
import { TierForm } from '@/components/tier-form';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    PUBLISHED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const TierStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-600',
    SOLD_OUT: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

type DialogAction = 'publish' | 'cancel' | { type: 'delete-tier'; tier: TicketTier } | null;

export const AdminEventDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState<TicketTier | undefined>(undefined);
  const [dialogAction, setDialogAction] = useState<DialogAction>(null);
  const [actionError, setActionError] = useState('');

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => eventService.getAdminEvent(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: salesSummary } = useQuery({
    queryKey: ['sales-summary', id],
    queryFn: () => eventService.getSalesSummary(id!),
    enabled: !!id && event?.status === 'PUBLISHED',
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () => eventService.publishEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      setDialogAction(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to publish event.';
      setActionError(msg);
      setDialogAction(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => eventService.cancelEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      setDialogAction(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to cancel event.';
      setActionError(msg);
      setDialogAction(null);
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (tierId: string) => eventService.deleteTier(id!, tierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      setDialogAction(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to delete tier.';
      setActionError(msg);
      setDialogAction(null);
    },
  });

  const handleConfirm = () => {
    if (dialogAction === 'publish') {
      publishMutation.mutate();
    } else if (dialogAction === 'cancel') {
      cancelMutation.mutate();
    } else if (dialogAction && typeof dialogAction === 'object' && dialogAction.type === 'delete-tier') {
      deleteTierMutation.mutate(dialogAction.tier.id);
    }
  };

  const isDialogLoading =
    publishMutation.isPending || cancelMutation.isPending || deleteTierMutation.isPending;

  const getDialogProps = () => {
    if (dialogAction === 'publish') {
      return {
        title: 'Publish Event',
        message: 'This will make the event visible to all buyers. Make sure all tiers are configured correctly.',
        confirmLabel: 'Publish',
        variant: 'default' as const,
      };
    }
    if (dialogAction === 'cancel') {
      return {
        title: 'Cancel Event',
        message: 'This action is irreversible. The event will be permanently cancelled.',
        confirmLabel: 'Cancel Event',
        variant: 'danger' as const,
      };
    }
    if (dialogAction && typeof dialogAction === 'object' && dialogAction.type === 'delete-tier') {
      return {
        title: 'Delete Tier',
        message: `Delete the "${dialogAction.tier.name}" tier? This cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'danger' as const,
      };
    }
    return { title: '', message: '', confirmLabel: 'Confirm', variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !event) {
    return (
      <AdminLayout>
        <div className="mb-4">
          <Alert variant="error">
            Event not found or you don't have permission to view it.{' '}
            <button onClick={() => navigate('/admin/events')} className="underline font-medium">
              Back to Events
            </button>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  const isCancelled = event.status === 'CANCELLED';
  const isDraft = event.status === 'DRAFT';
  const isPublished = event.status === 'PUBLISHED';
  const tiers = event.tiers ?? [];

  return (
    <AdminLayout>
      {/* Back link */}
      <button
        onClick={() => navigate('/admin/events')}
        className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-1"
      >
        ← Back to Events
      </button>

      {actionError && (
        <div className="mb-4">
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <StatusBadge status={event.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                  {event.category}
                </span>
              </span>
              <span>📅 {formatDate(event.eventDate)}</span>
              {event.venue && (
                <span>📍 {event.venue.name}, {event.venue.city}</span>
              )}
            </div>
            {event.description && (
              <p className="mt-3 text-gray-600 text-sm max-w-2xl">{event.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <>
                <Button variant="secondary" onClick={() => setShowEditForm(true)}>
                  Edit
                </Button>
                <Button onClick={() => { setActionError(''); setDialogAction('publish'); }}>
                  Publish
                </Button>
                <Button variant="danger" onClick={() => { setActionError(''); setDialogAction('cancel'); }}>
                  Cancel Event
                </Button>
              </>
            )}
            {isPublished && (
              <>
                <Button variant="secondary" onClick={() => setShowEditForm(true)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => { setActionError(''); setDialogAction('cancel'); }}>
                  Cancel Event
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Tiers */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Ticket Tiers</h2>
          {!isCancelled && (
            <Button
              onClick={() => { setEditingTier(undefined); setShowTierForm(true); }}
              disabled={tiers.length >= 10}
            >
              + Add Tier
            </Button>
          )}
        </div>

        {tiers.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <p className="mb-2">No tiers yet.</p>
            {isDraft && (
              <p className="text-sm">Add at least one tier before publishing.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  {!isCancelled && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tiers.map((tier) => {
                  const sold = tier.totalQty - tier.remainingQty;
                  return (
                    <tr key={tier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{tier.name}</div>
                        {tier.description && (
                          <div className="text-xs text-gray-500">{tier.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(tier.price)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tier.totalQty}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sold}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tier.remainingQty}</td>
                      <td className="px-6 py-4">
                        <TierStatusBadge status={tier.status} />
                      </td>
                      {!isCancelled && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => { setEditingTier(tier); setShowTierForm(true); }}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setActionError(''); setDialogAction({ type: 'delete-tier', tier }); }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Summary (published events only) */}
      {isPublished && salesSummary && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sales Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600 font-medium">Total Tickets Sold</p>
                <p className="text-3xl font-bold text-indigo-900 mt-1">{salesSummary.totalOrders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{formatPrice(salesSummary.totalRevenue)}</p>
              </div>
            </div>

            {salesSummary.tiers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesSummary.tiers.map((t) => (
                      <tr key={t.tierId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.tierName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.soldQty}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.remainingQty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatPrice(t.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditForm && (
        <EventForm
          event={event}
          onSuccess={(updated) => {
            queryClient.setQueryData(['admin-event', id], updated);
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {showTierForm && (
        <TierForm
          eventId={id!}
          tier={editingTier}
          onSuccess={() => setShowTierForm(false)}
          onCancel={() => setShowTierForm(false)}
        />
      )}

      {dialogAction !== null && (
        <ConfirmDialog
          {...getDialogProps()}
          isLoading={isDialogLoading}
          onConfirm={handleConfirm}
          onCancel={() => setDialogAction(null)}
        />
      )}
    </AdminLayout>
  );
};
