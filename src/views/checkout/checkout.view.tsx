import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import { orderService } from '@/services/order';
import { paymentService } from '@/services/payment';
import type { TicketTier } from '@/types/event';
import type { CreateOrderRequest } from '@/types/order';
import type { CreateRazorpayOrderResponse } from '@/types/payment';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import { BuyerLayout } from '@/components/buyer-layout';

type TierUIStatus = 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON' | 'SALE_ENDED';

function getTierStatus(tier: TicketTier, now: Date): TierUIStatus {
  if (tier.remainingQty === 0) return 'SOLD_OUT';
  if (tier.saleStartsAt && now < new Date(tier.saleStartsAt)) return 'COMING_SOON';
  if (tier.saleEndsAt && now > new Date(tier.saleEndsAt)) return 'SALE_ENDED';
  return 'AVAILABLE';
}

function getMaxQty(tier: TicketTier): number {
  return Math.min(tier.maxPerOrder, tier.remainingQty);
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BADGE_STYLES: Record<Exclude<TierUIStatus, 'AVAILABLE'>, { label: string; className: string }> = {
  SOLD_OUT: { label: 'Sold Out', className: 'bg-red-100 text-red-700' },
  COMING_SOON: { label: 'Coming Soon', className: 'bg-yellow-100 text-yellow-700' },
  SALE_ENDED: { label: 'Sale Ended', className: 'bg-gray-100 text-gray-600' },
};

const extractMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
};

interface CheckoutLocationState {
  eventId: string;
  selections: Record<string, number>;
}

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as CheckoutLocationState | null;

  const [localSelections, setLocalSelections] = useState<Record<string, number>>(
    locationState?.selections ?? {},
  );
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    if (!locationState?.eventId) {
      navigate('/events', { replace: true });
    }
  }, [locationState, navigate]);

  const { data: event, isLoading, error: fetchError } = useQuery({
    queryKey: ['event', locationState?.eventId],
    queryFn: () => eventService.getPublicEvent(locationState!.eventId),
    enabled: !!locationState?.eventId,
  });

  const now = new Date();

  const visibleTiers: TicketTier[] = (event?.tiers ?? []).filter(
    (tier) => (localSelections[tier.id] ?? 0) > 0,
  );

  const totalQty = visibleTiers.reduce(
    (sum, tier) => sum + (localSelections[tier.id] ?? 0),
    0,
  );

  const totalAmount = visibleTiers.reduce(
    (sum, tier) => sum + tier.price * (localSelections[tier.id] ?? 0),
    0,
  );

  const anyNonAvailable = visibleTiers.some(
    (tier) => getTierStatus(tier, now) !== 'AVAILABLE',
  );

  const canProceed = totalQty > 0 && !anyNonAvailable;

  const handleDecrement = (tier: TicketTier) => {
    const current = localSelections[tier.id] ?? 0;
    if (current <= 0) return;
    setLocalSelections((prev) => ({ ...prev, [tier.id]: current - 1 }));
  };

  const handleIncrement = (tier: TicketTier) => {
    const current = localSelections[tier.id] ?? 0;
    const max = getMaxQty(tier);
    if (current >= max) return;
    setLocalSelections((prev) => ({ ...prev, [tier.id]: current + 1 }));
  };

  const handleRemove = (tierId: string) => {
    setLocalSelections((prev) => ({ ...prev, [tierId]: 0 }));
  };

  const openRazorpayModal = (
    data: CreateRazorpayOrderResponse,
    orderId: string,
    description: string,
  ) => {
    if (!window.Razorpay) {
      setPaymentError('Payment SDK failed to load. Please refresh the page and try again.');
      return;
    }
    const rzp = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'Event Ticketing',
      description,
      order_id: data.razorpayOrderId,
      handler: (_response: RazorpayPaymentResponse) => {
        navigate(`/order-status?orderId=${orderId}`);
      },
      theme: { color: '#2563EB' },
      modal: {
        ondismiss: () =>
          setPaymentError('Payment was cancelled. Click "Retry Payment" to try again.'),
      },
    });
    rzp.open();
  };

  const razorpayMutation = useMutation({
    mutationFn: (req: { orderId: string }) => paymentService.createRazorpayOrder(req),
    onSuccess: (data, variables) => {
      setPaymentError('');
      openRazorpayModal(data, variables.orderId, event?.title ?? 'Event Tickets');
    },
    onError: (err: unknown) =>
      setPaymentError(extractMessage(err, 'Failed to initiate payment. Please retry.')),
  });

  const orderMutation = useMutation({
    mutationFn: (request: CreateOrderRequest) => orderService.createOrder(request),
    onSuccess: (data) => {
      setPaymentError('');
      setPendingOrderId(data.orderId);
      razorpayMutation.mutate({ orderId: data.orderId });
    },
    onError: (err: unknown) =>
      setPaymentError(extractMessage(err, 'Failed to create order. Please try again.')),
  });

  const handleProceedToPay = () => {
    if (!locationState?.eventId) return;
    setPaymentError('');

    if (pendingOrderId) {
      razorpayMutation.mutate({ orderId: pendingOrderId });
      return;
    }

    const request: CreateOrderRequest = {
      eventId: locationState.eventId,
      items: visibleTiers.map((tier) => ({
        tierId: tier.id,
        quantity: localSelections[tier.id],
      })),
    };

    orderMutation.mutate(request);
  };

  const isPaymentPending = orderMutation.isPending || razorpayMutation.isPending;
  const buttonLabel = pendingOrderId ? 'Retry Payment' : 'Proceed to Pay';

  return (
    <BuyerLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/events/${locationState?.eventId}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Summary</h1>
        </div>
        {/* Payment error */}
        {paymentError && (
          <Alert variant="error" className="mb-6">
            {paymentError}
          </Alert>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
                <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !isLoading && (
          <Alert variant="error">
            Failed to load event details. Please go back and try again.
          </Alert>
        )}

        {/* Main content */}
        {!isLoading && event && (
          <div className="space-y-6">
            {/* Section A: Event Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h2>
              <p className="text-sm text-gray-600 mb-1">{formatDate(event.eventDate)}</p>
              <p className="text-sm text-gray-700">
                {event.venue.name}, {event.venue.city}
              </p>
            </div>

            {/* Section B: Ticket Summary */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Your Tickets</h3>

              {visibleTiers.length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500 mb-2">No tickets selected.</p>
                  <button
                    onClick={() => navigate(`/events/${locationState?.eventId}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Go back to add tickets
                  </button>
                </div>
              )}

              {visibleTiers.map((tier) => {
                const status = getTierStatus(tier, now);
                const isDisabled = status !== 'AVAILABLE';
                const qty = localSelections[tier.id] ?? 0;
                const max = getMaxQty(tier);
                const subtotal = tier.price * qty;
                const badge = status !== 'AVAILABLE' ? BADGE_STYLES[status] : null;

                return (
                  <div
                    key={tier.id}
                    className="bg-white rounded-lg shadow p-4 border border-gray-100"
                  >
                    {/* Tier header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{tier.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(tier.price)} per ticket
                        </p>
                        {badge && (
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatPrice(subtotal)}</p>
                      </div>
                    </div>

                    {/* Stepper + remove */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDecrement(tier)}
                          disabled={isDisabled || qty <= 0}
                          aria-label={`Decrease quantity for ${tier.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full border
                                     border-gray-300 text-gray-700 hover:bg-gray-100
                                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleIncrement(tier)}
                          disabled={isDisabled || qty >= max}
                          aria-label={`Increase quantity for ${tier.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full border
                                     border-gray-300 text-gray-700 hover:bg-gray-100
                                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(tier.id)}
                        aria-label={`Remove ${tier.name} from order`}
                        className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    {qty > max && max > 0 && (
                      <p className="mt-2 text-xs text-red-600">
                        Quantity exceeds the available limit ({max}). Please reduce.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section C: Order Total */}
            {visibleTiers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Tickets</span>
                  <span className="font-medium text-gray-900">{totalQty}</span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Section D: Actions */}
            <div className="flex gap-3 justify-end pb-8">
              <Button
                variant="secondary"
                onClick={() => navigate(`/events/${locationState?.eventId}`)}
              >
                Back
              </Button>
              <Button
                disabled={!canProceed || isPaymentPending}
                isLoading={isPaymentPending}
                onClick={handleProceedToPay}
              >
                {buttonLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};
