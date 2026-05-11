import axios from "axios";
import { cookieUtils } from "@/utils/cookie";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8001";

const apiClient = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor for Auth
apiClient.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined") {
    token = cookieUtils.get("auth_token") || localStorage.getItem("auth_token");
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for Global Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isAuthPage = window.location.pathname.includes("/login") || window.location.pathname.includes("/signup");
        const isMeRequest = error.config?.url?.includes("/users/me");
        
        // Don't redirect if we're already on auth page or checking self
        if (!isAuthPage && !isMeRequest) {
          localStorage.removeItem("auth_token");
          cookieUtils.remove("auth_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
