export {};

declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: RazorpayPaymentResponse) => void;
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
  }

  interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}
