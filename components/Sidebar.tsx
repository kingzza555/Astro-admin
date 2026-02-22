"use client";
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, MessageSquare, History, Settings, Sparkles, LogOut, Zap, Bell, Coins, Shield, Box } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService, AdminUser } from '../lib/auth';

const NAV_ITEMS = [
    { label: 'Overview', icon: LayoutDashboard, href: '/' },
    { label: 'Users', icon: Users, href: '/users' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Coin Management', icon: Coins, href: '/coins' },
    { label: 'Admins', icon: Shield, href: '/admins' }, // New Link
    { label: '3D Assets', icon: Box, href: '/assets' },
    { label: 'ai-model-use', icon: Zap, href: '/usage' },
    { label: 'Inspector', icon: Sparkles, href: '/inspector' },
    // { label: 'Transactions', icon: History, href: '/transactions' },
    { label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        setUser(authService.getUser());
    }, []);

    const handleLogout = () => {
        authService.logout();
    };

    return (
        <aside className="w-64 bg-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-100 z-50">
            <div className="p-8 pb-4">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Astro Admin
                </h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    // Hide Admins menu for non-super-admins if needed (optional)
                    if (item.href === '/admins' && user?.role !== 'super_admin' && !authService.hasPermission('manage_admins')) {
                        // return null; // Uncomment to hide
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-slate-50 text-slate-900'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
                                }`}
                        >
                            <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 m-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                        {user?.username?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.username || 'Guest'}
                        </p>
                        <p className="text-xs text-slate-400 truncate capitalize">
                            {user?.role?.replace('_', ' ') || 'Viewer'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
