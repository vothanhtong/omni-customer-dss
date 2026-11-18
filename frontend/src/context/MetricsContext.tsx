import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getModelMetrics, getApiErrorMessage } from '../services/api';
import { ModelMetrics } from '../types/metrics';

interface MetricsContextType {
  metrics: ModelMetrics | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export const MetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await getModelMetrics());
      setError(null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không tải được chỉ số mô hình.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <MetricsContext.Provider value={{ metrics, loading, error, reload }}>{children}</MetricsContext.Provider>;
};

export const useModelMetrics = () => {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error('useModelMetrics must be used within a MetricsProvider');
  return ctx;
};

/** Định dạng số liệu: 0.6362 -> "0.6362"; null/undefined -> "—" */
export const fmt = (v: number | null | undefined, digits = 4): string =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(digits);

export const pct = (v: number | null | undefined, digits = 2): string =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${(v * 100).toFixed(digits)}%`;
