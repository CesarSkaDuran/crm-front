declare global {
  interface Window {
    APP_CONFIG?: { apiUrl: string };
  }
}

const fallbackUrl = 'http://localhost:3000/api/v1';

export const API_BASE_URL =
  typeof window !== 'undefined' && window.APP_CONFIG?.apiUrl
    ? window.APP_CONFIG.apiUrl
    : fallbackUrl;
