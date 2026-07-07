import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper functions for user storage
export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'candidate';
}

export function saveSession(token: string, user: UserPayload) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getSessionUser(): UserPayload | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

// Server origin (API base without the trailing /api), used to resolve locally
// served assets like /uploads/... profile pictures.
export function getServerOrigin(): string {
  return API_URL.replace(/\/api\/?$/, '');
}

/**
 * Resolve an asset URL for rendering. Absolute URLs (Cloudinary, etc.) pass
 * through untouched; relative /uploads paths are prefixed with the server origin.
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/uploads')) return `${getServerOrigin()}${url}`;
  return url;
}

/**
 * Fetch a protected resume PDF as a blob (JWT stays in the header) and open it
 * inline in a new browser tab. Returns an error message on failure, else null.
 */
export async function openResumePdf(resumeId: string): Promise<string | null> {
  try {
    const res = await api.get(`/resume/${resumeId}/view`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    // Revoke shortly after so the new tab has time to load it.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return null;
  } catch (err: any) {
    // Blob error responses need to be read back as text/JSON.
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        return parsed?.error?.message || 'Failed to open resume.';
      } catch {
        return 'Failed to open resume.';
      }
    }
    return err.response?.data?.error?.message || 'Failed to open resume.';
  }
}
