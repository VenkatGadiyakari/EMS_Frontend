import axios from "axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
} from "@/types/auth";

const API_BASE_URL = "http://127.0.0.1:8080";

const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.post<AuthResponse>(
      "/api/auth/login",
      credentials,
    );
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await authApi.post<AuthResponse>(
      "/api/auth/register",
      data,
    );
    return response.data;
  },

  logout: async (data: LogoutRequest): Promise<{ message: string }> => {
    const response = await authApi.post<{ message: string }>(
      "/api/auth/logout",
      data,
    );
    return response.data;
  },
};

// Axios interceptor to add auth token to requests
export const setupAuthInterceptor = (getAccessToken: () => string | null) => {
  authApi.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};
