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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        
        let isEstablishment = false;
        let isAdmin = false;
        let isDriver = false;

        if (user) {
          // Fetch user roles
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          if (roles) {
            isEstablishment = roles.some((r) => r.role === "establishment");
            isAdmin = roles.some((r) => r.role === "admin");
            isDriver = roles.some((r) => r.role === "driver");
          }
        }

        setAuthState({
          user,
          session,
          loading: false,
          isEstablishment,
          isAdmin,
          isDriver,
        });
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      
      let isEstablishment = false;
      let isAdmin = false;
      let isDriver = false;

      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (roles) {
          isEstablishment = roles.some((r) => r.role === "establishment");
          isAdmin = roles.some((r) => r.role === "admin");
          isDriver = roles.some((r) => r.role === "driver");
        }
      }

      setAuthState({
        user,
        session,
        loading: false,
        isEstablishment,
        isAdmin,
        isDriver,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, signOut };
};
