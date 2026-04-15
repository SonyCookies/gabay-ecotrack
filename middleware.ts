import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token/session from cookies if you use server-side verification, 
  // or handle route protection purely client-side via AuthGuard/RoleGuard
  const sessionToken = request.cookies.get("firebaseSession")?.value;
  // TODO: Add strict role decoding once setup is complete 

  // Basic redirection example:
  // if (!sessionToken && pathname.match(/^\/(resident|operator|collector|admin)/)) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
