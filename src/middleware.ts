import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // i18n middleware is disabled
  return NextResponse.next()
}
 
export const config = {
  matcher: [],
};
