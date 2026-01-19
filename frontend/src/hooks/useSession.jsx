import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { api } from "../services/api";

export function useSession() {
  const [session, setSession] = useState(null);
  const [profileId, setProfileId] = useState(null); // user_profiles.id (int)
  const [loading, setLoading] = useState(true);

  async function linkProfile(sess) {
    if (!sess?.user?.email) {
      setProfileId(null);
      return;
    }

    try {
      // Your backend POST /user_profiles is idempotent (returns existing or creates new)
      const res = await api.post("/user_profiles", { email: sess.user.email });
      setProfileId(res.data?.id ?? null);
    } catch (e) {
      console.error("Failed to link profile:", e?.response?.data || e.message);
      setProfileId(null);
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;

      setSession(sess);
      await linkProfile(sess);
      setLoading(false);
    };

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      await linkProfile(sess);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user, profileId, loading };
}
