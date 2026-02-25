// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh the Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parent routes require parent auth
  if (pathname.startsWith('/parent')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Kid login requires parent session (to know which kids to show)
  if (pathname.startsWith('/kid-login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Kid dashboard routes require kid session cookie
  if (pathname.startsWith('/kid/')) {
    const kidSession = request.cookies.get('kid-session')
    if (!kidSession?.value) {
      return NextResponse.redirect(new URL('/kid-login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/parent/:path*', '/kid-login/:path*', '/kid/:path*'],
}
