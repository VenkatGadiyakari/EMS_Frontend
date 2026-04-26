import axios from "axios";
import type {
  Event,
  EventSummary,
  PaginatedResponse,
  CreateEventRequest,
  UpdateEventRequest,
  TicketTier,
  CreateTierRequest,
  UpdateTierRequest,
  TierDeletionCheck,
  SalesSummaryResponse,
} from "@/types/event";

const API_BASE_URL = "http://127.0.0.1:8081";

const eventApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor
let getToken: (() => string | null) | null = null;
let getUserId: (() => string | null) | null = null;

export const setupEventApiInterceptor = (
  tokenGetter: () => string | null,
  userIdGetter: () => string | null,
) => {
  getToken = tokenGetter;
  getUserId = userIdGetter;
  eventApi.interceptors.request.use(
    (config) => {
      const token = getToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const userId = getUserId?.();
      if (userId) {
        config.headers['X-User-Id'] = userId;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

export const eventService = {
  // Admin endpoints
  getAdminEvents: async (
    page = 0,
    size = 10,
  ): Promise<PaginatedResponse<Event>> => {
    const response = await eventApi.get("/api/admin/events", {
      params: { page, size },
    });
    return response.data;
  },

  getAdminEvent: async (eventId: string): Promise<Event> => {
    const response = await eventApi.get(`/api/admin/events/${eventId}`);
    return response.data;
  },

  createEvent: async (data: CreateEventRequest): Promise<Event> => {
    const response = await eventApi.post("/api/admin/events", data);
    return response.data;
  },

  updateEvent: async (
    eventId: string,
    data: UpdateEventRequest,
  ): Promise<Event> => {
    const response = await eventApi.put(`/api/admin/events/${eventId}`, data);
    return response.data;
  },

  cancelEvent: async (eventId: string): Promise<Event> => {
    const response = await eventApi.patch(
      `/api/admin/events/${eventId}/cancel`,
    );
    return response.data;
  },

  publishEvent: async (eventId: string): Promise<Event> => {
    const response = await eventApi.patch(
      `/api/admin/events/${eventId}/publish`,
    );
    return response.data;
  },

  // Tier endpoints
  createTier: async (
    eventId: string,
    data: CreateTierRequest,
  ): Promise<TicketTier> => {
    const response = await eventApi.post(
      `/api/admin/events/${eventId}/tiers`,
      data,
    );
    return response.data;
  },

  getTier: async (eventId: string, tierId: string): Promise<TicketTier> => {
    const response = await eventApi.get(
      `/api/admin/events/${eventId}/tiers/${tierId}`,
    );
    return response.data;
  },

  updateTier: async (
    eventId: string,
    tierId: string,
    data: UpdateTierRequest,
  ): Promise<TicketTier> => {
    const response = await eventApi.put(
      `/api/admin/events/${eventId}/tiers/${tierId}`,
      data,
    );
    return response.data;
  },

  checkTierDeletion: async (
    eventId: string,
    tierId: string,
  ): Promise<TierDeletionCheck> => {
    const response = await eventApi.delete(
      `/api/admin/events/${eventId}/tiers/${tierId}`,
      {
        validateStatus: (status) => status < 500,
      },
    );
    return response.data;
  },

  deleteTier: async (eventId: string, tierId: string): Promise<void> => {
    await eventApi.delete(`/api/admin/events/${eventId}/tiers/${tierId}`);
  },

  getSalesSummary: async (eventId: string): Promise<SalesSummaryResponse> => {
    const response = await eventApi.get(`/api/admin/events/${eventId}/summary`);
    return response.data;
  },

  // Public endpoints
  getPublicEvents: async (params: {
    category?: string;
    city?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<EventSummary>> => {
    const response = await eventApi.get("/api/events", { params });
    return response.data;
  },

  getPublicEvent: async (eventId: string): Promise<Event> => {
    const response = await eventApi.get(`/api/events/${eventId}`);
    return response.data;
  },
};
