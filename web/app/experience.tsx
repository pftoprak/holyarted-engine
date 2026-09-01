'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Cloud,
  Focus,
  LogIn,
  LogOut,
  Pause,
  ShieldCheck,
  UserRound,
  Waves,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Locale = 'en' | 'tr';
type Goal = 'space' | 'focus' | 'slow' | 'boundary';
type MindState = 'busy' | 'restless' | 'tired' | 'steady';

type ExperienceProps = {
  user: { displayName: string; email: string } | null;
  signInPath: string;
  signOutPath: string;
};

const ui = {
  en: {
    navCheckIn: 'Check in', navGuide: 'Your guide', navApproach: 'Our approach',
    signIn: 'Sign in', account: 'My account', signOut: 'Sign out',
    kicker: 'A quieter way to check in', title: 'Make room for what matters.',
    subtitle: 'A private, low-pressure space to notice what you need and choose one small next step.',
    formTitle: 'How are you arriving today?', formCopy: 'There are no right answers. Choose what feels closest.',
    nameLabel: 'What should we call you?', namePlaceholder: 'Your name',
    goalLabel: 'What would help most right now?', stateLabel: 'How does your mind feel?', submit: 'Build my guide',
    goals: { space: 'Clear my head', focus: 'Find focus', slow: 'Slow down', boundary: 'Set a boundary' },
    states: { busy: 'Busy', restless: 'Restless', tired: 'Tired', steady: 'Steady' },
    resultKicker: 'Your check-in', resultTitle: 'A gentler plan for today.', resultCopy: 'Use what helps, leave what does not. This is a practical reflection—not a label or a diagnosis.',
    start: 'Start here', remember: 'Keep in mind', practice: 'Try this now',
    goalsContent: {
      space: ['Reduce the incoming noise', 'Your attention may need fewer open loops, not more effort.', 'Close one tab, silence one alert, and write down the one thing you do not want to forget.'],
      focus: ['Choose one clear finish line', 'Focus gets easier when the next action is visible and small.', 'Pick one task that can be completed in a short block. Let everything else wait outside that block.'],
      slow: ['Lower the pace on purpose', 'A slower moment can make the rest of the day feel more workable.', 'Give yourself a transition with no input: stretch, make tea, or look outside before moving on.'],
      boundary: ['Protect a little room', 'A useful boundary can be quiet, specific, and kind.', 'Decide what is not available today, then communicate it in one clear sentence without over-explaining.'],
    },
    statesContent: {
      busy: ['Your mind is carrying a lot', 'Trying to hold everything at once can make each task feel equally urgent.', 'Put every loose thought on paper. Circle only the item that truly needs your attention next.'],
      restless: ['Your attention wants movement', 'Restlessness is often easier to work with than to argue against.', 'Stand up, change rooms, or take a brief walk. Return when your body feels more settled.'],
      tired: ['Make the plan smaller', 'When capacity is low, a reduced plan is a smart adjustment—not a failure.', 'Choose the minimum useful version of today’s task and give yourself permission to stop there.'],
      steady: ['Use the steadiness you have', 'A settled moment is a good time to make one thoughtful choice.', 'Choose a meaningful task, protect a clean block for it, and finish before adding something new.'],
    },
    approachKicker: 'Built for real life', approachTitle: 'Reflection without labels, pressure, or prediction.',
    principles: [
      ['Led by your answers', 'Your guide responds to what you share today. It does not claim to define who you are.'],
      ['Small enough to use', 'Every suggestion is designed to fit into an ordinary day, even when time is limited.'],
      ['Clear about its role', 'Holyarted supports everyday reflection. It is not medical care or a diagnostic tool.'],
    ],
    accountKickerIn: 'Your account is ready', accountKickerOut: 'Optional account',
    accountTitleIn: 'Welcome back', accountTitleOut: 'Keep your account access simple.',
    accountCopyIn: 'View your account details or sign out securely whenever you wish.',
    accountCopyOut: 'Sign in with ChatGPT when you want an account area. You can use the check-in without signing in.',
    openAccount: 'Open my account', chatgpt: 'Sign in with ChatGPT',
    footer: 'A calm place for everyday reflection.',
  },
  tr: {
    navCheckIn: 'Check-in', navGuide: 'Rehberin', navApproach: 'Yaklaşımımız',
    signIn: 'Giriş yap', account: 'Hesabım', signOut: 'Çıkış yap',
    kicker: 'Kendine bakmanın daha sakin bir yolu', title: 'Önemli olana yer aç.',
    subtitle: 'Neye ihtiyaç duyduğunu fark etmek ve küçük bir sonraki adım seçmek için sakin, baskısız bir alan.',
    formTitle: 'Bugüne nasıl geliyorsun?', formCopy: 'Doğru cevap yok. Sana en yakın geleni seç.',
    nameLabel: 'Sana nasıl hitap edelim?', namePlaceholder: 'Adın',
    goalLabel: 'Şu an en çok ne yardımcı olur?', stateLabel: 'Zihnin şu an nasıl?', submit: 'Rehberimi oluştur',
    goals: { space: 'Zihnimi boşaltmak', focus: 'Odaklanmak', slow: 'Yavaşlamak', boundary: 'Sınır koymak' },
    states: { busy: 'Dolu', restless: 'Huzursuz', tired: 'Yorgun', steady: 'Dengeli' },
    resultKicker: 'Bugünkü check-in’in', resultTitle: 'Bugün için daha yumuşak bir plan.', resultCopy: 'İşine yarayanı al, yaramayanı bırak. Bu pratik bir düşünme alanı; bir etiket veya tanı değil.',
    start: 'Buradan başla', remember: 'Aklında olsun', practice: 'Şimdi dene',
    goalsContent: {
      space: ['Gelen uyaranı azalt', 'Dikkatinin daha fazla çabaya değil, daha az açık döngüye ihtiyacı olabilir.', 'Bir sekmeyi kapat, bir bildirimi sessize al ve unutmaman gereken tek şeyi bir yere yaz.'],
      focus: ['Net bir bitiş çizgisi seç', 'Bir sonraki hareket görünür ve küçük olduğunda odaklanmak kolaylaşır.', 'Kısa bir çalışma diliminde tamamlanabilecek tek bir iş seç. Diğerlerini o sürenin dışında bırak.'],
      slow: ['Hızı bilinçli olarak düşür', 'Kısa bir yavaşlama günün geri kalanını daha yönetilebilir hale getirebilir.', 'Bir sonraki işe geçmeden önce ekransız bir geçiş yarat: esne, çay hazırla veya dışarı bak.'],
      boundary: ['Kendine küçük bir alan koru', 'İşe yarayan bir sınır sessiz, net ve nazik olabilir.', 'Bugün neyin mümkün olmadığına karar ver; fazla açıklama yapmadan tek bir cümleyle ifade et.'],
    },
    statesContent: {
      busy: ['Zihnin çok şey taşıyor', 'Her şeyi aynı anda tutmaya çalışmak bütün işleri eşit derecede acil hissettirebilir.', 'Aklındaki açık işleri kâğıda dök. Sadece gerçekten sıradaki olanı işaretle.'],
      restless: ['Dikkatin harekete ihtiyaç duyuyor', 'Huzursuzlukla tartışmak yerine ona küçük bir hareket alanı açmak daha kolay olabilir.', 'Ayağa kalk, oda değiştir veya kısa bir yürüyüş yap. Bedenin sakinleştiğinde geri dön.'],
      tired: ['Planı küçült', 'Kapasiten düşükken planı azaltmak başarısızlık değil, akıllı bir ayarlamadır.', 'Bugünkü işin işe yarayan en küçük halini seç ve orada durmana izin ver.'],
      steady: ['Elindeki dengeyi kullan', 'Sakin bir an, düşünülmüş tek bir seçim yapmak için iyi bir zamandır.', 'Anlamlı bir iş seç, ona temiz bir zaman aralığı ayır ve yenisini eklemeden önce bitir.'],
    },
    approachKicker: 'Gerçek hayat için', approachTitle: 'Etiket, baskı ve öngörü olmadan öz-farkındalık.',
    principles: [
      ['Cevaplarınla şekillenir', 'Rehberin bugün paylaştıklarına karşılık verir; kim olduğunu tanımladığını iddia etmez.'],
      ['Uygulanabilecek kadar küçük', 'Her öneri, zamanın sınırlı olduğu günlerde bile sıradan hayatın içine sığacak şekilde tasarlanır.'],
      ['Rolü konusunda net', 'Holyarted günlük öz-farkındalığı destekler; tıbbi bakım veya tanı aracı değildir.'],
    ],
    accountKickerIn: 'Hesabın hazır', accountKickerOut: 'İsteğe bağlı hesap',
    accountTitleIn: 'Yeniden hoş geldin', accountTitleOut: 'Hesap erişimini sade tut.',
    accountCopyIn: 'Hesap bilgilerini görüntüleyebilir veya dilediğin zaman güvenle çıkış yapabilirsin.',
    accountCopyOut: 'Hesap alanı istediğinde ChatGPT ile giriş yap. Check-in’i giriş yapmadan da kullanabilirsin.',
    openAccount: 'Hesabımı aç', chatgpt: 'ChatGPT ile giriş yap',
    footer: 'Günlük öz-farkındalık için sakin bir alan.',
  },
} as const;

export function Experience({ user, signInPath, signOutPath }: ExperienceProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [name, setName] = useState('Derya');
  const [goal, setGoal] = useState<Goal>('space');
  const [mindState, setMindState] = useState<MindState>('busy');
  const [submittedName, setSubmittedName] = useState('Derya');
  const copy = ui[locale];

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedName(name.trim() || (locale === 'en' ? 'You' : 'Sen'));
    window.setTimeout(() => document.querySelector('#guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  const goalCard = copy.goalsContent[goal];
  const stateCard = copy.statesContent[mindState];

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#18332e]">
      <nav className="sticky top-0 z-30 border-b border-[#18332e]/10 bg-[#fffdf8]/95 px-5 backdrop-blur md:px-10">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Holyarted home">
            <span className="grid size-10 place-items-center rounded-[0.9rem] bg-[#18332e] text-[#fffdf8]"><Waves className="size-5" /></span>
            <span className="text-sm font-extrabold tracking-[0.18em]">HOLYARTED</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#check-in" className="hover:text-[#52786c]">{copy.navCheckIn}</a>
            <a href="#guide" className="hover:text-[#52786c]">{copy.navGuide}</a>
            <a href="#approach" className="hover:text-[#52786c]">{copy.navApproach}</a>
            <div className="flex rounded-full border border-[#18332e]/15 bg-white p-1" aria-label="Language">
              {(['en', 'tr'] as Locale[]).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${locale === item ? 'bg-[#18332e] text-white' : 'text-[#62736e]'}`} aria-pressed={locale === item}>{item}</button>)}
            </div>
            {user ? <a href="/profile" className="inline-flex items-center gap-2 rounded-full border border-[#18332e]/25 px-5 py-2.5"><UserRound className="size-4" /> {copy.account}</a> : <a href={signInPath} target="_top" className="inline-flex items-center gap-2 rounded-full bg-[#18332e] px-5 py-2.5 text-white"><LogIn className="size-4" /> {copy.signIn}</a>}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')} className="grid size-10 place-items-center rounded-full border border-[#18332e]/15 bg-white text-xs font-extrabold">{locale === 'en' ? 'TR' : 'EN'}</button>
            <a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="grid size-10 place-items-center rounded-full bg-[#18332e] text-white" aria-label={user ? copy.account : copy.signIn}>{user ? <UserRound className="size-4" /> : <LogIn className="size-4" />}</a>
          </div>
        </div>
      </nav>

      <section id="top" className="bg-[#dce9e4] px-5 py-14 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#52786c]">{copy.kicker}</p>
            <h1 className="mt-5 font-heading text-[clamp(3.8rem,8vw,7.4rem)] font-semibold leading-[0.86] tracking-[-0.055em]">{copy.title}</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#4f6560] md:text-lg">{copy.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3 text-sm text-[#35524b]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2"><Check className="size-4" /> {locale === 'en' ? 'No labels' : 'Etiket yok'}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2"><Check className="size-4" /> {locale === 'en' ? 'No prediction' : 'Öngörü yok'}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2"><Check className="size-4" /> {locale === 'en' ? 'No pressure' : 'Baskı yok'}</span>
            </div>
          </div>

          <form id="check-in" onSubmit={submit} className="scroll-mt-28 rounded-[2rem] bg-[#fffdf8] p-6 shadow-[0_24px_70px_rgb(45_78_68/13%)] md:p-9">
            <p className="font-heading text-3xl font-semibold md:text-4xl">{copy.formTitle}</p>
            <p className="mt-2 text-sm leading-6 text-[#62736e]">{copy.formCopy}</p>
            <label htmlFor="name" className="mt-8 block text-sm font-bold">{copy.nameLabel}</label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} className="mt-2 h-13 rounded-2xl border-[#18332e]/15 bg-[#f7f4ed] px-4" required />

            <fieldset className="mt-7"><legend className="text-sm font-bold">{copy.goalLabel}</legend><div className="mt-3 grid grid-cols-2 gap-2">{(Object.keys(copy.goals) as Goal[]).map((item) => <button key={item} type="button" onClick={() => setGoal(item)} className={`min-h-12 rounded-2xl border px-3 text-left text-sm font-semibold transition-colors ${goal === item ? 'border-[#52786c] bg-[#dce9e4] text-[#18332e]' : 'border-[#18332e]/12 bg-white text-[#62736e] hover:border-[#52786c]/45'}`} aria-pressed={goal === item}>{copy.goals[item]}</button>)}</div></fieldset>
            <fieldset className="mt-7"><legend className="text-sm font-bold">{copy.stateLabel}</legend><div className="mt-3 flex flex-wrap gap-2">{(Object.keys(copy.states) as MindState[]).map((item) => <button key={item} type="button" onClick={() => setMindState(item)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${mindState === item ? 'border-[#18332e] bg-[#18332e] text-white' : 'border-[#18332e]/12 bg-white text-[#62736e]'}`} aria-pressed={mindState === item}>{copy.states[item]}</button>)}</div></fieldset>
            <Button type="submit" className="mt-8 h-13 w-full justify-between rounded-2xl bg-[#ed8f70] px-5 text-base font-bold text-[#18332e] hover:bg-[#e88362]">{copy.submit}<ArrowRight className="size-4" /></Button>
          </form>
        </div>
      </section>

      <section id="guide" className="scroll-mt-20 px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-[1fr_0.55fr] md:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#52786c]">{copy.resultKicker} · {submittedName}</p><h2 className="mt-4 max-w-3xl font-heading text-5xl font-semibold leading-[0.95] md:text-7xl">{copy.resultTitle}</h2></div><p className="text-sm leading-7 text-[#62736e]">{copy.resultCopy}</p></div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[[Cloud, copy.start, goalCard[0], goalCard[1]], [Focus, copy.remember, stateCard[0], stateCard[1]], [Pause, copy.practice, locale === 'en' ? 'One small next step' : 'Küçük bir sonraki adım', stateCard[2]]].map(([Icon, eyebrow, title, body]) => { const ItemIcon = Icon as typeof Cloud; return <article key={String(eyebrow)} className="flex min-h-[330px] flex-col rounded-[1.75rem] border border-[#18332e]/10 bg-white p-7"><span className="grid size-12 place-items-center rounded-2xl bg-[#dce9e4] text-[#35524b]"><ItemIcon className="size-5" /></span><p className="mt-9 text-xs font-extrabold uppercase tracking-[0.18em] text-[#52786c]">{String(eyebrow)}</p><h3 className="mt-3 font-heading text-3xl font-semibold leading-tight">{String(title)}</h3><p className="mt-4 text-sm leading-7 text-[#62736e]">{String(body)}</p></article>; })}
          </div>
          <div className="mt-4 rounded-[1.75rem] bg-[#18332e] p-7 text-white md:flex md:items-center md:justify-between md:gap-8 md:p-10"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#a9cbc0]">{user ? copy.accountKickerIn : copy.accountKickerOut}</p><h3 className="mt-3 font-heading text-3xl font-semibold">{user ? `${copy.accountTitleIn}, ${user.displayName}.` : copy.accountTitleOut}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{user ? copy.accountCopyIn : copy.accountCopyOut}</p></div><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="mt-6 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ed8f70] px-6 py-3.5 font-bold text-[#18332e] md:mt-0">{user ? <UserRound className="size-4" /> : <LogIn className="size-4" />}{user ? copy.openAccount : copy.chatgpt}</a></div>
        </div>
      </section>

      <section id="approach" className="bg-[#e9e3f0] px-5 py-16 md:px-10 md:py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6d5d7d]">{copy.approachKicker}</p><h2 className="mt-4 max-w-4xl font-heading text-5xl font-semibold leading-[0.95] md:text-7xl">{copy.approachTitle}</h2><img src="/og.png" alt="Holyarted — Make room for what matters" className="mt-12 w-full rounded-[1.75rem] border border-[#6d5d7d]/10 object-cover" /><div className="mt-4 grid gap-4 md:grid-cols-3">{copy.principles.map(([title, body], index) => { const icons = [Waves, Check, ShieldCheck]; const ItemIcon = icons[index]; return <article key={title} className="rounded-[1.75rem] bg-[#fffdf8]/85 p-7"><ItemIcon className="size-6 text-[#6d5d7d]" /><h3 className="mt-12 font-heading text-3xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-[#665f6e]">{body}</p></article>; })}</div></div></section>

      <footer className="bg-[#fffdf8] px-5 py-8 md:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#62736e] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Holyarted</span><span>{copy.footer}</span>{user && <a href={signOutPath} target="_top" className="inline-flex items-center gap-2 hover:text-[#18332e]"><LogOut className="size-3.5" /> {copy.signOut}</a>}</div></footer>
    </main>
  );
}
