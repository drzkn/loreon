import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}${next}`)

      const cookiesToSet = cookieStore.getAll()
      cookiesToSet.forEach(({ name, value }) => {
        response.cookies.set(name, value, {
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 días
        })
      })

      return response
    } else {
      console.error('❌ [AUTH_CALLBACK] Error en exchangeCodeForSession:', error?.message)
    }
  }

  console.error('❌ [AUTH_CALLBACK] Error en callback de autenticación - no code o error en sesión')
  return NextResponse.redirect(`${origin}/auth/login?error=Error en autenticación`)
}