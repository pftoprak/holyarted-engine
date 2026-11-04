'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { calculateDesign } from '@/lib/profile-engine';
import type { PortraitInput } from '@/lib/portrait-types';
import { planIncludes } from '@/lib/plans';
import type { PortraitChapters } from '@/lib/portrait-chapters';
import type { PublicAuthConfig } from '@/lib/runtime-config';
import { DetailedReading, type ReadingState, type Served } from './detailed-reading';
import { copy, type Locale } from './experience-copy';
import { useHolyartedAccount } from './use-holyarted-account';

type ExperienceProps = { accountsEnabled: boolean; purchasesEnabled: boolean; authConfig: PublicAuthConfig | null; sample: Record<Locale, PortraitChapters> };


// Form values are text here; a file field would read as empty.
function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function Experience({ accountsEnabled, purchasesEnabled, authConfig, sample }: ExperienceProps) {
  // Sign-in and purchase appear only when they can actually work: a site
  // without Supabase or payment keys runs as a free-only site.
  const signInAvailable = accountsEnabled && authConfig !== null;
  const [locale, setLocale] = useState<Locale>('en');
  const [complete, setComplete] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profile, setProfile] = useState(() => calculateDesign('Alex', 'Morgan', '1992-07-16'));
  const [portraitStatus, setPortraitStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [readingInput, setReadingInput] = useState<PortraitInput | null>(null);
  const [readingState, setReadingState] = useState<ReadingState>({ status: 'idle' });
  const restoredForUser = useRef<string | null>(null);
  const { user, accessToken, ready, membership, pending, error, setError, signInWithGoogle, signOut, startCheckout, openBillingPortal, loadPortrait, savePortrait } = useHolyartedAccount(authConfig, locale);
  const text = copy[locale];
  // The server decides the plan and sends only the chapters it includes.
  const served = readingState.status === 'ready' ? readingState : null;
  const servedChapters = served?.chapters[locale] ?? { cards: [], lenses: [] };
  // The preview shows the served cards, or the Basic sample before a reading.
  const previewCards = served ? servedChapters.cards : sample[locale].cards;
  const showsLockPanel = served !== null && !planIncludes(served.plan, 'plus');
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    if (!user || restoredForUser.current === user.id || new URLSearchParams(window.location.search).get('saved') !== '1') return;
    restoredForUser.current = user.id;
    void loadPortrait().then((saved) => {
      if (!saved) return;
      setFirstName(saved.firstName);
      setLastName(saved.lastName);
      setBirthDate(saved.birthDate);
      setProfile(saved.profile);
      setPortraitStatus('saved');
      setComplete(true);
      setReadingState({ status: 'loading' });
      setReadingInput({ firstName: saved.firstName, lastName: saved.lastName, birthDate: saved.birthDate });
      window.setTimeout(() => document.querySelector('#profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : text.portraitSaveFailed));
  }, [loadPortrait, setError, text.portraitSaveFailed, user]);
  useEffect(() => {
    if (!readingInput) return;
    const controller = new AbortController();
    if (!ready) return;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
    void fetch('/api/reading', { method: 'POST', headers, body: JSON.stringify(readingInput), signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as Partial<Served>;
        if (!response.ok || !payload.reading || !payload.chapters || !payload.plan) throw new Error('reading_failed');
        setReadingState({ status: 'ready', plan: payload.plan, chapters: payload.chapters, reading: payload.reading });
      })
      .catch(() => { if (!controller.signal.aborted) setReadingState({ status: 'error' }); });
    return () => controller.abort();
  }, [readingInput, ready, accessToken, membership.plan]);
  function requestReading(input: PortraitInput) {
    setReadingState({ status: 'loading' });
    // A fresh object re-runs the request, also for "try again" with the same input.
    setReadingInput({ firstName: input.firstName, lastName: input.lastName, birthDate: input.birthDate });
  }
  function begin() { document.querySelector('#assessment')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function calculate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      firstName: formText(form, 'firstName'),
      lastName: formText(form, 'lastName'),
      birthDate: formText(form, 'birthDate'),
    };
    try {
      const nextProfile = calculateDesign(input.firstName, input.lastName, input.birthDate);
      setFirstName(input.firstName);
      setLastName(input.lastName);
      setBirthDate(input.birthDate);
      setProfile(nextProfile);
      setError(null);
    } catch {
      setError(text.invalidProfile);
      // Do not leave the previous person's portrait under the error.
      setComplete(false);
      setReadingInput(null);
      setReadingState({ status: 'idle' });
      return;
    }
    setComplete(false);
    setIsCalculating(true);
    requestReading(input);
    setPortraitStatus(user ? 'saving' : 'idle');
    if (user) {
      void savePortrait(input).then((saved) => {
        setProfile(saved.profile);
        setPortraitStatus('saved');
      }).catch(() => {
        setPortraitStatus('idle');
        setError(text.portraitSaveFailed);
      });
    }
    window.setTimeout(() => {
      setIsCalculating(false);
      setComplete(true);
      window.setTimeout(() => document.querySelector('#profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }, 1350);
  }

  return (
    <main onPointerMove={(event) => { event.currentTarget.style.setProperty('--pointer-x', `${event.clientX}px`); event.currentTarget.style.setProperty('--pointer-y', `${event.clientY}px`); }} className="premium-canvas min-h-screen overflow-clip bg-[#f7f3ec] text-[#514b46]">
      {error && <div role="alert" className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#9b5e55]/20 bg-[#fbf8f2] px-4 py-3 text-sm shadow-[0_16px_45px_rgba(81,75,70,.18)]"><span className="flex-1">{error}</span><button onClick={() => setError(null)} aria-label="Dismiss"><X className="size-4" /></button></div>}
      <nav className="relative z-50 border-b border-[#625b55]/10 bg-[#f7f3ec]/95 px-5 text-[#514b46] backdrop-blur-md md:px-10">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Holyarted home"><span className="grid size-9 place-items-center border border-[#a7826c]/55 font-heading text-base text-[#7d695d]">H</span><span className="font-heading text-sm tracking-[0.24em]">HOLYARTED</span></a>
          <div className="hidden items-center gap-8 lg:flex"><a href="#assessment" className="nav-link">{text.nav[0]}</a><a href="#profile" className="nav-link">{text.nav[1]}</a>{purchasesEnabled ? <a href="#membership" className="nav-link">{text.nav[2]}</a> : <a href="#reading" className="nav-link">{text.readingNav}</a>}<a href="#method" className="nav-link">{text.nav[3]}</a><div className="flex items-center border-l border-[#625b55]/15 pl-5 text-[11px] font-bold tracking-[0.12em]"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#8f705e]' : 'text-[#514b46]/45'}>EN</button><span className="mx-2 text-[#514b46]/20">/</span><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#8f705e]' : 'text-[#514b46]/45'}>TR</button></div>{signInAvailable && (user ? <a href="/profile" className="inline-flex h-10 items-center gap-2 border border-[#625b55]/25 px-5 text-xs font-bold transition hover:border-[#8f705e] hover:text-[#8f705e]"><UserRound className="size-4" />{text.account}</a> : <button onClick={signInWithGoogle} className="inline-flex h-10 items-center gap-2 border border-[#625b55]/25 px-5 text-xs font-bold transition hover:border-[#8f705e] hover:text-[#8f705e]"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46] shadow-sm">G</span>{text.signIn}</button>)}</div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center border border-[#625b55]/20 lg:hidden" aria-label={text.menu}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        {menuOpen && <div className="border-t border-[#625b55]/10 pb-6 pt-4 lg:hidden"><div className="mx-auto grid max-w-[1400px] gap-4 text-sm"><a href="#assessment" onClick={() => setMenuOpen(false)}>{text.nav[0]}</a><a href="#profile" onClick={() => setMenuOpen(false)}>{text.nav[1]}</a>{purchasesEnabled ? <a href="#membership" onClick={() => setMenuOpen(false)}>{text.nav[2]}</a> : <a href="#reading" onClick={() => setMenuOpen(false)}>{text.readingNav}</a>}<a href="#method" onClick={() => setMenuOpen(false)}>{text.nav[3]}</a><div className="flex gap-4"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#8f705e]' : ''}>EN</button><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#8f705e]' : ''}>TR</button></div>{signInAvailable && (user ? <a href="/profile">{text.account}</a> : <button className="text-left" onClick={signInWithGoogle}>{text.signIn}</button>)}</div></div>}
      </nav>

      <section id="top" className="hero-stage relative bg-[#dfe5db] px-5 pb-20 pt-14 text-[#514b46] md:px-10 md:pb-28 md:pt-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a7826c]/45 to-transparent" />
        <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
        <div className="mx-auto grid max-w-[1400px] gap-14 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow reveal-up text-[#8f705e]">{text.edition}</p>
            <h1 className="mt-7 font-heading text-[clamp(4rem,8.2vw,8.1rem)] font-medium leading-[0.84] tracking-[-0.062em]">
              <span className="word-reveal block">{text.titleA}</span><span className="word-reveal word-reveal-delay block italic text-[#8f705e]">{text.titleB}</span>
            </h1>
            <p className="mt-9 max-w-2xl text-base leading-7 text-[#514b46]/62 md:text-xl md:leading-8">{text.intro}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row"><button onClick={begin} className="premium-button">{text.start}<ArrowRight className="size-4" /></button><a href="#preview" className="secondary-button">{text.sample}</a></div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#625b55]/10 pt-6">{text.trust.map((item) => <span key={item} className="inline-flex items-center gap-2 text-xs text-[#514b46]/58"><Check className="size-3.5 text-[#8f705e]" />{item}</span>)}</div>
          </div>
          <div id="assessment" className="interactive-panel relative scroll-mt-28 overflow-hidden border border-[#625b55]/14 bg-[#fbf8f2]/94 shadow-[0_36px_90px_rgba(98,91,85,.14)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-[#625b55]/10 px-6 py-5 md:px-8"><p className="text-[10px] font-bold tracking-[0.18em] text-[#8f705e]">{text.panelLabel}</p><ShieldCheck className="size-4 text-[#514b46]/35" /></div>
            <form onSubmit={calculate} className="relative p-6 md:p-9">
              <h2 className="max-w-xl font-heading text-3xl leading-tight md:text-4xl">{text.panelTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#514b46]/55">{text.panelCopy}</p>
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#514b46]/42"><span>{text.progress}</span><span>{text.inputLabel}</span></div>
                <div className="h-px bg-[#625b55]/10"><div className="h-px w-full bg-[#a7826c]" /></div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-bold text-[#514b46]/70">{text.firstName}<input name="firstName" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder={text.firstPlaceholder} autoComplete="given-name" className="h-14 border border-[#625b55]/16 bg-white/45 px-4 text-base font-normal text-[#514b46] outline-none transition placeholder:text-[#514b46]/28 focus:border-[#a7826c]" required /></label>
                  <label className="grid gap-2 text-xs font-bold text-[#514b46]/70">{text.lastName}<input name="lastName" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={text.lastPlaceholder} autoComplete="family-name" className="h-14 border border-[#625b55]/16 bg-white/45 px-4 text-base font-normal text-[#514b46] outline-none transition placeholder:text-[#514b46]/28 focus:border-[#a7826c]" required /></label>
                  <label className="grid gap-2 text-xs font-bold text-[#514b46]/70 sm:col-span-2">{text.birthDate}<input name="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className="h-14 border border-[#625b55]/16 bg-white/45 px-4 text-base font-normal text-[#514b46] outline-none transition focus:border-[#a7826c]" required /></label>
                </div>
                <div className="mt-7 flex flex-col items-start justify-between gap-5 border-t border-[#625b55]/10 pt-6 sm:flex-row sm:items-center"><p className="max-w-sm text-[11px] leading-5 text-[#514b46]/42">{text.inputNote}</p><button type="submit" disabled={isCalculating} className="premium-button magnetic-button h-12 shrink-0 px-5 disabled:cursor-wait">{text.finish}<ArrowRight className="size-4" /></button></div>
              </div>
            </form>
            {isCalculating && <div className="calculation-overlay absolute inset-0 z-20 grid place-items-center bg-[#f7f3ec]/96 p-8 text-center" aria-live="polite"><div className="w-full max-w-md"><div className="mx-auto grid size-20 place-items-center border border-[#a7826c]/38"><span className="calculation-monogram font-heading text-4xl text-[#8f705e]">H</span></div><p className="mt-8 font-heading text-4xl text-[#514b46]">{text.calculating}</p><p className="mt-3 text-sm text-[#514b46]/45">{text.calculatingNote}</p><div className="mt-9 h-px overflow-hidden bg-[#625b55]/10"><div className="calculation-scan h-px bg-[#a7826c]" /></div></div></div>}
          </div>
        </div>
      </section>

      <div className="marquee-shell border-y border-[#625b55]/12 bg-[#e8ded0] py-4"><div className="marquee-track text-[10px] font-bold uppercase tracking-[0.28em] text-[#625b55]"><span>{locale === 'en' ? 'SELF KNOWLEDGE · DECISION STYLE · CHARACTER · RELATIONSHIPS · PURPOSE · ' : 'ÖZ FARKINDALIK · KARAR BİÇİMİ · KARAKTER · İLİŞKİLER · AMAÇ · '}</span><span aria-hidden="true">{locale === 'en' ? 'SELF KNOWLEDGE · DECISION STYLE · CHARACTER · RELATIONSHIPS · PURPOSE · ' : 'ÖZ FARKINDALIK · KARAR BİÇİMİ · KARAKTER · İLİŞKİLER · AMAÇ · '}</span></div></div>

      <section id="preview" className="view-reveal px-5 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"><div className="lg:sticky lg:top-28"><p className="eyebrow text-[#8f705e]">{text.previewLabel}</p><h2 className="mt-5 max-w-lg font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.previewTitle}</h2><p className="mt-6 max-w-md leading-7 text-[#514b46]/60">{text.previewCopy}</p><div className="image-lift mt-9 overflow-hidden border border-[#625b55]/12"><Image src="/og.png" width={1200} height={630} alt="Holyarted editorial identity" className="w-full transition duration-700 hover:scale-[1.025]" /></div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/38">{text.focusHint}</p><div className="grid border-t border-[#625b55]/18">{text.sections.map((label, index) => <button type="button" onClick={() => setActiveCard(activeCard === index ? null : index)} key={label} className={`insight-row grid gap-3 border-b border-[#625b55]/14 py-8 text-left sm:grid-cols-[9rem_1fr] sm:gap-8 ${activeCard === index ? 'is-active' : ''}`}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{label}</p><div>{previewCards[index] ? <><h3 className="font-heading text-3xl">{previewCards[index][0]}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#514b46]/58">{previewCards[index][1]}</p></> : <p className="flex items-center gap-2 text-sm italic text-[#514b46]/58"><LockKeyhole className="size-4" />{text.readingLocked(text.readingTiers.plus)}</p>}<span className="insight-line mt-6 block h-px w-0 bg-[#a7826c]" /></div></button>)}</div></div></div></section>

      <section id="profile" className="scroll-mt-20 bg-[#dcc4b8] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          {complete ? <div>
            <div className="grid gap-10 border-b border-[#625b55]/22 pb-14 lg:grid-cols-[0.65fr_1.35fr]">
              <div><p className="eyebrow">{text.profileLabel}</p><p className="mt-4 text-xs text-[#514b46]/55">{text.profileFor}</p><p className="mt-2 font-heading text-2xl">{profile.fullName}</p>{user && portraitStatus !== 'idle' && <p className="mt-4 text-xs font-bold text-[#514b46]/52">{portraitStatus === 'saving' ? text.portraitSaving : text.portraitSaved}</p>}</div>
              <div><h2 className="font-heading text-6xl leading-[0.9] tracking-[-0.05em] md:text-8xl">{text.profileNames[profile.purpose]}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-[#514b46]/70">{text.profileIntros[profile.purpose]}</p></div>
            </div>
            {readingState.status === 'loading' && <p className="mt-8 text-sm text-[#514b46]/60" aria-live="polite">{text.portraitLoading}</p>}{readingState.status === 'error' && <div role="alert" className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[#514b46]/70"><span>{text.portraitError}</span><button onClick={() => readingInput && requestReading(readingInput)} className="text-xs font-bold uppercase tracking-[0.14em] underline underline-offset-4">{text.readingRetry}</button></div>}<div className="grid md:grid-cols-2">{servedChapters.cards.map(([title, body], index) => <article key={title} className={`profile-result-card min-h-72 border-b border-[#625b55]/18 py-9 md:p-9 ${index % 2 === 0 ? 'md:border-r' : ''}`} style={{ animationDelay: `${index * 110}ms` }}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/55">{text.sections[index]}</p><h3 className="mt-10 font-heading text-4xl">{title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[#514b46]/68">{body}</p></article>)}</div>
            {showsLockPanel && <div className="mt-8 grid items-center gap-7 rounded-[2rem] border border-[#625b55]/18 bg-[#f7f3ec]/45 p-7 md:grid-cols-[1fr_auto] md:p-10"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f705e]"><LockKeyhole className="size-4" />Plus & Premium</div><h3 className="mt-4 font-heading text-4xl">{text.lockedTitle}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#514b46]/62">{text.lockedCopy}</p></div>{purchasesEnabled ? <button onClick={() => document.querySelector('#membership')?.scrollIntoView({ behavior: 'smooth' })} className="premium-button">{text.nav[2]}<ArrowRight className="size-4" /></button> : <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f705e]">{text.comingSoon}</p>}</div>}
            {servedChapters.lenses.length > 0 && <div className="mt-8 grid gap-4 md:grid-cols-2">{servedChapters.lenses.map(([title, body], index) => <article key={title} className="rounded-[2rem] bg-[#f7f3ec]/55 p-7 md:p-9"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{text.extendedSections[index]}</p><h3 className="mt-8 font-heading text-4xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[#514b46]/68">{body}</p></article>)}</div>}
            <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-[#625b55]/22 pt-8 sm:flex-row sm:items-center"><button onClick={() => { setComplete(false); begin(); }} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"><ArrowLeft className="size-4" />{text.restart}</button>{signInAvailable && (user ? <a href="/profile" className="inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">{text.saveIn}<ArrowRight className="size-4" /></a> : <button onClick={signInWithGoogle} className="inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46]">G</span>{text.saveOut}</button>)}</div>
            <DetailedReading text={text} locale={locale} state={readingState} onRetry={() => readingInput && requestReading(readingInput)} />
          </div> : <div id={purchasesEnabled ? undefined : 'reading'} className="grid scroll-mt-24 items-end gap-10 lg:grid-cols-2"><div><p className="eyebrow">{text.profileLabel}</p><h2 className="mt-6 font-heading text-6xl leading-[0.9] tracking-[-0.045em] md:text-8xl">{text.profileNames[profile.purpose]}</h2></div><div className="max-w-xl lg:justify-self-end"><p className="text-lg leading-8 text-[#514b46]/70">{text.profileIntros[profile.purpose]}</p><button onClick={begin} className="mt-8 inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">{text.start}<ArrowRight className="size-4" /></button></div></div>}
        </div>
      </section>

      {signInAvailable && <section className="bg-[#bfc8ba] px-5 py-20 text-[#514b46] md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="eyebrow text-[#7d695d]">{text.savePrompt}</p><h2 className="mt-5 max-w-3xl font-heading text-5xl leading-[0.95] md:text-7xl">{user ? `${text.account}: ${user.displayName}` : text.savePrompt}</h2><p className="mt-6 max-w-xl leading-7 text-[#514b46]/58">{text.saveCopy}</p></div>{user ? <a href="/profile" className="premium-button lg:justify-self-end">{text.saveIn}<ArrowRight className="size-4" /></a> : <button onClick={signInWithGoogle} className="premium-button lg:justify-self-end"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46]">G</span>{text.saveOut}</button>}</div></section>}

      {purchasesEnabled && <section id="membership" className="scroll-mt-20 bg-[#f7f3ec] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="eyebrow text-[#8f705e]">{text.membershipLabel}</p><h2 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.membershipTitle}</h2></div><p className="max-w-xl text-base leading-8 text-[#514b46]/60 lg:justify-self-end">{text.membershipCopy}</p></div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">{text.plans.map((plan, index) => { const isCurrent = membership.plan === plan.id; return <article key={plan.id} className={`relative flex min-h-[34rem] flex-col rounded-[2rem] border p-7 md:p-9 ${index === 1 ? 'border-[#625b55] bg-[#625b55] text-[#f7f3ec] shadow-[0_28px_80px_rgba(98,91,85,.2)]' : 'border-[#625b55]/14 bg-[#fbf8f2]'}`}>{index === 1 && <span className="absolute right-6 top-6 rounded-full bg-[#dcc4b8] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-[#514b46]">{text.popular}</span>}<p className={`text-xs font-bold uppercase tracking-[0.16em] ${index === 1 ? 'text-[#dcc4b8]' : 'text-[#8f705e]'}`}>{plan.name}</p><div className="mt-8 flex items-end gap-2"><span className="font-heading text-6xl">{plan.price}</span><span className={`pb-2 text-xs ${index === 1 ? 'text-[#f7f3ec]/55' : 'text-[#514b46]/45'}`}>{plan.cadence}</span></div><p className={`mt-5 min-h-14 text-sm leading-6 ${index === 1 ? 'text-[#f7f3ec]/65' : 'text-[#514b46]/58'}`}>{plan.description}</p><div className={`my-7 h-px ${index === 1 ? 'bg-[#f7f3ec]/14' : 'bg-[#625b55]/12'}`} /><ul className="grid gap-4">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm"><Check className={`size-4 ${index === 1 ? 'text-[#dcc4b8]' : 'text-[#8f705e]'}`} />{feature}</li>)}</ul><div className="mt-auto pt-9">{isCurrent ? <div className={`flex h-13 items-center justify-center gap-2 rounded-2xl border text-xs font-bold ${index === 1 ? 'border-[#f7f3ec]/25' : 'border-[#625b55]/18'}`}><ShieldCheck className="size-4" />{text.currentPlan}</div> : plan.id === 'basic' ? <button onClick={user ? () => window.location.assign('/profile') : signInWithGoogle} className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold ${index === 1 ? 'bg-[#f7f3ec] text-[#514b46]' : 'bg-[#625b55] text-[#f7f3ec]'}`}>{plan.cta}<ArrowRight className="size-4" /></button> : <button disabled={pending} onClick={membership.plan === 'basic' ? () => startCheckout(plan.id) : openBillingPortal} className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold disabled:opacity-50 ${index === 1 ? 'bg-[#f7f3ec] text-[#514b46]' : 'bg-[#625b55] text-[#f7f3ec]'}`}><CreditCard className="size-4" />{plan.cta}</button>}</div></article> })}</div>
          {user && membership.plan !== 'basic' && <div className="mt-8 flex justify-end"><button disabled={pending} onClick={openBillingPortal} className="inline-flex items-center gap-2 text-xs font-bold text-[#514b46]/65 hover:text-[#514b46]"><CreditCard className="size-4" />{text.manageBilling}</button></div>}
        </div>
      </section>}

      <section id="method" className="px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]"><p className="eyebrow text-[#8f705e]">{text.methodLabel}</p><h2 className="mt-5 max-w-4xl font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.methodTitle}</h2><div className="mt-14 grid border-y border-[#625b55]/18 md:grid-cols-3">{text.principles.map(([title, body], index) => <article key={title} className={`py-8 md:min-h-64 md:p-8 ${index < 2 ? 'border-b border-[#625b55]/14 md:border-b-0 md:border-r' : ''}`}><span className="block h-px w-12 bg-[#a7826c]" aria-hidden="true" /><h3 className="mt-12 font-heading text-3xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[#514b46]/58">{body}</p></article>)}</div><p className="mt-8 max-w-3xl text-xs leading-6 text-[#514b46]/45">{text.disclaimer}</p></div></section>

      <footer className="border-t border-[#625b55]/12 px-5 py-8 md:px-10"><div className="mx-auto flex max-w-[1400px] flex-col gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#514b46]/50 sm:flex-row sm:items-center sm:justify-between"><span>© HOLYARTED</span><div className="flex flex-wrap gap-5"><a href="/privacy" className="hover:text-[#514b46]">Privacy</a><a href="/terms" className="hover:text-[#514b46]">Terms</a><a href="/kvkk" className="hover:text-[#514b46]">KVKK</a><a href="mailto:support@holyarted.com" className="hover:text-[#514b46]">Support</a></div><span>{text.footer}</span>{user && <button onClick={signOut} className="inline-flex items-center gap-2 hover:text-[#514b46]"><LogOut className="size-3.5" />{text.signOut}</button>}</div></footer>
    </main>
  );
}
