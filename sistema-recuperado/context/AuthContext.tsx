'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; // Removemos Session daqui pois não estava usando explicitamente no tipo
import { supabase } from '@/lib/supabaseClient';

type Profile = {
  id: string;
  role: 'admin' | 'member';
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  logAction: (action: string, details: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Começa carregando
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logAction = async (action: string, details: Record<string, any>) => {
    if (!user) return;
    try {
      await supabase.from('access_logs').insert([{ 
          user_id: user.id,
          action,
          details,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Função auxiliar para buscar perfil
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil no Supabase:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // 1. Verifica sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        // 2. ESPERA (await) o perfil chegar antes de liberar o loading
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }

      // 3. Só agora diz que terminou de carregar
      setIsLoading(false);
    };

    initializeAuth();

    // Ouve mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Se logou agora, busca o perfil e espera
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
        
        if (event === 'SIGNED_IN') {
            await logAction('login', { email: session.user.email });
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, logAction, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};