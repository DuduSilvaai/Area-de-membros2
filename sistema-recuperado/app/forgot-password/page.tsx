'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { requestPasswordReset } from './actions';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const res = await requestPasswordReset(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                setSuccess(true);
                toast.success('Email de recuperação enviado!');
            }
        } catch {
            toast.error('Erro ao enviar solicitação');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Verifique seu email</h2>
                    <p className="text-zinc-400 mb-6">
                        Enviamos um link de recuperação para o seu email. Verifique sua caixa de entrada e spam.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center w-full h-12 rounded-lg bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                    >
                        Voltar para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 text-white">
            <div className="w-full max-w-[440px]">
                <div className="mb-8">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Login
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Recuperar Senha</h1>
                    <p className="text-zinc-400">
                        Digite seu email para receber um link de redefinição.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            placeholder="seu@email.com"
                            className="w-full h-14 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 outline-none transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Link de Recuperação'}
                    </button>
                </form>
            </div>
        </div>
    );
}
