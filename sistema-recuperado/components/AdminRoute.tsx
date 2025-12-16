'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
   const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  // ADICIONE ISSO AQUI PARA TESTAR
  console.log("--- DEBUG ADMIN ---");
  console.log("Loading:", isLoading);
  console.log("User ID:", user?.id);
  console.log("Profile:", profile); 
  console.log("Role:", profile?.role);
  // -------------------------------

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role !== 'admin') {
        // Se logado mas não é admin, redireciona ou mostra erro
        // Vamos apenas redirecionar para o dashboard comum por enquanto
        router.push('/');
      }
    }
  }, [user, profile, isLoading, router]);

  if (isLoading) return <div className="flex h-screen items-center justify-center">Verificando permissões...</div>;

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-red-600 bg-gray-50">
        <h1 className="text-4xl font-bold mb-2">403</h1>
        <p>Acesso Negado. Área restrita a administradores.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-blue-600 underline">Voltar</button>
      </div>
    );
  }

  return <>{children}</>;
}