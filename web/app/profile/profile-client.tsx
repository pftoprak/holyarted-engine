'use client';

import { ArrowLeft, ArrowRight, Check, CreditCard, LogOut, Mail, UserRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SavedPortrait } from '@/lib/portrait-types';
import type { PublicAuthConfig } from '@/lib/runtime-config';
import { useHolyartedAccount } from '../use-holyarted-account';
import { AccountDataControls } from './account-data-controls';

type Locale = 'en' | 'tr';

const accountCopy = {
  en: {
    back: 'Back to portrait', personal: 'Personal space', connected: 'Connected securely with your Google account. Holyarted never stores a separate password.', welcome: 'Welcome', email: 'Signed-in email', plan: 'Membership', basic: 'Basic', plus: 'Plus', premium: 'Premium', open: 'Open portrait', billing: 'Manage billing', signOut: 'Sign out', signInTitle: 'Your private space is ready.', signInCopy: 'Continue with your Google account to save your membership and return to your portrait.', signIn: 'Continue with Google', confirmed: 'Your payment was received. Membership access may take a few moments to refresh.', refresh: 'Refresh membership', loading: 'Opening your private space…', savedLabel: 'Saved portrait', savedEmpty: 'Create your first portrait and it will stay here for your next visit.', savedReady: 'Ready whenever you want to return.', savedError: 'Your saved portrait is temporarily unavailable.', savedNames: { build: 'The Intentional Builder', guide: 'The Grounded Guide', create: 'The Original Maker', connect: 'The Human Connector' },
  },
  tr: {
    back: 'Portreye dön', personal: 'Kişisel alan', connected: 'Google hesabınla güvenli biçimde bağlı. Holyarted ayrı bir parola saklamaz.', welcome: 'Hoş geldin', email: 'Giriş yapılan e-posta', plan: 'Üyelik', basic: 'Basic', plus: 'Plus', premium: 'Premium', open: 'Portreyi aç', billing: 'Ödemeyi yönet', signOut: 'Çıkış yap', signInTitle: 'Kişisel alanın hazır.', signInCopy: 'Üyeliğini kaydetmek ve portrene geri dönmek için Google hesabınla devam et.', signIn: 'Google ile devam et', confirmed: 'Ödemen alındı. Üyelik erişiminin yenilenmesi birkaç dakika sürebilir.', refresh: 'Üyeliği yenile', loading: 'Kişisel alanın açılıyor…', savedLabel: 'Kayıtlı portre', savedEmpty: 'İlk portreni oluşturduğunda sonraki ziyaretin için burada kalacak.', savedReady: 'Dilediğinde yeniden açmaya hazır.', savedError: 'Kayıtlı portren şu anda açılamıyor.', savedNames: { build: 'Niyetli Kurucu', guide: 'Sağlam Rehber', create: 'Özgün Üretici', connect: 'İnsanları Buluşturan' },
  },
} as const;

export function ProfileClient({ authConfig }: { authConfig: PublicAuthConfig | null }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [savedPortrait, setSavedPortrait] = useState<SavedPortrait | null>(null);
  const [portraitError, setPortraitError] = useState(false);
  const { user, membership, ready, pending, error, signInWithGoogle, signOut, openBillingPortal, refreshMembership, loadPortrait, deletePortrait, exportAccountData, deleteAccount } = useHolyartedAccount(authConfig);
  const text = accountCopy[locale];
  const checkoutConfirmed = useSearchParams().get('checkout') === 'success';
  const userId = user?.id;

  useEffect(() => {
    if (!checkoutConfirmed || !user) return;
    const timer = window.setTimeout(() => refreshMembership(), 1800);
    return () => window.clearTimeout(timer);
  }, [checkoutConfirmed, refreshMembership, user]);

  useEffect(() => {
    if (!userId) {
      setSavedPortrait(null);
      setPortraitError(false);
      return;
    }
    void loadPortrait().then((portrait) => {
      setSavedPortrait(portrait);
      setPortraitError(false);
    }).catch(() => setPortraitError(true));
  }, [loadPortrait, userId]);

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#dfe5db] text-sm text-[#514b46]/55">{text.loading}</main>;

  return (
    <main className="min-h-screen bg-[#dfe5db] px-5 py-8 text-[#514b46] md:px-10 md:py-14">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-[#625b55]/14 bg-[#fbf8f2] shadow-[0_36px_100px_rgba(98,91,85,.16)]">
        <div className="flex items-center justify-between border-b border-[#625b55]/10 p-6 md:p-8"><a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#514b46]/55 transition hover:text-[#8f705e]"><ArrowLeft className="size-4" />{text.back}</a><div className="flex items-center gap-3"><button onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')} className="rounded-full border border-[#625b55]/15 px-3 py-2 text-[10px] font-bold">{locale === 'en' ? 'TR' : 'EN'}</button><span className="grid size-10 place-items-center rounded-full border border-[#a7826c]/40 font-heading text-xl text-[#7d695d]">H</span></div></div>
        {!user ? <div className="grid min-h-[34rem] place-items-center px-6 py-14 text-center"><div className="max-w-xl"><div className="mx-auto grid size-20 place-items-center rounded-full bg-[#dcc4b8] text-[#514b46]"><UserRound className="size-8" /></div><h1 className="mt-8 font-heading text-5xl leading-[0.95] md:text-7xl">{text.signInTitle}</h1><p className="mx-auto mt-6 max-w-lg text-base leading-7 text-[#514b46]/58">{text.signInCopy}</p><button onClick={signInWithGoogle} className="mx-auto mt-9 inline-flex h-14 items-center gap-3 rounded-2xl bg-[#625b55] px-7 text-xs font-bold text-[#f7f3ec]"><span className="grid size-6 place-items-center rounded-full bg-white text-xs font-black text-[#514b46]">G</span>{text.signIn}<ArrowRight className="size-4" /></button>{error && <p className="mt-5 text-sm text-[#9b5e55]">{error}</p>}</div></div> : <div className="grid md:grid-cols-[0.72fr_1.28fr]"><div className="border-b border-[#625b55]/10 bg-[#e8ded0]/55 p-7 md:border-b-0 md:border-r md:p-10"><div className="grid size-20 place-items-center rounded-full bg-[#dcc4b8] text-[#514b46]"><UserRound className="size-8" /></div><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8f705e]">{text.personal}</p><p className="mt-3 text-sm leading-6 text-[#514b46]/52">{text.connected}</p><div className="mt-8 flex items-center gap-2 rounded-2xl bg-[#fbf8f2]/75 px-4 py-3 text-xs font-bold"><Check className="size-4 text-[#8f705e]" />Google</div></div><div className="p-7 md:p-10 lg:p-14">{checkoutConfirmed && <div className="mb-8 rounded-2xl border border-[#8f705e]/20 bg-[#dcc4b8]/30 p-4 text-sm leading-6">{text.confirmed}</div>}<h1 className="font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.welcome},<br /><span className="italic text-[#8f705e]">{user.displayName}.</span></h1><div className="mt-10 grid gap-4 border-y border-[#625b55]/10 py-6 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/38">{text.email}</p><p className="mt-3 flex items-center gap-2 break-all text-sm text-[#514b46]/72"><Mail className="size-4 shrink-0 text-[#8f705e]" />{user.email}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/38">{text.plan}</p><p className="mt-3 font-heading text-2xl capitalize">{text[membership.plan]}</p></div></div><div className="mt-7 rounded-[1.5rem] border border-[#625b55]/12 bg-[#e8ded0]/42 p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{text.savedLabel}</p>{portraitError ? <p className="mt-4 text-sm text-[#9b5e55]">{text.savedError}</p> : savedPortrait ? <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-heading text-3xl">{text.savedNames[savedPortrait.profile.purpose]}</h2><p className="mt-2 text-sm text-[#514b46]/58">{savedPortrait.profile.fullName} · {text.savedReady}</p></div><a href="/?saved=1#profile" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#625b55] px-5 text-xs font-bold text-[#f7f3ec]">{text.open}<ArrowRight className="size-4" /></a></div> : <p className="mt-4 text-sm leading-6 text-[#514b46]/58">{text.savedEmpty}</p>}</div>{error && <p className="mt-5 text-sm text-[#9b5e55]">{error}</p>}<div className="mt-9 flex flex-col gap-3 sm:flex-row">{!savedPortrait && <a href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">{text.open}<ArrowRight className="size-4" /></a>}{membership.plan !== 'basic' && <button disabled={pending} onClick={openBillingPortal} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#625b55]/22 px-6 text-xs font-bold text-[#514b46]/68"><CreditCard className="size-4" />{text.billing}</button>}<button onClick={signOut} className="inline-flex h-12 items-center justify-center gap-2 px-4 text-xs font-bold text-[#514b46]/55"><LogOut className="size-4" />{text.signOut}</button></div>{checkoutConfirmed && <button onClick={refreshMembership} className="mt-5 text-xs font-bold text-[#8f705e]">{text.refresh}</button>}</div></div>}
        {user && <AccountDataControls locale={locale} hasPortrait={!!savedPortrait} onExport={exportAccountData} onDelete={async () => { await deletePortrait(); setSavedPortrait(null); }} onDeleteAccount={deleteAccount} />}
      </section>
    </main>
  );
}
