import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // MAINTENANCE MODE
  // To enable, set MAINTENANCE_MODE="true" in Vercel Environment Variables
  if (process.env.MAINTENANCE_MODE === "true") {
    // Allow access to admin and API routes even during maintenance
    const isApiOrAdmin = request.nextUrl.pathname.startsWith("/api") || 
                         request.nextUrl.pathname.startsWith("/admin");
    
    if (!isApiOrAdmin) {
      // You can redirect to a dedicated maintenance page, 
      // or return a simple static response here.
      // For now, we just rewrite to a custom 503-style response, or allow the app to render an empty state.
      // E.g., request.nextUrl.pathname = '/maintenance'
      // return NextResponse.rewrite(request.nextUrl)
    }
  }

  // SECURITY HEADERS
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
