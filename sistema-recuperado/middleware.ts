import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Use getSession() instead of getUser() for faster middleware
    // getSession() reads from cookies locally, while getUser() makes a network request
    // Security note: Client-side AdminGuard still validates with getUser() for sensitive operations
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    // 1. Define Public Paths (No Auth Required)
    const publicPaths = [
        '/login',
        '/signup',
        '/forgot-password',
        '/auth/callback',
        '/auth/confirm'
    ];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // 2. Define Admin Paths (Admin Role Required) - Strict Prefix Matching
    const adminPaths = [
        '/dashboard',
        '/portals',
        '/users',
        '/settings',
        '/chat',
        '/reports',
        '/contents',
        '/events',
        '/admin',
        '/comments'
    ];
    const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // 3. Define Member Paths (Authenticated Users) - Explicitly allowed or fallback?
    // In this app, everything not public and not admin is generally for members (e.g. /members)
    // But we should be careful.

    // CASE A: User is NOT authenticated
    if (!user) {
        if (!isPublicPath) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
        // Allow public path access
        return response;
    }

    // CASE B: User IS authenticated
    if (user) {
        // If trying to access public auth pages (login/signup), redirect to appropriate dashboard
        if (isPublicPath && request.nextUrl.pathname !== '/auth/callback') {
            const url = request.nextUrl.clone();
            const userRole = user.user_metadata?.role;
            url.pathname = userRole === 'admin' ? '/dashboard' : '/members';
            return NextResponse.redirect(url);
        }

        // Redirect root to appropriate dashboard
        if (request.nextUrl.pathname === '/') {
            const url = request.nextUrl.clone();
            const userRole = user.user_metadata?.role;
            url.pathname = userRole === 'admin' ? '/dashboard' : '/members';
            return NextResponse.redirect(url);
        }

        // Admin Route Protection
        if (isAdminPath) {
            const userRole = user.user_metadata?.role;
            if (userRole !== 'admin') {
                // Access denied for non-admins -> Redirect to members area
                const url = request.nextUrl.clone();
                url.pathname = '/members';
                return NextResponse.redirect(url);
            }
        }

        // Implicitly allow access to other paths (Member area)
        // Ideally we would have a 'memberPaths' array and block anything else (404), 
        // but for now we assume non-admin paths are safe for members.
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes - handled separately)
         * - public assets by extension
         */
        "/((?!_next/static|_next/image|_next/data|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
    ],
};

