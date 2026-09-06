import { NextRequest, NextResponse } from "next/server";
import { verifyStaffSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("staff_session")?.value;
  if (await verifyStaffSession(session)) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/staff/:path*", "/api/analyze", "/api/discharges", "/api/templates"],
};
