import axios from 'axios';
import {
  RFMRequest,
  RFMResponse,
  ChurnRequest,
  ChurnResponse,
  DSSRequest,
  DSSResponse,
  CustomerAction,
  HighRiskPage,
  HighRiskQuery,
  BatchPredictionResponse
} from '../types/customer';
import { AnalyticsOverview, DssEvaluation, ModelMetrics } from '../types/metrics';

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

export const getModelMetrics = async (): Promise<ModelMetrics> => {
  const response = await apiClient.get<ModelMetrics>('/metrics');
  return response.data;
};

/** Số liệu BI tổng hợp từ dữ liệu thật (cần đăng nhập) */
export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const response = await apiClient.get<AnalyticsOverview>('/analytics/overview');
  return response.data;
};

/** Tham số lọc chung cho danh sách khách hàng (URLSearchParams: alert_level lặp khóa, không dùng dạng alert_level[]) */
const customerFilterParams = (q: Omit<HighRiskQuery, 'alert_level'> & { alert_level?: HighRiskQuery['alert_level'] }) => {
  const params = new URLSearchParams();
  q.alert_level?.forEach((l) => params.append('alert_level', l));
  if (q.segment) params.set('segment', q.segment);
  if (q.channel) params.set('channel', q.channel);
  if (q.region) params.set('region', q.region);
  params.set('page', String(q.page));
  params.set('page_size', String(q.page_size));
  return params;
};

/** Danh sách khách cảnh báo rủi ro (dữ liệu thật đã chấm điểm, không chứa customer_id gốc) */
export const getHighRiskCustomers = async (q: HighRiskQuery): Promise<HighRiskPage> =>
  (await apiClient.get<HighRiskPage>('/customers/high-risk', { params: customerFilterParams(q) })).data;

/** Cảnh báo khách tiềm năng: VIP/Tiềm năng có xác suất mua lại >= 60% */
export const getOpportunityCustomers = async (q: Omit<HighRiskQuery, 'alert_level'>): Promise<HighRiskPage> =>
  (await apiClient.get<HighRiskPage>('/customers/opportunities', { params: customerFilterParams(q) })).data;

export const triggerCustomerAction = async (ref: string, action: string, note?: string): Promise<CustomerAction> => {
  const response = await apiClient.post<CustomerAction>(`/customers/${encodeURIComponent(ref)}/actions`, { action, note });
  return response.data;
};

/** Dự đoán churn hàng loạt từ file CSV đơn hàng (cùng định dạng orders_cleaned.csv) */
export const predictChurnBatch = async (file: File, opts: { asOf?: string; maxItems?: number } = {}): Promise<BatchPredictionResponse> => {
  const form = new FormData();
  form.append('file', file);
  const params: Record<string, string | number> = { max_items: opts.maxItems ?? 200 };
  if (opts.asOf) params.as_of = opts.asOf;
  // Ghi đè Content-Type mặc định (application/json) để axios gửi multipart thay vì serialize FormData thành JSON
  const response = await apiClient.post<BatchPredictionResponse>('/churn/predict-batch', form, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

export interface DssRule {
  rule_id: string;
  level: string;
  segments: string;
  churn_interval: string;
  warning: string | null;
  recommendation: string;
}

/** Bảng luật DSS (dùng cho trợ lý gợi ý theo luật) */
export const getDssRules = async (): Promise<DssRule[]> => {
  const response = await apiClient.get<DssRule[]>('/dss/rules');
  return response.data;
};

/** Đánh giá hiệu quả DSS trên tập kiểm tra out-of-time */
export const getDssEvaluation = async (): Promise<DssEvaluation> => {
  const response = await apiClient.get<DssEvaluation>('/dss/evaluation');
  return response.data;
};
