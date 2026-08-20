import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // sw.js'in importScripts ile çektiği worker-*/fallback-* dosyaları da muaf
    // olmalı; aksi halde giriş yapılmamışken /login'e yönlenir ve service
    // worker kurulumu (dolayısıyla push bildirimleri) başarısız olur.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*|worker-.*|fallback-.*|offline).*)",
  ],
};
