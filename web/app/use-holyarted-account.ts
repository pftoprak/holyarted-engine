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

// Shown to the person, so they follow the page language. Server error texts
// are not passed through: they are English and may change.
const messages = {
  en: {
    signInFirst: 'Please continue with Google first.',
    signInUnavailable: 'Google sign-in is not available right now. Please try again later.',
    signInFailed: 'Google sign-in could not start. Please try again.',
    membershipRefresh: 'Your membership could not be refreshed.',
    checkout: 'Checkout could not start. Please try again later.',
    checkoutExisting: 'Manage your existing membership from the billing portal.',
    billing: 'Billing could not open. Please try again later.',
    tooMany: 'Too many requests. Please try again in a minute.',
    portraitOpen: 'Your portrait could not be opened.',
    portraitDelete: 'Your portrait could not be deleted.',
    portraitSave: 'Your portrait could not be saved.',
    export: 'Your data could not be exported.',
    accountDelete: 'Your account could not be deleted.',
  },
  tr: {
    signInFirst: 'Lütfen önce Google ile devam et.',
    signInUnavailable: 'Google ile giriş şu anda kullanılamıyor. Lütfen daha sonra tekrar dene.',
    signInFailed: 'Google ile giriş başlatılamadı. Lütfen tekrar dene.',
    membershipRefresh: 'Üyelik bilgin güncellenemedi.',
    checkout: 'Ödeme sayfası açılamadı. Lütfen daha sonra tekrar dene.',
    checkoutExisting: 'Mevcut üyeliğini ödeme yönetimi sayfasından yönet.',
    billing: 'Ödeme yönetimi açılamadı. Lütfen daha sonra tekrar dene.',
    tooMany: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar dene.',
    portraitOpen: 'Portren açılamadı.',
    portraitDelete: 'Portren silinemedi.',
    portraitSave: 'Portren kaydedilemedi.',
    export: 'Verilerin dışa aktarılamadı.',
    accountDelete: 'Hesabın silinemedi.',
  },
} as const;
type MessageKey = keyof (typeof messages)['en'];

export function useHolyartedAccount(authConfig: PublicAuthConfig | null, locale: 'en' | 'tr' = 'en') {
  const text = messages[locale];
  // The message for a failed request; rate limits get their own wording.
  const failure = useCallback((key: MessageKey, response?: Response) => new Error(response?.status === 429 ? text.tooMany : text[key]), [text]);
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
      if (!token) throw new Error(text.signInFirst);
      const headers = new Headers(init?.headers);
      headers.set('authorization', `Bearer ${token}`);
      headers.set('content-type', 'application/json');
      return fetch(path, {
        ...init,
        headers,
      });
    },
    [session?.access_token, text],
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
        setError(text.membershipRefresh);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshMembership, session?.access_token, text]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!client) {
      setError(text.signInUnavailable);
      return;
    }
    const { error: authError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (authError) setError(text.signInFailed);
  }, [client, text]);

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
        const payload = (await response.json()) as { url?: string };
        if (response.status === 409) throw new Error(text.checkoutExisting);
        if (!response.ok || !payload.url) throw failure('checkout', response);
        window.location.assign(payload.url);
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : text.checkout);
        setPending(false);
      }
    },
    [authorizedFetch, failure, session, signInWithGoogle, text],
  );

  const openBillingPortal = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const response = await authorizedFetch('/api/billing/portal', { method: 'POST' });
      const payload = (await response.json()) as { url?: string };
      if (!response.ok || !payload.url) throw failure('billing', response);
      window.location.assign(payload.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : text.billing);
      setPending(false);
    }
  }, [authorizedFetch, failure, text]);

  const loadPortrait = useCallback(async (): Promise<SavedPortrait | null> => {
    const response = await authorizedFetch('/api/portrait');
    if (!response.ok) throw failure('portraitOpen', response);
    const payload = (await response.json()) as { portrait?: SavedPortrait | null };
    return payload.portrait ?? null;
  }, [authorizedFetch, failure]);

  const deletePortrait = useCallback(async () => {
    const response = await authorizedFetch('/api/portrait', { method: 'DELETE' });
    if (!response.ok) throw failure('portraitDelete', response);
  }, [authorizedFetch, failure]);

  const exportAccountData = useCallback(async () => {
    const response = await authorizedFetch('/api/account/export');
    if (!response.ok) throw failure('export', response);
    return response.blob();
  }, [authorizedFetch, failure]);

  const deleteAccount = useCallback(async () => {
    const response = await authorizedFetch('/api/account', { method: 'DELETE' });
    if (!response.ok) throw failure('accountDelete', response);
    await client?.auth.signOut();
    setSession(null);
    setMembership({ plan: 'basic', status: 'active', currentPeriodEnd: null });
  }, [authorizedFetch, client, failure]);

  const savePortrait = useCallback(async (input: PortraitInput): Promise<SavedPortrait> => {
    const response = await authorizedFetch('/api/portrait', { method: 'PUT', body: JSON.stringify(input) });
    if (!response.ok) throw failure('portraitSave', response);
    const payload = (await response.json()) as { portrait?: SavedPortrait };
    if (!payload.portrait) throw failure('portraitSave');
    return payload.portrait;
  }, [authorizedFetch, failure]);

  return {
    user: accountUser(session),
    // Sent with requests for paid content, so the server can check the plan.
    accessToken: session?.access_token ?? null,
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
