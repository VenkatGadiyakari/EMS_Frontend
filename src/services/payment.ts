import axios from 'axios';
import type { CreateRazorpayOrderRequest, CreateRazorpayOrderResponse } from '@/types/payment';

const API_BASE_URL = 'http://127.0.0.1:8083';

const paymentApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getToken: (() => string | null) | null = null;

export const setupPaymentApiInterceptor = (tokenGetter: () => string | null) => {
  getToken = tokenGetter;
  paymentApi.interceptors.request.use(
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

export const paymentService = {
  createRazorpayOrder: async (
    request: CreateRazorpayOrderRequest,
  ): Promise<CreateRazorpayOrderResponse> => {
    const response = await paymentApi.post<CreateRazorpayOrderResponse>(
      '/api/payments/create-order',
      request,
    );
    return response.data;
  },
};
