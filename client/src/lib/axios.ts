import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

/**
 * Transient-failure retry.
 *
 * Hosting platforms like Railway can briefly return a 502/503/504 (or drop
 * the connection entirely) while the app is redeploying or restarting. When
 * that happens the response carries no CORS headers, so the browser reports
 * a generic "blocked by CORS policy" / network error instead of the real
 * status code. Retrying a couple of times with backoff smooths over these
 * brief outages instead of surfacing a confusing error to the user.
 */
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 600;

interface RetryableConfig extends AxiosRequestConfig {
  __retryCount?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isNetworkError = !error.response;
    const isRetryableStatus = status
      ? RETRYABLE_STATUS_CODES.has(status)
      : false;
    const isGetRequest = (config?.method ?? "get").toLowerCase() === "get";

    if (
      config &&
      isGetRequest &&
      (isNetworkError || isRetryableStatus) &&
      (config.__retryCount ?? 0) < MAX_RETRIES
    ) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      await delay(RETRY_DELAY_MS * config.__retryCount);
      return api(config);
    }

    return Promise.reject(error);
  },
);
