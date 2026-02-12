import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/admin',
    headers: {
        'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'astro-admin-secret-key-2026',
    },
});

export default api;
