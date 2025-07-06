import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add all routes that require authentication
const protectedRoutes = [
  '/player',
  '/coach',
  '/parent',
  '/medicalstaff',
  '/equipmentmanager',
  '/physicaltrainer',
  '/clubadmin',
  '/admin',
];

// Routes that should redirect to dashboard if user is already logged in
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware in mock mode - auth is handled client-side
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true') {
    return NextResponse.next();
  }
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get auth token from cookies or headers
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    // Add the original URL as a redirect parameter
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && authToken) {
    // Verify the token is not expired or invalid
    try {
      // For now, check if token looks valid (you can add proper JWT verification later)
      if (authToken === 'mock-jwt-token' || authToken.length < 20) {
        // Invalid/mock token, clear it and allow access to login
        const response = NextResponse.next();
        response.cookies.delete('authToken');
        return response;
      }
      // Valid token, redirect to player dashboard
      return NextResponse.redirect(new URL('/player', request.url));
    } catch (error) {
      // Invalid token, allow access to login page
      const response = NextResponse.next();
      response.cookies.delete('authToken');
      return response;
    }
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};