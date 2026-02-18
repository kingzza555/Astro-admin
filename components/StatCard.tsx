import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Link from 'next/link';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    isNegative?: boolean; // true = red trend, false = green trend
    trendLabel?: string;
    className?: string;
    href?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    trend,
    isNegative = false,
    trendLabel = "vs last period",
    className = "",
    href
}: StatCardProps) {
    const Content = (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow h-full ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
                </div>
                {icon && (
                    <div className={`p-3 rounded-xl ${href ? 'bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors' : 'bg-indigo-50 text-indigo-600'}`}>
                        {icon}
                    </div>
                )}
            </div>

            {trend ? (
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${isNegative
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {isNegative ? <ArrowDownRight size={12} strokeWidth={3} /> : <ArrowUpRight size={12} strokeWidth={3} />}
                        {trend}
                    </span>
                    <span className="text-xs text-slate-400">{trendLabel}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 mt-1 opacity-0">
                    <span className="text-xs">Placeholder</span>
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full group">
                {Content}
            </Link>
        );
    }

    return Content;
}
