import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Validate and clean environment variables at module level
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export async function middleware(request: NextRequest) {
  // If env vars are missing, allow request to proceed (will show error on page)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not configured')
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  // Try to get user, but handle errors gracefully
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Auth error in middleware:', error.message)
    } else {
      user = data.user
    }
  } catch (error) {
    console.error('Failed to get user in middleware:', error)
    // Allow request to proceed without auth check
    return response
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/verify']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/auth/')
  )

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated but hasn't completed profile, redirect to onboarding
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    if (!profile?.name) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // If authenticated user tries to access auth pages, redirect to feed
  if (user && isPublicRoute && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

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
