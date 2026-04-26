import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import type { TicketTier, CreateTierRequest } from '@/types/event';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';

interface TierFormProps {
  eventId: string;
  tier?: TicketTier;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  price?: string;
  totalQty?: string;
  maxPerOrder?: string;
  saleEndsAt?: string;
}

export const TierForm: React.FC<TierFormProps> = ({ eventId, tier, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const isEdit = !!tier;
  const hasConfirmedOrders = tier?.hasConfirmedOrders ?? false;

  const [name, setName] = useState(tier?.name ?? '');
  const [description, setDescription] = useState(tier?.description ?? '');
  const [price, setPrice] = useState(tier?.price?.toString() ?? '');
  const [totalQty, setTotalQty] = useState(tier?.totalQty?.toString() ?? '');
  const [maxPerOrder, setMaxPerOrder] = useState(tier?.maxPerOrder?.toString() ?? '10');
  const [saleStartsAt, setSaleStartsAt] = useState(
    tier?.saleStartsAt ? tier.saleStartsAt.slice(0, 16) : ''
  );
  const [saleEndsAt, setSaleEndsAt] = useState(
    tier?.saleEndsAt ? tier.saleEndsAt.slice(0, 16) : ''
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setErrors({});
    setApiError('');
  }, [name, price, totalQty, maxPerOrder]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Name is required';
    const priceNum = parseFloat(price);
    if (price === '' || isNaN(priceNum) || priceNum < 0) next.price = 'Price must be 0 or greater';
    const qty = parseInt(totalQty);
    if (!totalQty || isNaN(qty) || qty < 1) next.totalQty = 'Total quantity must be at least 1';
    const maxOrd = parseInt(maxPerOrder);
    if (maxPerOrder && (isNaN(maxOrd) || maxOrd < 1)) next.maxPerOrder = 'Max per order must be at least 1';
    if (saleStartsAt && saleEndsAt && new Date(saleEndsAt) <= new Date(saleStartsAt)) {
      next.saleEndsAt = 'Sale end must be after sale start';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (data: CreateTierRequest) =>
      isEdit
        ? eventService.updateTier(eventId, tier!.id, data)
        : eventService.createTier(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary', eventId] });
      onSuccess();
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
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price),
      totalQty: parseInt(totalQty),
      maxPerOrder: maxPerOrder ? parseInt(maxPerOrder) : 10,
      saleStartsAt: saleStartsAt ? new Date(saleStartsAt).toISOString().slice(0, 19) : undefined,
      saleEndsAt: saleEndsAt ? new Date(saleEndsAt).toISOString().slice(0, 19) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isEdit ? 'Edit Tier' : 'Add Ticket Tier'}
        </h2>

        {apiError && (
          <div className="mb-4">
            <Alert variant="error">{apiError}</Alert>
          </div>
        )}

        {hasConfirmedOrders && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Confirmed orders exist — price and total quantity cannot be changed.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tier Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="e.g. VIP, General Admission"
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Optional tier description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={hasConfirmedOrders}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
                disabled={hasConfirmedOrders}
                placeholder="100"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.totalQty ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.totalQty && <p className="mt-1 text-xs text-red-600">{errors.totalQty}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max per Order</label>
            <input
              type="number"
              min="1"
              value={maxPerOrder}
              onChange={(e) => setMaxPerOrder(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                errors.maxPerOrder ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.maxPerOrder && <p className="mt-1 text-xs text-red-600">{errors.maxPerOrder}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Starts At</label>
              <input
                type="datetime-local"
                value={saleStartsAt}
                onChange={(e) => setSaleStartsAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Ends At</label>
              <input
                type="datetime-local"
                value={saleEndsAt}
                onChange={(e) => setSaleEndsAt(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                  errors.saleEndsAt ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.saleEndsAt && <p className="mt-1 text-xs text-red-600">{errors.saleEndsAt}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? 'Save Tier' : 'Add Tier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
