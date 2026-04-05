import { useState, useEffect } from "react";
import { getCurrentUser, supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null); 
  const [loading, setLoading] = useState(true);

  const refreshFullUserData = async () => {
    const fullData = await getCurrentUser();
    if (fullData) setUser(fullData);
  };

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        refreshFullUserData();
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession); 

      if (currentSession?.user) {
        setUser(currentSession.user);

        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          refreshFullUserData();
        }
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, refreshFullUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};
