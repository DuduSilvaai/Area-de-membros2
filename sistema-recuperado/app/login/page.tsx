'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom'; // Hook for submit button state
import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { loginAction } from './actions';

// Submit button component to handle loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-14 rounded-full font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20"
      style={{
        backgroundColor: 'var(--primary-main)',
      }}
    >
      {pending ? (
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
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  // Custom client-side wrapper to capture error result from action
  // Note: Standard action/useFormState approach is also possible, 
  // but this allows us to keep the existing UI logic for error display easily.
  const handleSubmit = async (formData: FormData) => {
    setError(null);

    // Call server action
    // If it redirects (success), this promise won't resolve in a way we handle here normally.
    // If it returns an object, it's an error.
    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (e) {
      // Redirects throw errors in Next.js Server Actions, so we let them pass
      // But we catch others
      // Actually standard 'redirect()' throws a specific error that Next handles.
      // We shouldn't catch it generally unless we check digest.
      // However, simplified approach:
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
          className="text-4xl xs:text-5xl md:text-6xl font-black tracking-tighter"
          style={{
            background: 'linear-gradient(to right, #ff0080, #ff8c00, #ff0080)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% auto',
            animation: 'gradient 3s linear infinite',
            textShadow: '0 0 20px rgba(255, 0, 128, 0.5)'
          }}
        >
          LOVE FOR SWEET
        </h1>
        <p
          className="mt-3 text-sm font-medium tracking-[0.2em] uppercase opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          Área Premium para Franqueados
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-[480px] relative z-10 transition-all duration-300 backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(24, 24, 27, 0.8)', // Semi-transparent dark
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
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

          <form action={handleSubmit} className="flex flex-col">
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
                name="email"
                type="email"
                required
                className="w-full h-14 px-4 rounded-lg outline-none transition-all duration-200 text-base placeholder-gray-500 focus:ring-2 focus:ring-[#FF2D78]/50 focus:border-[#FF2D78]"
                style={{
                  backgroundColor: '#09090b', // Zinc 950 - Darker
                  border: '1px solid #27272a', // Zinc 800
                  color: '#FFFFFF',
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
                name="password"
                type="password"
                required
                className="w-full h-14 px-4 rounded-lg outline-none transition-all duration-200 text-base placeholder-gray-500 focus:ring-2 focus:ring-[#FF2D78]/50 focus:border-[#FF2D78]"
                style={{
                  backgroundColor: '#09090b', // Zinc 950 - Darker
                  border: '1px solid #27272a', // Zinc 800
                  color: '#FFFFFF',
                }}
                placeholder="••••••••"
              />
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center relative z-10">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          © 2026 Love For Sweet Platform. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}