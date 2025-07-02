import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // This pattern matches routes starting with /en, /es, etc.
  const localePrefixPattern = /^\/(en|es)(\/.*)?$/
  const match = pathname.match(localePrefixPattern)

  if (match) {
    const newPath = match[2] || '/' // The path without the locale prefix
    // Redirect to the same path but without the locale prefix
    return NextResponse.redirect(new URL(newPath, request.url))
  }

  return NextResponse.next()
}
 
export const config = {
  // Match all paths except for API, Next.js internals, and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
