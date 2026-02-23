import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BASIC_USER = process.env.BASIC_AUTH_USER ?? '';
const BASIC_PASS = process.env.BASIC_AUTH_PASS ?? '';

export function middleware(request: NextRequest) {
  if (!BASIC_USER || !BASIC_PASS) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return new NextResponse('Basic Auth Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic charset="UTF-8"',
      },
    });
  }
  const base64 = authHeader.slice(6);
  let decoded: string;
  try {
    decoded = atob(base64);
  } catch {
    return new NextResponse('Invalid auth', { status: 401 });
  }
  const [user, pass] = decoded.split(':');
  if (user !== BASIC_USER || pass !== BASIC_PASS) {
    return new NextResponse('Invalid credentials', { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
