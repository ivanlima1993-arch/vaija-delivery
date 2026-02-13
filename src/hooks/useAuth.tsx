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
  isDriverApproved: boolean;
  driverRejectionReason: string | null;
  driverRegistrationSubmittedAt: string | null;
  driverIdPhotoUrl: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isEstablishment: false,
    isAdmin: false,
    isDriver: false,
    isDriverApproved: false,
    driverRejectionReason: null,
    driverRegistrationSubmittedAt: null,
    driverIdPhotoUrl: null,
  });

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_driver_approved, driver_rejection_reason, driver_registration_submitted_at, driver_id_photo_url")
        .eq("user_id", userId)
        .maybeSingle();

      return {
        isEstablishment: roles?.some((r) => r.role === "establishment") ?? false,
        isAdmin: roles?.some((r) => r.role === "admin") ?? false,
        isDriver: roles?.some((r) => r.role === "driver") ?? false,
        isDriverApproved: profile?.is_driver_approved ?? false,
        driverRejectionReason: profile?.driver_rejection_reason ?? null,
        driverRegistrationSubmittedAt: profile?.driver_registration_submitted_at ?? null,
        driverIdPhotoUrl: profile?.driver_id_photo_url ?? null,
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
          isDriverApproved: false,
          driverRejectionReason: null,
          driverRegistrationSubmittedAt: null,
          driverIdPhotoUrl: null,
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
            isDriverApproved: false,
            driverRejectionReason: null,
            driverRegistrationSubmittedAt: null,
            driverIdPhotoUrl: null,
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
