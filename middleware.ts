import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // 1. If user is logged in
    if (token) {
        // Prevent access to login page if already logged in
        if (pathname === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Allow access to everything else
        return NextResponse.next();
    }

    // 2. If user is NOT logged in
    if (!token) {
        // Allow access to login page
        if (pathname === '/login') {
            return NextResponse.next();
        }
        // Redirect to login for all other pages
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets (if any)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
