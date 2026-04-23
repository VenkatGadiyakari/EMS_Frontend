import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/event';
import type { TicketTier } from '@/types/event';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Alert } from '@/components/alert';

type TierUIStatus = 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON' | 'SALE_ENDED';

function getTierStatus(tier: TicketTier, now: Date): TierUIStatus {
  if (tier.remainingQty === 0) return 'SOLD_OUT';
  if (tier.saleStartsAt && now < new Date(tier.saleStartsAt)) return 'COMING_SOON';
  if (tier.saleEndsAt && now > new Date(tier.saleEndsAt)) return 'SALE_ENDED';
  return 'AVAILABLE';
}

function getMaxSelectableQty(tier: TicketTier): number {
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

export const EventDetailView: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getPublicEvent(eventId!),
    enabled: !!eventId,
  });

  const [ticketSelections, setTicketSelections] = useState<Record<string, number>>({});

  useEffect(() => {
    if (event?.tiers) {
      const initial: Record<string, number> = {};
      event.tiers.forEach((tier) => {
        initial[tier.id] = 0;
      });
      setTicketSelections(initial);
    }
  }, [event?.id]);

  const hasAnySelection = Object.values(ticketSelections).some((qty) => qty > 0);

  const handleQtyChange = (tierId: string, value: number, tier: TicketTier) => {
    const clamped = Math.max(0, Math.min(value, getMaxSelectableQty(tier)));
    setTicketSelections((prev) => ({ ...prev, [tierId]: clamped }));
  };

  const handleBuyNow = () => {
    if (!event?.tiers) return;
    const summary = event.tiers
      .filter((tier) => (ticketSelections[tier.id] ?? 0) > 0)
      .map((tier) => `${ticketSelections[tier.id]}x ${tier.name}`)
      .join(', ');
    window.alert(`Order summary:\n${summary}`);
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/events')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Events
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 animate-pulse">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-80 bg-gray-300 rounded-lg"></div>
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="h-5 bg-gray-300 rounded w-1/4"></div>
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="error">
            Failed to load event details. Please try again.
          </Alert>
        )}

        {/* Main content */}
        {!isLoading && event && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner image */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {event.bannerImageUrl ? (
                  <img
                    src={event.bannerImageUrl}
                    alt={event.title}
                    className="w-full h-64 sm:h-80 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-80 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">{event.title[0]}</span>
                  </div>
                )}
              </div>

              {/* Event info card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {event.category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h2>
                {event.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Date & Time</p>
                    <p className="text-gray-600">{formatDate(event.eventDate)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Venue</p>
                    <p className="text-gray-800">{event.venue.name}</p>
                    {event.venue.address && (
                      <p className="text-gray-500">{event.venue.address}</p>
                    )}
                    <p className="text-gray-500">
                      {event.venue.city}
                      {event.venue.country ? `, ${event.venue.country}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — ticket panel */}
            <div className="mt-6 lg:mt-0">
              <div className="lg:sticky lg:top-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Tickets</h3>

                {event.tiers && event.tiers.length > 0 ? (
                  event.tiers.map((tier) => {
                    const status = getTierStatus(tier, now);
                    const isDisabled = status !== 'AVAILABLE';
                    const max = getMaxSelectableQty(tier);
                    const qty = ticketSelections[tier.id] ?? 0;
                    const badge = status !== 'AVAILABLE' ? BADGE_STYLES[status] : null;

                    return (
                      <div
                        key={tier.id}
                        className="bg-white rounded-lg shadow p-4 border border-gray-100"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{tier.name}</p>
                          <p className="font-bold text-gray-900 whitespace-nowrap">
                            {formatPrice(tier.price)}
                          </p>
                        </div>

                        {badge && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}

                        {tier.description && (
                          <p className="text-sm text-gray-500 mb-2">{tier.description}</p>
                        )}

                        {tier.saleStartsAt && tier.saleEndsAt && (
                          <p className="text-xs text-gray-400 mb-2">
                            Sale: {formatDate(tier.saleStartsAt)} – {formatDate(tier.saleEndsAt)}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mb-3">
                          {tier.remainingQty} of {tier.totalQty} remaining
                          {tier.maxPerOrder > 0 && ` · max ${tier.maxPerOrder} per order`}
                        </p>

                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-700 font-medium">Qty:</label>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            value={qty}
                            disabled={isDisabled}
                            aria-label={`Quantity for ${tier.name}`}
                            onChange={(e) =>
                              handleQtyChange(
                                tier.id,
                                parseInt(e.target.value, 10) || 0,
                                tier,
                              )
                            }
                            className="w-20 text-center"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No tickets available for this event.</p>
                )}

                <Button fullWidth disabled={!hasAnySelection} onClick={handleBuyNow}>
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
