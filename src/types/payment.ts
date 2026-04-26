export interface CreateRazorpayOrderRequest {
  orderId: string;
}

export interface CreateRazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}
