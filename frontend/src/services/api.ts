import axios from 'axios';
import {
  RFMRequest,
  RFMResponse,
  ChurnRequest,
  ChurnResponse,
  DSSRequest,
  DSSResponse
} from '../types/customer';

export const API_ROOT_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE_URL = `${API_ROOT_URL}/api`;

// --- Quản lý access token (JWT) ---
const TOKEN_STORAGE_KEY = 'omni_dss_access_token';

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage không khả dụng (private mode...) — bỏ qua
  }
};

// AuthContext đăng ký hàm xử lý khi phiên hết hạn (401)
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Tự động gắn Authorization: Bearer <token>
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Gặp 401 (token hết hạn / không hợp lệ) -> đăng xuất. Bỏ qua chính request login/register (sai mật khẩu).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthAttempt) {
      setAccessToken(null);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Lấy thông báo lỗi thân thiện từ response FastAPI ({ detail }) */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as any;
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return 'Không kết nối được tới máy chủ. Vui lòng kiểm tra Backend đang chạy.';
  }
  return fallback;
};

export const predictRFM = async (data: RFMRequest): Promise<RFMResponse> => {
  const response = await apiClient.post<RFMResponse>('/rfm/predict', data);
  return response.data;
};

export const predictChurn = async (data: ChurnRequest): Promise<ChurnResponse> => {
  const response = await apiClient.post<ChurnResponse>('/churn/predict', data);
  return response.data;
};

export const evaluateDSS = async (data: DSSRequest): Promise<DSSResponse> => {
  const response = await apiClient.post<DSSResponse>('/dss/evaluate', data);
  return response.data;
};

export const evaluateBatchDSS = async (data: DSSRequest[]): Promise<DSSResponse[]> => {
  const response = await apiClient.post<DSSResponse[]>('/dss/evaluate-batch', data);
  return response.data;
};
