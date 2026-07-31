import axios from 'axios';
import {
  RFMRequest,
  RFMResponse,
  ChurnRequest,
  ChurnResponse,
  DSSRequest,
  DSSResponse
} from '../types/customer';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

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
