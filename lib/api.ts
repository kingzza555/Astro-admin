import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.102:8000/api/admin',
    // headers: {
    //     'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'astro-admin-secret-key-2026',
    // },
});

// Request Interceptor: Add Bearer Token
api.interceptors.request.use((config) => {
    const token = Cookies.get('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Token expired or invalid
        Cookies.remove('admin_token');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default api;
