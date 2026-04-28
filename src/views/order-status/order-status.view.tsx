import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orderService } from '@/services/order';
import { paymentService } from '@/services/payment';
import type { GetOrderResponse } from '@/types/order';
import type { CreateRazorpayOrderResponse } from '@/types/payment';
import { Button } from '@/components/button';
import { Alert } from '@/components/alert';
import { BuyerLayout } from '@/components/buyer-layout';

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const extractMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message ?? fallback;
};

export const OrderStatusView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  // pausePolling is only true while the Razorpay retry modal is open.
  // Terminal status (SUCCESS/FAILED) stops polling via derived value — no effect needed.
  const [pausePolling, setPausePolling] = useState(false);
  const [retryError, setRetryError] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/events', { replace: true });
    }
  }, [orderId, navigate]);

  const {
    data: order,
    error: fetchError,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      if (pausePolling) return false;
      const status = (query.state.data as GetOrderResponse | undefined)?.status;
      if (status === 'CONFIRMED' || status === 'FAILED' || status === 'CANCELLED') return false;
      return 5000;
    },
    staleTime: 0,
  });

  const openRazorpayModal = (data: CreateRazorpayOrderResponse) => {
    if (!window.Razorpay) {
      setRetryError('Payment SDK failed to load. Please refresh the page and try again.');
      return;
    }
    const rzp = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: 'Event Ticketing',
      description: 'Ticket Purchase',
      order_id: data.razorpayOrderId,
      handler: () => {
        setPausePolling(false);
      },
      theme: { color: '#2563EB' },
      modal: {
        ondismiss: () => setRetryError('Payment was cancelled. You can retry below.'),
      },
    });
    rzp.open();
  };

  const retryMutation = useMutation({
    mutationFn: () => paymentService.createRazorpayOrder({ orderId: orderId! }),
    onSuccess: (data) => {
      setRetryError('');
      setPausePolling(true);
      openRazorpayModal(data);
    },
    onError: (err: unknown) =>
      setRetryError(extractMessage(err, 'Failed to initiate payment. Please try again.')),
  });

  return (
    <BuyerLayout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        {/* Spinner — shown whenever there is no data yet and no error */}
        {!order && !fetchError && (
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !order && (
          <Alert variant="error">
            Failed to load order status. Please refresh the page.
          </Alert>
        )}

        {/* Order status card */}
        {order && (
          <div className="bg-white rounded-lg shadow p-8 text-center space-y-6">
            {/* PENDING or any non-terminal status — default spinner */}
            {order.status !== 'CONFIRMED' && order.status !== 'FAILED' && order.status !== 'CANCELLED' && (
              <>
                <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                <h2 className="text-xl font-bold text-gray-900">Processing Payment...</h2>
                <p className="text-gray-500 text-sm">
                  Please wait while we confirm your payment. This page updates automatically.
                </p>
              </>
            )}

            {/* CONFIRMED */}
            {order.status === 'CONFIRMED' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-700">Payment Successful!</h2>
                <p className="text-gray-600 text-sm">
                  Your order has been confirmed.{' '}
                  <span className="font-mono font-medium">{order.orderId}</span>
                </p>
                <p className="text-gray-800 font-semibold text-lg">
                  Total Paid: {formatAmount(order.totalAmount)}
                </p>
                <Button onClick={() => navigate('/events')} fullWidth>
                  Browse More Events
                </Button>
              </>
            )}

            {/* FAILED / CANCELLED */}
            {(order.status === 'FAILED' || order.status === 'CANCELLED') && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-700">Payment Failed</h2>
                <p className="text-gray-500 text-sm">
                  Something went wrong with your payment. You can retry below.
                </p>

                {retryError && (
                  <Alert variant="error">{retryError}</Alert>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    isLoading={retryMutation.isPending}
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate()}
                    fullWidth
                  >
                    Retry Payment
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/events')}
                    fullWidth
                  >
                    Back to Events
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};
