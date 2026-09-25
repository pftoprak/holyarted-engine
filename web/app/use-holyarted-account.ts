'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MembershipPlan } from '@/lib/membership-store';
import type { PortraitInput, SavedPortrait } from '@/lib/portrait-types';
import type { PublicAuthConfig } from '@/lib/runtime-config';

export type AccountUser = {
  id: string;
  email: string;
  displayName: string;
};

export type PublicMembership = {
  plan: MembershipPlan;
  status: string;
  currentPeriodEnd: number | null;
};

function accountUser(session: Session | null): AccountUser | null {
  const user = session?.user;
  if (!user?.email) return null;
  return {
    id: user.id,
    email: user.email,
    displayName:
      user.user_metadata?.full_name?.trim() ||
      user.user_metadata?.name?.trim() ||
      user.email.split('@')[0],
  };
}

export function useHolyartedAccount(authConfig: PublicAuthConfig | null) {
  const client = useMemo<SupabaseClient | null>(() => {
    if (!authConfig) return null;
    return createClient(authConfig.url, authConfig.publishableKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, [authConfig]);
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<PublicMembership>({
    plan: 'basic',
    status: 'active',
    currentPeriodEnd: null,
  });
  const [ready, setReady] = useState(() => !authConfig);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorizedFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = session?.access_token;
      if (!token) throw new Error('Please continue with Google first.');
      const headers = new Headers(init?.headers);
      headers.set('authorization', `Bearer ${token}`);
      headers.set('content-type', 'application/json');
      return fetch(path, {
        ...init,
        headers,
      });
    },
    [session?.access_token],
  );

  const refreshMembership = useCallback(async () => {
    if (!session?.access_token) {
      setMembership({ plan: 'basic', status: 'active', currentPeriodEnd: null });
      return;
    }
    const response = await authorizedFetch('/api/billing/status');
    if (response.ok) setMembership((await response.json()) as PublicMembership);
  }, [authorizedFetch, session?.access_token]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    }).catch(() => setReady(true));
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!session?.access_token) return;
    const timer = window.setTimeout(() => {
      void refreshMembership().catch(() => {
        setError('Your membership could not be refreshed.');
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMembership, session?.access_token]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!client) {
      setError('Google sign-in needs the project connection before it can open.');
      return;
    }
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (authError) setError(authError.message);
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    await client.auth.signOut();
    setMembership({ plan: 'basic', status: 'active', currentPeriodEnd: null });
  }, [client]);

  const startCheckout = useCallback(
    async (plan: 'plus' | 'premium') => {
      setError(null);
      if (!session) {
        await signInWithGoogle();
        return;
      }
      setPending(true);
      try {
        const response = await authorizedFetch('/api/billing/checkout', {
          method: 'POST',
          body: JSON.stringify({ plan }),
        });
        const payload = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !payload.url) throw new Error(payload.error || 'Checkout could not start.');
        window.location.assign(payload.url);
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not start.');
        setPending(false);
      }
    },
    [authorizedFetch, session, signInWithGoogle],
  );

  const openBillingPortal = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const response = await authorizedFetch('/api/billing/portal', { method: 'POST' });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Billing could not open.');
      window.location.assign(payload.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Billing could not open.');
      setPending(false);
    }
  }, [authorizedFetch]);

  const loadPortrait = useCallback(async (): Promise<SavedPortrait | null> => {
    const response = await authorizedFetch('/api/portrait');
    const payload = (await response.json()) as { portrait?: SavedPortrait | null; error?: string };
    if (!response.ok) throw new Error(payload.error || 'Your portrait could not be opened.');
    return payload.portrait ?? null;
  }, [authorizedFetch]);

  const deletePortrait = useCallback(async () => {
    const response = await authorizedFetch('/api/portrait', { method: 'DELETE' });
    if (!response.ok) throw new Error('Your portrait could not be deleted.');
  }, [authorizedFetch]);

  const exportAccountData = useCallback(async () => {
    const response = await authorizedFetch('/api/account/export');
    if (!response.ok) throw new Error('Your data could not be exported.');
    return response.blob();
  }, [authorizedFetch]);

  const deleteAccount = useCallback(async () => {
    const response = await authorizedFetch('/api/account', { method: 'DELETE' });
    if (!response.ok) throw new Error('Your account could not be deleted.');
    await client?.auth.signOut();
    setSession(null);
    setMembership({ plan: 'basic', status: 'active', currentPeriodEnd: null });
  }, [authorizedFetch, client]);

  const savePortrait = useCallback(async (input: PortraitInput): Promise<SavedPortrait> => {
    const response = await authorizedFetch('/api/portrait', { method: 'PUT', body: JSON.stringify(input) });
    const payload = (await response.json()) as { portrait?: SavedPortrait; error?: string };
    if (!response.ok || !payload.portrait) throw new Error(payload.error || 'Your portrait could not be saved.');
    return payload.portrait;
  }, [authorizedFetch]);

  return {
    user: accountUser(session),
    membership,
    ready,
    pending,
    error,
    setError,
    signInWithGoogle,
    signOut,
    startCheckout,
    openBillingPortal,
    refreshMembership,
    loadPortrait,
    savePortrait,
    deletePortrait,
    exportAccountData,
    deleteAccount,
  };
}
