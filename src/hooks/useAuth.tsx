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
  session: null,
  user: null,
  profile: null,
  loading: true,
  isPending: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const finishInit = () => {
      if (!initialized && mounted) {
        initialized = true;
        setLoading(false);
      }
    };

    const loadProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(name, permissions), departments(name)")
          .eq("user_id", userId)
          .single();

        if (!mounted) return;

        if (data) {
          const status = data.status as string;
          if (status === "pendente" || status === "inativo" || status === "bloqueado") {
            setIsPending(true);
            setProfile(null);
            // fire-and-forget to avoid blocking auth event processing
            supabase.auth.signOut();
            return;
          }

          setIsPending(false);
          setProfile(data);
        } else {
          setIsPending(false);
          setProfile(null);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("[Auth] Error fetching profile:", err);
        setProfile(null);
      }
    };

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // fire-and-forget to avoid deadlocks in auth callback
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setIsPending(false);
      }
    };

    // IMPORTANT: subscribe first, then restore session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      finishInit();
    });

    supabase.auth.getSession()
      .then(({ data: { session: restoredSession } }) => {
        applySession(restoredSession);
      })
      .catch((err) => {
        console.error("[Auth] Error restoring session:", err);
      })
      .finally(() => {
        finishInit();
      });

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
