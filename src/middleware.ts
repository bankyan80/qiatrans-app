import { NextRequest, NextResponse } from 'next/server';

// No auth enforcement — dashboard is publicly accessible.
// Login is optional, triggered by user clicking the Login button.
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
