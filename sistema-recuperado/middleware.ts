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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Define paths that are public and don't require authentication
    const publicPaths = ['/login', '/signup', '/forgot-password', '/auth/callback', '/auth/confirm', '/api/test-env'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // ============================================================
    // PROTEÇÃO POR ROLE - Rotas administrativas
    // ============================================================
    const adminPaths = ['/dashboard', '/portals', '/users', '/settings', '/chat', '/reports', '/contents', '/events', '/admin', '/comments'];
    const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // Verificar role do usuário para rotas admin
    if (user && isAdminPath) {
        // Buscar role do user_metadata
        const userRole = user.user_metadata?.role;

        // BLOQUEIO: Se não é admin, redirecionar para /members
        if (userRole !== 'admin') {
            console.log('[Middleware] Acesso admin negado para role:', userRole);
            const url = request.nextUrl.clone();
            url.pathname = '/members';
            return NextResponse.redirect(url);
        }
    }

    // If user is NOT authenticated and trying to access a protected route
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user IS authenticated and trying to access login/signup pages
    if (user && isPublicPath && request.nextUrl.pathname !== '/auth/callback') {
        const url = request.nextUrl.clone();
        // Redireciona baseado no role do usuário
        const userRole = user.user_metadata?.role;
        url.pathname = userRole === 'admin' ? '/dashboard' : '/members';
        return NextResponse.redirect(url);
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
         * - public (public folder)
         * - extensions: svg, png, jpg, jpeg, gif, webp
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
    ],
};
