'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Tenta fazer o Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Log access (non-blocking)
      if (data.user) {
        void supabase
          .from('access_logs')
          .insert({
            user_id: data.user.id,
            action: 'login',
            details: { method: 'email_password' }
          });
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu email e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
      style={{ backgroundColor: 'var(--bg-default)' }}
    >
      {/* Decorative Background Elements */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--primary-main) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* Brand */}
      <div className="relative z-10 mb-8 text-center">
        <h1
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          MOZART
        </h1>
        <p
          className="mt-2 text-sm font-medium tracking-wide uppercase opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          Premium Member Area
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-[480px] relative z-10 transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="p-10 sm:p-14">
          <div className="mb-10">
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Acessar conta
            </h2>
            <p className="text-gray-400 text-sm">
              Digite suas credenciais para continuar
            </p>
          </div>

          {error && (
            <div
              className="mb-8 p-4 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: 'rgba(255, 45, 120, 0.1)' }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--status-error)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 rounded-lg outline-none transition-all duration-200 text-base placeholder-gray-500 focus:ring-1 focus:ring-[#FF2D78] focus:border-[#FF2D78]"
                style={{
                  backgroundColor: '#27272A', // Zinc 800 - SOLID
                  border: '1px solid #52525B', // Zinc 600
                  color: '#FFFFFF', // White Pure
                }}
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Senha
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium transition-colors hover:text-[#FF2D78]"
                  style={{ color: '#A1A1AA' }} // Zinc 400
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 rounded-lg outline-none transition-all duration-200 text-base placeholder-gray-500 focus:ring-1 focus:ring-[#FF2D78] focus:border-[#FF2D78]"
                style={{
                  backgroundColor: '#27272A', // Zinc 800 - SOLID
                  border: '1px solid #52525B', // Zinc 600
                  color: '#FFFFFF', // White Pure
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-full font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
              style={{
                backgroundColor: 'var(--primary-main)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center relative z-10">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          © {new Date().getFullYear()} Mozart Platform. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}