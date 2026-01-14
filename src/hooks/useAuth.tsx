import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isEstablishment: boolean;
  isAdmin: boolean;
  isDriver: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isEstablishment: false,
    isAdmin: false,
    isDriver: false,
  });

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      return {
        isEstablishment: roles?.some((r) => r.role === "establishment") ?? false,
        isAdmin: roles?.some((r) => r.role === "admin") ?? false,
        isDriver: roles?.some((r) => r.role === "driver") ?? false,
      };
    };

    // Get initial session first
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (user) {
        const roles = await fetchRoles(user.id);
        setAuthState({
          user,
          session,
          loading: false,
          ...roles,
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isEstablishment: false,
          isAdmin: false,
          isDriver: false,
        });
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;

        if (user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const roles = await fetchRoles(user.id);
            setAuthState({
              user,
              session,
              loading: false,
              ...roles,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isEstablishment: false,
            isAdmin: false,
            isDriver: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, signOut };
};
