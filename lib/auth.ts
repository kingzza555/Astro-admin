import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'admin_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AdminUser {
    username: string;
    role: 'super_admin' | 'admin';
    permissions: string[];
    exp?: number;
}

export const authService = {
    login: async (username: string, password: string): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            // Handle API_URL (Remove trailing /api/admin if present to avoid duplication, or just use it correctly)
            // Strategy: Check if API_URL ends with /api/admin. 
            // Better: Just assume API_URL is the base for admin routes if currently set that way.

            let loginUrl = `${API_URL}/login`; // If API_URL is .../api/admin, this becomes .../api/admin/login

            // Fallback for localhost default which doesn't have path
            if (!API_URL.includes('/api/admin')) {
                loginUrl = `${API_URL}/api/admin/login`;
            }

            console.log("Attempting login to:", loginUrl); // Debug log

            const res = await fetch(loginUrl, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await res.json();
            const token = data.access_token;

            if (token) {
                // Set cookie (Expires in 7 days)
                Cookies.set(TOKEN_KEY, token, { expires: 7, secure: window.location.protocol === 'https:' });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: () => {
        Cookies.remove(TOKEN_KEY);
        // Optional: clear query cache or redirect
        window.location.href = '/login';
    },

    getToken: (): string | undefined => {
        return Cookies.get(TOKEN_KEY);
    },

    getUser: (): AdminUser | null => {
        const token = Cookies.get(TOKEN_KEY);
        if (!token) return null;
        try {
            const decoded = jwtDecode<AdminUser>(token);
            // Check expiry
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                Cookies.remove(TOKEN_KEY);
                return null;
            }
            return decoded;
        } catch (e) {
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        const user = authService.getUser();
        return !!user;
    },

    hasPermission: (requiredPermission: string): boolean => {
        const user = authService.getUser();
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return user.permissions?.includes(requiredPermission) || false;
    }
};
