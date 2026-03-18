import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  isPending: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: true, isPending: false, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*, roles(name, permissions), departments(name)")
        .eq("user_id", userId)
        .single();

      if (data) {
        const status = data.status as string;
        if (status === "pendente" || status === "inativo" || status === "bloqueado") {
          setIsPending(true);
          setProfile(null);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          return;
        }
        setIsPending(false);
        setProfile(data);
      }
    } catch (err) {
      console.error("[Auth] Error fetching profile:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Restore session from storage first — this is the source of truth
    supabase.auth.getSession().then(async ({ data: { session: restoredSession } }) => {
      if (!mounted) return;

      setSession(restoredSession);
      setUser(restoredSession?.user ?? null);

      if (restoredSession?.user) {
        await fetchProfile(restoredSession.user.id);
      }

      if (mounted) setLoading(false);
    });

    // 2. Listen for subsequent auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setIsPending(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsPending(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
