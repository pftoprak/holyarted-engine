'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Compass, Gem, LogIn, LogOut, MoonStar, Sparkles, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { calculateProfile } from '@/lib/numerology';

type Locale = 'en' | 'tr';
type ExperienceProps = {
  user: { displayName: string; email: string } | null;
  signInPath: string;
  signOutPath: string;
};

const energyNames: Record<Locale, Record<number, string>> = {
  en: { 1: 'The Pioneer', 2: 'The Harmonizer', 3: 'The Creator', 4: 'The Builder', 5: 'The Free Spirit', 6: 'The Nurturer', 7: 'The Seeker', 8: 'The Alchemist', 9: 'The Humanitarian', 11: 'The Visionary', 22: 'The Master Builder', 33: 'The Guide' },
  tr: { 1: 'Öncü', 2: 'Dengeleyici', 3: 'Yaratıcı', 4: 'İnşa eden', 5: 'Özgür ruh', 6: 'Şefkatli', 7: 'Bilge', 8: 'Dönüştürücü', 9: 'Şifacı', 11: 'İlham veren', 22: 'Usta kurucu', 33: 'Evrensel rehber' },
};

const numberEssence: Record<number, string> = {
  1: 'independence, courage, and the instinct to begin',
  2: 'empathy, diplomacy, and the art of creating harmony',
  3: 'expression, playfulness, and magnetic creativity',
  4: 'discipline, loyalty, and the power of solid foundations',
  5: 'freedom, curiosity, and an appetite for change',
  6: 'care, responsibility, and a deep sense of beauty',
  7: 'insight, analysis, and a search for hidden truth',
  8: 'ambition, influence, and the ability to shape outcomes',
  9: 'compassion, imagination, and service to something larger',
  11: 'intuition, inspiration, and an electric inner vision',
  22: 'vision paired with the patience to build at scale',
  33: 'compassionate leadership and a gift for elevating others',
};

const ui = {
  en: {
    navMap: 'Your map', navReading: 'Reading', navMethod: 'How it works', signIn: 'Sign in', account: 'My account', signOut: 'Sign out', eyebrow: 'Remember your own rhythm',
    heroA: 'Read the map', heroB: 'within you.', heroCopy: 'Your name and birth date hold a quiet signature—one that reveals the patterns, gifts, and directions shaping your story.',
    stat1: 'Core energy', stat2: 'Main themes', stat3: 'Possibility', formKicker: 'Personal map', formTitle: 'Where does your journey begin?',
    name: 'Your name', namePlaceholder: 'Enter your name', birth: 'Date of birth', open: 'Reveal my map', vibration: 'core vibration', mirror: 'A mirror, not a verdict',
    resultsKicker: 'personal reading', resultsTitle: 'The story your numbers tell.', resultsCopy: 'This map is not a fixed prediction. It is a mirror for noticing your patterns, understanding your choices, and asking better questions.',
    readMore: 'Read the full interpretation', readLess: 'Show less', sectionEyebrows: ['Core energy', 'Natural gift', 'Direction of growth'], sectionTitles: ['How do you meet the world?', 'The strength that moves through you', 'Where can your potential expand?'],
    accountKickerIn: 'Your space is open', accountKickerOut: 'Your personal space', accountTitleIn: 'Welcome back', accountTitleOut: 'Continue your journey with an account.',
    accountCopyIn: 'View your account details or sign out securely whenever you wish.', accountCopyOut: 'Sign in securely with your ChatGPT account. There is no separate password to create.',
    openAccount: 'Open my account', chatgpt: 'Sign in with ChatGPT', howKicker: 'Three lenses, one story', howTitle: 'A simple ritual for deeper self-knowledge.',
    features: [['Life direction', 'See the central motivation behind the choices you make.'], ['Natural ability', 'Notice the strength that comes so easily you may overlook it.'], ['Inner rhythm', 'Understand what restores your energy and where you seek balance.']],
  },
  tr: {
    navMap: 'Haritan', navReading: 'Yorumun', navMethod: 'Nasıl çalışır?', signIn: 'Giriş yap', account: 'Hesabım', signOut: 'Çıkış yap', eyebrow: 'Kendi ritmini hatırla',
    heroA: 'İçindeki haritayı', heroB: 'oku.', heroCopy: 'İsmin ve doğum tarihin; karakterinin, yeteneklerinin ve hayat yönünün sessiz bir imzasını taşır.',
    stat1: 'Öz enerji', stat2: 'Ana tema', stat3: 'Olasılık', formKicker: 'Kişisel harita', formTitle: 'Yolculuğun nerede başlıyor?',
    name: 'Adın', namePlaceholder: 'Adını yaz', birth: 'Doğum tarihin', open: 'Haritamı aç', vibration: 'için ana titreşim', mirror: 'Bir hüküm değil, bir ayna',
    resultsKicker: 'kişisel yorum', resultsTitle: 'Sayıların sende anlattığı hikâye.', resultsCopy: 'Bu harita kesin bir kader anlatısı değil; kendini görmek, seçimlerini anlamak ve yeni sorular sormak için bir aynadır.',
    readMore: 'Yorumun tamamını oku', readLess: 'Kısalt', sectionEyebrows: ['Öz enerji', 'Doğal yetenek', 'Üretim yönü'], sectionTitles: ['Dünyaya nasıl görünüyorsun?', 'Sende zahmetsizce akan güç', 'Potansiyelini nerede büyütürsün?'],
    accountKickerIn: 'Kişisel alanın açık', accountKickerOut: 'Kişisel alan', accountTitleIn: 'Yeniden hoş geldin', accountTitleOut: 'Yolculuğuna bir hesapla devam et.',
    accountCopyIn: 'Hesap bilgilerini görüntüleyebilir veya dilediğin zaman güvenle çıkış yapabilirsin.', accountCopyOut: 'ChatGPT hesabınla güvenli biçimde giriş yap; ayrı bir parola oluşturman gerekmez.',
    openAccount: 'Hesabımı aç', chatgpt: 'ChatGPT ile giriş yap', howKicker: 'Üç bakış, tek hikâye', howTitle: 'Kendini daha derinden tanımak için sade bir ritüel.',
    features: [['Hayat yönün', 'Kararlarının arkasındaki ana motivasyonu görünür kıl.'], ['Doğal yeteneğin', 'Sana kolay gelen ama bazen fark etmediğin gücü keşfet.'], ['İçsel ritmin', 'Enerjini neyin yükselttiğini ve nerede denge aradığını anla.']],
  },
} as const;

function englishInsight(number: number, section: number) {
  const essence = numberEssence[number] ?? numberEssence[9];
  const openings = [
    `Your core number points to ${essence}. You tend to meet life through this frequency, especially when choices ask you to trust yourself.`,
    `This part of your map reveals a natural gift for ${essence}. It becomes most powerful when you use it consciously rather than trying to prove it.`,
    `Your growth direction is shaped by ${essence}. The invitation is to turn this potential into daily practice, honest work, and grounded decisions.`,
  ];
  const closings = [
    'At its best, this energy feels clear and self-led. Under pressure, it may become overextended or guarded. Notice which version appears, then choose the more spacious expression.',
    'Because this ability may feel ordinary to you, you can underestimate it. Give it structure, let others receive it, and allow repetition to turn instinct into mastery.',
    'Progress comes from balancing vision with patience. Small, consistent choices will carry this number farther than intensity alone ever could.',
  ];
  return `${openings[section]}\n\n${closings[section]}`;
}

export function Experience({ user, signInPath, signOutPath }: ExperienceProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [name, setName] = useState('Derya');
  const [birthDate, setBirthDate] = useState('1992-07-14');
  const [profile, setProfile] = useState(() => calculateProfile('Derya', '1992-07-14'));
  const [expanded, setExpanded] = useState<string | null>(null);
  const copy = ui[locale];

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfile(calculateProfile(name, birthDate));
    setExpanded(null);
    window.setTimeout(() => document.querySelector('#reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3efe5] text-[#17312b]">
      <nav className="relative z-30 flex min-h-24 items-center bg-[#fbfaf6] px-5 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Holyarted home"><span className="grid size-10 place-items-center rounded-full bg-[#17312b] text-[#d6aa5c]"><Sparkles className="size-4" /></span><span className="text-sm font-extrabold tracking-[0.2em]">HOLYARTED</span></a>
          <div className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#map" className="transition-colors hover:text-[#a8782d]">{copy.navMap}</a><a href="#reading" className="transition-colors hover:text-[#a8782d]">{copy.navReading}</a><a href="#method" className="transition-colors hover:text-[#a8782d]">{copy.navMethod}</a>
            <div className="flex rounded-full border border-[#17312b]/15 bg-white p-1" aria-label="Language">{(['en', 'tr'] as Locale[]).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition-colors ${locale === item ? 'bg-[#17312b] text-white' : 'text-[#66716d] hover:text-[#17312b]'}`} aria-pressed={locale === item}>{item}</button>)}</div>
            {user ? <a href="/profile" className="inline-flex items-center gap-2 border-2 border-[#17312b] px-5 py-3 text-xs font-extrabold uppercase tracking-wider"><UserRound className="size-4" /> {copy.account}</a> : <a href={signInPath} target="_top" className="inline-flex items-center gap-2 bg-[#17312b] px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white"><LogIn className="size-4" /> {copy.signIn}</a>}
          </div>
          <div className="flex items-center gap-2 md:hidden"><button type="button" onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')} className="grid size-11 place-items-center rounded-full border border-[#17312b]/20 bg-white text-xs font-extrabold uppercase">{locale === 'en' ? 'TR' : 'EN'}</button><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="grid size-11 place-items-center rounded-full bg-[#17312b] text-[#d6aa5c]" aria-label={user ? copy.account : copy.signIn}>{user ? <UserRound className="size-5" /> : <LogIn className="size-5" />}</a></div>
        </div>
      </nav>

      <section id="top" className="hero-field relative isolate min-h-[650px] overflow-hidden bg-[#102922] text-[#fbfaf6]">
        <div className="hero-stars absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="absolute -right-36 top-8 size-[560px] rounded-full border border-[#d6aa5c]/30 md:right-10 md:size-[720px]" aria-hidden="true"><div className="absolute inset-[12%] rounded-full border border-[#d6aa5c]/20" /><div className="absolute inset-[31%] grid place-items-center rounded-full border border-[#d6aa5c]/35"><Sparkles className="size-14 text-[#d6aa5c]/75" /></div></div>
        <div className="relative mx-auto flex min-h-[650px] w-full max-w-7xl items-end px-5 pb-16 pt-28 md:px-10 md:pb-20"><div className="max-w-4xl"><p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#d6aa5c]"><MoonStar className="size-4" /> {copy.eyebrow}</p><h1 className="max-w-4xl text-[clamp(4rem,9vw,8.7rem)] font-extrabold leading-[0.82] tracking-[-0.065em]">{copy.heroA}<br /><span className="font-heading font-medium italic text-[#d6aa5c]">{copy.heroB}</span></h1><p className="mt-8 max-w-2xl text-base leading-7 text-white/70 md:text-lg">{copy.heroCopy}</p><a href="#map" className="mt-9 inline-flex items-center gap-5 bg-[#d6aa5c] px-6 py-4 text-sm font-extrabold uppercase tracking-wider text-[#17312b]">{copy.open} <ArrowRight className="size-4" /></a></div></div>
      </section>

      <section id="map" className="scroll-mt-6 bg-[#fbfaf6]"><div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#a8782d]">{copy.mirror}</p><h2 className="mt-5 max-w-xl font-heading text-5xl font-semibold leading-[0.92] md:text-7xl">{copy.formTitle}</h2><p className="mt-7 max-w-lg text-sm leading-7 text-[#66716d]">{copy.resultsCopy}</p><div className="mt-10 grid grid-cols-3 gap-3 border-t border-[#17312b]/15 pt-6 text-sm"><div><span className="block font-heading text-3xl text-[#a8782d]">01</span><span className="text-[#66716d]">{copy.stat1}</span></div><div><span className="block font-heading text-3xl text-[#a8782d]">03</span><span className="text-[#66716d]">{copy.stat2}</span></div><div><span className="block font-heading text-3xl text-[#a8782d]">∞</span><span className="text-[#66716d]">{copy.stat3}</span></div></div></div>
        <Card className="border-0 bg-[#17312b] py-0 text-white shadow-[0_24px_70px_rgb(23_49_43/20%)]"><CardHeader className="border-b border-white/10 px-6 py-7 md:px-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6aa5c]">{copy.formKicker}</p><CardTitle className="font-heading text-3xl text-white">{copy.formTitle}</CardTitle></CardHeader><CardContent className="px-6 py-8 md:px-9"><form onSubmit={submit} className="space-y-6"><FieldGroup><Field><FieldLabel htmlFor="name" className="text-white/75">{copy.name}</FieldLabel><Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} className="h-13 border-white/15 bg-white/8 px-4 text-white placeholder:text-white/35" required /></Field><Field><FieldLabel htmlFor="birthDate" className="text-white/75">{copy.birth}</FieldLabel><Input id="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="h-13 border-white/15 bg-white/8 px-4 text-white scheme-dark" required /></Field></FieldGroup><Button type="submit" size="lg" className="h-13 w-full justify-between rounded-none bg-[#d6aa5c] px-5 text-base text-[#17312b] hover:bg-[#e1bc78]">{copy.open} <ArrowRight className="size-4" /></Button></form><div className="mt-7 flex items-center justify-between gap-4 border border-[#d6aa5c]/25 bg-[#d6aa5c]/8 p-5" aria-live="polite"><div><p className="text-xs uppercase tracking-[0.18em] text-white/55">{profile.name} {copy.vibration}</p><p className="mt-1 font-heading text-3xl text-white">{energyNames[locale][profile.lifeNumber] ?? energyNames[locale][9]}</p></div><div className="grid size-16 shrink-0 place-items-center rounded-full border border-[#d6aa5c]/40 font-heading text-3xl text-[#d6aa5c]">{profile.lifeNumber}</div></div></CardContent></Card>
      </div></section>

      <section id="reading" className="scroll-mt-4 bg-[#ece4d3]"><div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-24"><div className="mb-12 grid gap-6 md:grid-cols-[1fr_0.45fr] md:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#a8782d]">{profile.name} · {copy.resultsKicker}</p><h2 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[0.9] tracking-[-0.045em] md:text-7xl">{copy.resultsTitle}</h2></div><p className="text-sm leading-7 text-[#66716d]">{copy.resultsCopy}</p></div>
        <div className="grid gap-4 lg:grid-cols-3">{profile.sections.map((section, index) => { const isExpanded = expanded === section.key; const content = locale === 'tr' ? section.content : englishInsight(section.number, index); return <article key={section.key} className="flex min-h-[390px] flex-col bg-[#fbfaf6] p-7 md:p-8"><div className="flex items-start justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#a8782d]">{copy.sectionEyebrows[index]}</p><span className="grid size-12 place-items-center rounded-full border border-[#a8782d]/35 font-heading text-2xl text-[#a8782d]">{section.number}</span></div><h3 className="mt-9 font-heading text-3xl font-semibold leading-none">{copy.sectionTitles[index]}</h3><p className={`mt-5 whitespace-pre-line text-sm leading-7 text-[#66716d] ${isExpanded ? '' : 'line-clamp-[7]'}`}>{content}</p><button type="button" onClick={() => setExpanded(isExpanded ? null : section.key)} className="mt-auto pt-7 text-left text-sm font-bold underline decoration-[#a8782d] underline-offset-4">{isExpanded ? copy.readLess : copy.readMore}</button></article>; })}</div>
        <div className="mt-4 flex flex-col items-start justify-between gap-6 bg-[#17312b] p-7 text-white md:flex-row md:items-center md:p-10"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6aa5c]">{user ? copy.accountKickerIn : copy.accountKickerOut}</p><h3 className="mt-3 font-heading text-3xl md:text-4xl">{user ? `${copy.accountTitleIn}, ${user.displayName}.` : copy.accountTitleOut}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{user ? copy.accountCopyIn : copy.accountCopyOut}</p></div><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="inline-flex shrink-0 items-center gap-2 bg-[#d6aa5c] px-6 py-4 text-sm font-extrabold uppercase tracking-wider text-[#17312b]">{user ? <UserRound className="size-4" /> : <LogIn className="size-4" />}{user ? copy.openAccount : copy.chatgpt}</a></div>
      </div></section>

      <section id="method" className="bg-[#fbfaf6]"><div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-24"><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#a8782d]">{copy.howKicker}</p><h2 className="mt-4 max-w-3xl font-heading text-5xl font-semibold leading-[0.95] md:text-7xl">{copy.howTitle}</h2><div className="mt-12 grid border-y border-[#17312b]/15 md:grid-cols-3">{[[Compass, ...copy.features[0]], [Gem, ...copy.features[1]], [MoonStar, ...copy.features[2]]].map(([Icon, title, description], index) => { const ItemIcon = Icon as typeof Compass; return <div key={String(title)} className={`py-8 md:px-8 ${index > 0 ? 'border-t border-[#17312b]/15 md:border-l md:border-t-0' : ''}`}><ItemIcon className="mb-14 size-6 text-[#a8782d]" /><p className="text-xs font-bold text-[#a8782d]">0{index + 1}</p><h3 className="mt-3 font-heading text-3xl font-semibold">{String(title)}</h3><p className="mt-3 text-sm leading-7 text-[#66716d]">{String(description)}</p></div>; })}</div></div></section>

      <footer className="bg-[#102922] px-5 py-8 text-white/55 md:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs uppercase tracking-[0.18em] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Holyarted</span><span>{copy.mirror}</span>{user && <a href={signOutPath} target="_top" className="inline-flex items-center gap-2 hover:text-[#d6aa5c]"><LogOut className="size-3.5" /> {copy.signOut}</a>}</div></footer>
    </main>
  );
}
