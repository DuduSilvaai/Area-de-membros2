'use server';

import { createClient } from '@/lib/supabase/server';
import { validatePasswordStrength, isCommonPassword } from '@/lib/security/password';
import { log } from '@/lib/logger';
import { redirect } from 'next/navigation';

export async function resetPassword(formData: FormData) {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || !confirmPassword) {
        return { error: 'Preencha todos os campos' };
    }

    if (password !== confirmPassword) {
        return { error: 'As senhas não coincidem' };
    }

    // Validate strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        return { error: validation.errors.join('. ') };
    }
    if (isCommonPassword(password)) {
        return { error: 'Senha muito comum. Escolha uma senha mais forte.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        log.error({ errorMessage: error.message }, 'Error resetting password');
        return { error: 'Erro ao redefinir senha' };
    }

    // Log action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Can't use adminSupabase here easily without requireAdmin, 
        // but this is a user action. We can log if table allows RLS or just skip log/log to server console
        console.log(`User ${user.id} reset their password via recovery flow.`);
    }

    redirect('/dashboard?message=Senha atualizada com sucesso');
}
