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

// URL base del servidor (sin /api/v1) para recursos estáticos como /uploads
export const API_SERVER_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
