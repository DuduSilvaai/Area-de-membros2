'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; // Removemos Session daqui pois não estava usando explicitamente no tipo
import { createClient } from '@/lib/supabase/client';

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
  const [supabase] = useState(() => createClient());
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

  // No longer fetching from 'profiles' table as it doesn't exist
  // We use direct user_metadata from the session

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Extract role from metadata
        const role = session.user.user_metadata?.role as 'admin' | 'member';
        setProfile({ id: session.user.id, role: role || 'member' });

      } else {
        setUser(null);
        setProfile(null);
      }

      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Extract role from metadata
        const role = session.user.user_metadata?.role as 'admin' | 'member';
        setProfile({ id: session.user.id, role: role || 'member' });

        if (event === 'SIGNED_IN') {
          // await logAction('login', { email: session.user.email });
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
    // Log logout action before signing out
    if (user) {
      try {
        await supabase.from('access_logs').insert([{
          user_id: user.id,
          action: 'logout',
          details: { email: user.email },
          created_at: new Date().toISOString()
        }]);
      } catch (error) {
        console.error('Error logging logout:', error);
      }
    }
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