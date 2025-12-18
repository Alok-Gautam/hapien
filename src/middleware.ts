import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // For iOS PWA compatibility, we need to be very lenient with auth checks
  // Let most routes through and handle auth client-side
  // This prevents the middleware from blocking before IndexedDB restoration happens

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Only do server-side checks for callback route (needed for OAuth flow)
  if (pathname === '/auth/callback') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: true,
              path: '/',
              maxAge: 365 * 24 * 60 * 60, // 1 year
            }

            request.cookies.set({
              name,
              value,
              ...cookieOptions,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...cookieOptions,
            })
          },
          remove(name: string, options: CookieOptions) {
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: true,
              path: '/',
              maxAge: 0,
            }

            request.cookies.set({
              name,
              value: '',
              ...cookieOptions,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...cookieOptions,
            })
          },
        },
      }
    )

    // Process the callback
    await supabase.auth.getUser()
    return response
  }

  // For all other routes, let them through
  // Client-side auth guards will handle redirects after IndexedDB restoration
  console.log('[Middleware] Allowing request to:', pathname, '(client-side auth will handle)')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
