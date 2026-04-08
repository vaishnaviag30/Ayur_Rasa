// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: message || 'An error occurred'
    };
  }
}

type AuthResponseData = {
  token: string;
  user: AuthUser;
};

// Auth helpers
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR';
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('user');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Auth API
export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    name: string;
    role: 'PATIENT' | 'DOCTOR';
    phone?: string;
    licenseNumber?: string;
  }) => apiCall<AuthResponseData>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  login: (payload: { email: string; password: string }) =>
    apiCall<AuthResponseData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verify: () => apiCall('/api/auth/verify')
};

// User API
export const userApi = {
  getProfile: () => apiCall('/api/users/me'),

  updateProfile: (payload: {
    name?: string;
    phone?: string;
    profilePicture?: string;
  }) =>
    apiCall('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};

// Patient API
export const patientApi = {
  getProfile: (patientId: string) =>
    apiCall<{ patient: unknown }>(`/api/patients/${patientId}`),

  getMyProfile: () =>
    apiCall<{ patient: unknown }>('/api/patients/me'),

  updateProfile: (patientId: string, payload: Record<string, unknown>) =>
    apiCall(`/api/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getDoctorPatients: () =>
    apiCall('/api/patients/doctor/patients/list'),

  createPatient: (payload: {
    email: string;
    name: string;
    password: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    dosha: string;
  }) =>
    apiCall('/api/patients/doctor/patients/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

// Assessment API
export const assessmentApi = {
  submit: (payload: {
    patientId: string;
    answers: Record<string, string>;
    vataScore: number;
    pittaScore: number;
    kaphaScore: number;
  }) =>
    apiCall('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getPatientAssessments: (patientId: string) =>
    apiCall(`/api/assessments/patient/${patientId}`)
};

// Food API
export const foodApi = {
  getAll: (params?: { dosha?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.dosha) query.append('dosha', params.dosha);
    if (params?.search) query.append('search', params.search);
    return apiCall(`/api/foods?${query.toString()}`);
  },

  getById: (foodId: string) => apiCall(`/api/foods/${foodId}`),

  uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall('/api/foods/upload/csv', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to use browser default
    });
  }
};

// Diet Plan API
export const dietPlanApi = {
  create: (payload: Record<string, unknown>) =>
    apiCall('/api/diet-plans', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getPatientPlans: (patientId: string) =>
    apiCall(`/api/diet-plans/patient/${patientId}`),

  getById: (planId: string) => apiCall(`/api/diet-plans/${planId}`),

  update: (planId: string, payload: Record<string, unknown>) =>
    apiCall(`/api/diet-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};

// Health check
export const healthCheck = () => apiCall('/api/health');
