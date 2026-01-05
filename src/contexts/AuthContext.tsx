'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateStats: (won: boolean, lost: boolean, pairsFound: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('🔍 [AuthContext] fetchProfile called for userId:', userId);
    
    // Timeout de 5 secondes pour éviter le blocage
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('⏰ [AuthContext] fetchProfile timeout after 5s');
        resolve(null);
      }, 5000);
    });

    const fetchPromise = (async () => {
      try {
        console.log('🔍 [AuthContext] Starting Supabase query...');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('🔍 [AuthContext] Supabase query completed:', { data, error });

        if (error) {
          console.error('❌ [AuthContext] Error fetching profile:', error.message, error.code, error.details);
          return null;
        }

        console.log('✅ [AuthContext] Profile fetched:', data);
        return data as Profile;
      } catch (err) {
        console.error('❌ [AuthContext] Exception fetching profile:', err);
        return null;
      }
    })();

    return Promise.race([fetchPromise, timeoutPromise]);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    console.log('🔄 [AuthContext] refreshProfile called, user:', user?.id);
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    console.log('🚀 [AuthContext] useEffect init started');
    let isMounted = true;

    // Timeout de sécurité pour éviter le blocage infini
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⏰ [AuthContext] Timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 secondes max

    // Get initial session
    const getSession = async () => {
      console.log('📡 [AuthContext] getSession started');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] getSession error:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        console.log('📡 [AuthContext] getSession result:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });

        if (!isMounted) {
          console.log('⚠️ [AuthContext] Component unmounted, skipping state update');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Mettre loading à false immédiatement
        if (isMounted) {
          console.log('✅ [AuthContext] Setting loading to false (from getSession)');
          setLoading(false);
        }
        
        if (session?.user) {
          console.log('👤 [AuthContext] User found, fetching profile in background...');
          // Fetch profile en arrière-plan (ne bloque plus le loading)
          fetchProfile(session.user.id).then((profileData) => {
            if (isMounted) {
              console.log('📦 [AuthContext] Setting profile from getSession');
              setProfile(profileData);
            }
          });
        } else {
          console.log('👤 [AuthContext] No user in session');
        }
      } catch (err) {
        console.error('❌ [AuthContext] getSession exception:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    console.log('👂 [AuthContext] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [AuthContext] Auth state changed:', { event, userId: session?.user?.id });
        
        if (!isMounted) {
          console.log('⚠️ [AuthContext] Component unmounted, skipping auth change');
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Toujours mettre loading à false d'abord pour éviter le blocage
        if (isMounted) {
          console.log('✅ [AuthContext] Setting loading to false (from onAuthStateChange)');
          setLoading(false);
        }
        
        if (session?.user) {
          // Fetch profile en arrière-plan (ne bloque plus le loading)
          fetchProfile(session.user.id).then((profileData) => {
            if (isMounted) {
              console.log('📦 [AuthContext] Setting profile from onAuthStateChange');
              setProfile(profileData);
            }
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      console.log('🧹 [AuthContext] Cleanup - unsubscribing');
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, fetchProfile]);

  const signUp = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 [AuthContext] signUp called for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username,
          },
        },
      });

      if (error) {
        console.error('❌ [AuthContext] signUp error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AuthContext] signUp success:', data.user?.id);
      if (data.user) {
        return { 
          success: true, 
          error: 'Compte créé ! Vérifiez votre email pour confirmer votre inscription.' 
        };
      }

      return { success: false, error: 'Une erreur est survenue' };
    } catch (err) {
      console.error('❌ [AuthContext] signUp exception:', err);
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔑 [AuthContext] signIn called for:', email);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AuthContext] signIn error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou mot de passe incorrect' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Veuillez confirmer votre email avant de vous connecter' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ [AuthContext] signIn success');
      return { success: true };
    } catch (err) {
      console.error('❌ [AuthContext] signIn exception:', err);
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] signOut called');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateStats = async (won: boolean, lost: boolean, pairsFound: number) => {
    console.log('📊 [AuthContext] updateStats called:', { won, lost, pairsFound });
    if (!user || !profile) {
      console.log('⚠️ [AuthContext] updateStats skipped - no user or profile');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          games_played: profile.games_played + 1,
          games_won: profile.games_won + (won ? 1 : 0),
          games_lost: profile.games_lost + (lost ? 1 : 0),
          total_pairs_found: profile.total_pairs_found + pairsFound,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ [AuthContext] updateStats error:', error);
      } else {
        console.log('✅ [AuthContext] Stats updated successfully');
        await refreshProfile();
      }
    } catch (err) {
      console.error('❌ [AuthContext] updateStats exception:', err);
    }
  };

  console.log('🎨 [AuthContext] Render:', { loading, hasUser: !!user, hasProfile: !!profile });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
