import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfigStatus, isSupabaseFetchError } from '@/lib/supabase/config'

let supabaseAuthUnavailable = false
let supabaseReachabilityChecked = false

async function isSupabaseAuthAvailable(url: string) {
  if (supabaseAuthUnavailable) {
    return false
  }

  if (!supabaseReachabilityChecked) {
    const { checkSupabaseReachability } = await import('@/lib/supabase/reachability')
    const reachability = await checkSupabaseReachability(url)
    supabaseReachabilityChecked = true

    if (!reachability.ok) {
      supabaseAuthUnavailable = true
      return false
    }
  }

  return true
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const config = getSupabaseConfigStatus()
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/auth')
  const isAuthActionRoute = pathname === '/auth/logout' || pathname === '/auth/callback'
  const isPublicRoute =
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/cron')

  if (!config.ok) {
    if (!isAuthRoute && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('config', 'missing')
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    config.env.url,
    config.env.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  const authAvailable = await isSupabaseAuthAvailable(config.env.url)

  if (authAvailable) {
    try {
      const { data, error } = await supabase.auth.getUser()
      user = data.user

      if (error && isSupabaseFetchError(error)) {
        supabaseAuthUnavailable = true
        user = null
      }
    } catch (error) {
      if (!isSupabaseFetchError(error)) {
        throw error
      }

      supabaseAuthUnavailable = true
      user = null
    }
  }

  if (supabaseAuthUnavailable && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('config', 'unreachable')
    return NextResponse.redirect(url)
  }

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    const requestedPath = `${pathname}${request.nextUrl.search}`
    url.pathname = '/auth/login'
    url.searchParams.set('next', requestedPath)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !isAuthActionRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
