// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas protegidas
const PROTECTED_ROUTES = ['/dashboard']
const ADMIN_ROUTES = ['/dashboard/crear-tipo', '/dashboard/crear-producto', '/dashboard/registros', '/dashboard/usuarios']

export function middleware(request: NextRequest): NextResponse {
  const path = request.nextUrl.pathname
  
  // Obtener cookies
  const usuarioId = request.cookies.get('usuario_id')?.value
  const usuarioTipo = request.cookies.get('usuario_tipo')?.value

  // Verificar rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some(route => path.startsWith(route))

  // Si no tiene sesión y va a ruta protegida
  if (isProtectedRoute && !usuarioId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si no es admin y va a ruta de admin
  if (isAdminRoute && usuarioTipo !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/'
  ]
}