'use client';

import Link from 'next/link';
import { Button } from '@/components/UIComponents';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-4xl mx-auto" 
         style={{ minHeight: 'calc(100vh - 100px)', color: 'var(--text-primary)' }}>
      
      <div className="text-center space-y-8 animate-fadeIn w-full">
        {/* Illustration / Icon */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-pink-500/20 rounded-full" />
          <Search className="relative w-12 h-12 text-pink-500" />
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600">
            404
          </h1>
          <h2 className="text-2xl font-bold">Página não encontrada</h2>
          <p className="text-sm opacity-70 mx-2">
            Opa! A página que você está procurando parece ter sumido do mapa ou nunca existiu.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 font-medium text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <Link href="/dashboard">
            <Button className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium">
              <Home className="w-4 h-4" />
              Ir para o Início
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="fixed bottom-8 text-xs opacity-40 font-medium tracking-wide text-center">
        MOZART SYSTEM
      </div>
    </div>
  );
}
