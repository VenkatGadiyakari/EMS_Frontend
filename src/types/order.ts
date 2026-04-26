export interface OrderItem {
  tierId: string;
  quantity: number;
}

export interface GetOrderItem {
  orderItemId: string;
  tierId: string;
  tierName: string;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

export interface CreateOrderRequest {
  eventId: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  orderId: string;
  eventId: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface GetOrderResponse {
  orderId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentReferenceId?: string;
  createdAt: string;
  updatedAt: string;
  items: GetOrderItem[];
}
