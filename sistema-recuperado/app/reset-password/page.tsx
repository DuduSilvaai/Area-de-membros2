'use client';

import { useState } from 'react';
import { resetPassword } from './actions';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        // Note: Server action redirects on success, which stops execution here implicitly or throws
        // We catch errors
        try {
            const res = await resetPassword(formData);
            if (res?.error) {
                toast.error(res.error);
                setLoading(false);
            }
        } catch (error) {
            // Next.js redirect throws error, ignore it
            // if (isRedirectError(error)) throw error; 
            // Simplified:
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 text-white">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-pink-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Redefinir Senha</h1>
                    <p className="text-zinc-400">
                        Crie uma nova senha segura para sua conta.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Nova Senha
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                minLength={8}
                                className="w-full h-14 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[42px] text-zinc-500 hover:text-zinc-300"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                minLength={8}
                                className="w-full h-14 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-70 mt-6"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Alterar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
