import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/auth/login',
    '/auth/instructions',
    '/api',
    '/_next',
    '/favicon.ico',
    '/public'
  ];

  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verificar si hay un token de sesión de Supabase (para autenticación simplificada)
  const supabaseTokens = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token'
  ];

  const hasToken = supabaseTokens.some(tokenName =>
    request.cookies.get(tokenName)
  );

  if (!hasToken) {
    // Redirigir a login si no hay token de sesión
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas las rutas excepto:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};