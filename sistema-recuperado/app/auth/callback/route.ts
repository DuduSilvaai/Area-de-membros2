import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Lista de caminhos permitidos para redirect (previne Open Redirect)
const ALLOWED_PATHS = ['/dashboard', '/members', '/reset-password', '/settings', '/profile'];

/**
 * Valida se o caminho de redirect é seguro
 * Previne ataques de Open Redirect que podem ser usados para phishing
 */
function isValidRedirectPath(path: string): boolean {
    // Deve começar com /
    if (!path.startsWith('/')) return false;

    // Não pode ter // (redirect para outro domínio via protocol-relative URL)
    if (path.includes('//')) return false;

    // Não pode ter @ (pode ser usado em URLs tipo //user@evil.com)
    if (path.includes('@')) return false;

    // Não pode ter \ (Windows path injection)
    if (path.includes('\\')) return false;

    // Não pode ter caracteres de controle ou encoded
    if (/%[0-9a-f]{2}/i.test(path)) return false;

    // Verificar se está em lista de permitidos ou é subpath válido
    return ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const nextParam = searchParams.get('next') ?? '/dashboard';

    // Validar redirect para prevenir Open Redirect attacks
    const next = isValidRedirectPath(nextParam) ? nextParam : '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error("Auth callback error:", error);
        }
    }

    // Return the user to login with error
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
