// src/services/api.js
// SOLID: Single Responsibility — all HTTP communication lives here.
// Components never call fetch() directly; they always go through this service.

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor: automatically attach the JWT to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('fold_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle global 401 (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if we're already on an auth endpoint (login/register)
            const url = error.config?.url || '';
            if (!url.includes('/auth/')) {
                localStorage.removeItem('fold_token');
                localStorage.removeItem('fold_user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth Service ---
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verifyTwoFactorLogin: (data) => api.post('/auth/verify-2fa-login', data),
    getMe: () => api.get('/auth/me'),
    setupTwoFactor: () => api.post('/auth/setup-2fa'),
    enableTwoFactor: (data) => api.post('/auth/enable-2fa', data),
};

// --- Journal Service ---
export const journalService = {
    create: (data) => api.post('/journal', data),
    getByMonth: (month, year) => api.get(`/journal?month=${month}&year=${year}`),
    getByDate: (date) => api.get(`/journal/date/${date}`), // date = "YYYY-MM-DD"
    update: (id, data) => api.put(`/journal/${id}`, data),
    delete: (id) => api.delete(`/journal/${id}`),
};

// --- Connection Service ---
export const connectionService = {
    create: (data) => api.post('/connections', data),
    getAll: () => api.get('/connections'),
    getOne: (id) => api.get(`/connections/${id}`),
    update: (id, data) => api.put(`/connections/${id}`, data),
    delete: (id) => api.delete(`/connections/${id}`),
};

// --- Calendar Service ---
export const calendarService = {
    getMonth: (month, year) => api.get(`/calendar?month=${month}&year=${year}`),
};

// --- Reminder Service ---
export const reminderService = {
    create: (data) => api.post('/reminders', data),
    getByDate: (date) => api.get(`/reminders/date/${date}`),
    update: (id, data) => api.put(`/reminders/${id}`, data),
    delete: (id) => api.delete(`/reminders/${id}`),
    toggleComplete: (id) => api.patch(`/reminders/${id}/toggle`),
};

export default api;
