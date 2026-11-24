import axios from 'axios';

export const GATEWAY_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: GATEWAY_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bazaar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function resolveImageUrl(imageUrl) {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${GATEWAY_URL}${imageUrl}`;
}

export default api;
