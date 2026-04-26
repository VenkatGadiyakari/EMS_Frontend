import axios from 'axios';
import type { CreateOrderRequest, CreateOrderResponse, GetOrderResponse } from '@/types/order';

const API_BASE_URL = 'http://127.0.0.1:8082';

const orderApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getToken: (() => string | null) | null = null;

export const setupOrderApiInterceptor = (tokenGetter: () => string | null) => {
  getToken = tokenGetter;
  orderApi.interceptors.request.use(
    (config) => {
      const token = getToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

export const orderService = {
  createOrder: async (request: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await orderApi.post<CreateOrderResponse>('/api/orders', request);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<GetOrderResponse> => {
    const response = await orderApi.get<GetOrderResponse>(`/api/orders/${orderId}`);
    return response.data;
  },
};
