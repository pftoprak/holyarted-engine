'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LogIn, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import Image from 'next/image';

type Locale = 'en' | 'tr';
type Decision = 'facts' | 'voice' | 'instinct' | 'time';
type Environment = 'quiet' | 'together' | 'variety' | 'motion';
type Friction = 'switching' | 'ambiguity' | 'access' | 'stagnation';
type Purpose = 'build' | 'guide' | 'create' | 'connect';
type ExperienceProps = { user: { displayName: string; email: string } | null; signInPath: string; signOutPath: string };

type CalculatedProfile = {
  fullName: string;
  decision: Decision;
  environment: Environment;
  friction: Friction;
  purpose: Purpose;
};

const decisionKeys: Decision[] = ['facts', 'voice', 'instinct', 'time'];
const environmentKeys: Environment[] = ['quiet', 'together', 'variety', 'motion'];
const frictionKeys: Friction[] = ['switching', 'ambiguity', 'access', 'stagnation'];
const purposeKeys: Purpose[] = ['build', 'guide', 'create', 'connect'];

function calculateDesign(firstName: string, lastName: string, birthDate: string): CalculatedProfile {
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const normalized = fullName.toLocaleUpperCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nameScore = [...normalized].reduce((sum, character, index) => sum + (character.codePointAt(0) ?? 0) * (index + 1), 0);
  const [year = 0, month = 0, day = 0] = birthDate.split('-').map(Number);
  const dateScore = [...birthDate.replace(/\D/g, '')].reduce((sum, character) => sum + Number(character), 0);

  return {
    fullName: fullName || 'Your profile',
    decision: decisionKeys[(day + nameScore) % decisionKeys.length],
    environment: environmentKeys[(month + nameScore + dateScore) % environmentKeys.length],
    friction: frictionKeys[(year + day + nameScore) % frictionKeys.length],
    purpose: purposeKeys[(dateScore + month + nameScore) % purposeKeys.length],
  };
}

const copy = {
  en: {
    nav: ['Assessment', 'Your profile', 'Method'], signIn: 'Sign in', account: 'Account', signOut: 'Sign out', menu: 'Menu',
    edition: 'Human Design, reframed', titleA: 'Know how you', titleB: 'move through life.',
    intro: 'A refined personal profile calculated from your name and birth date—designed to clarify how you decide, work, relate and find direction.',
    start: 'Discover my design', sample: 'See what you’ll receive', trust: ['Calculated for you', 'Private by design', 'No fixed labels'],
    panelLabel: 'PERSONAL DESIGN · PRIVATE SESSION', panelTitle: 'Begin with the details that make the profile yours.', panelCopy: 'Enter your full name and date of birth. The calculation engine will build your individual profile.',
    progress: 'Your profile starts here', back: 'Back', next: 'Continue', finish: 'Calculate my profile',
    firstName: 'First name', firstPlaceholder: 'Your first name', lastName: 'Last name', lastPlaceholder: 'Your last name', birthDate: 'Date of birth', inputNote: 'Your details are used to calculate this profile. They are not shown publicly.',
    questions: [
      { eyebrow: 'DECISION STYLE', title: 'When a decision matters, what helps you trust it?', options: { facts: ['Clear facts', 'I want the evidence in front of me.'], voice: ['Talking it through', 'I hear what I think as I say it.'], instinct: ['An immediate inner response', 'I notice a clear yes or no early.'], time: ['Time to settle', 'Clarity arrives after the first reaction passes.'] } },
      { eyebrow: 'BEST ENVIRONMENT', title: 'Where do you do your best thinking?', options: { quiet: ['Quiet structure', 'A protected space with a clear plan.'], together: ['A collaborative room', 'Ideas sharpen around trusted people.'], variety: ['Changing inputs', 'New perspectives and settings keep me engaged.'], motion: ['Hands-on momentum', 'Thinking becomes clear while I make or move.'] } },
      { eyebrow: 'FRICTION PATTERN', title: 'What wears you down fastest?', options: { switching: ['Constant switching', 'Too many open threads dilute my attention.'], ambiguity: ['Unclear expectations', 'I struggle when the target keeps moving.'], access: ['Always being available', 'My own priorities disappear behind other people’s needs.'], stagnation: ['Too little movement', 'Repetition without progress makes me withdraw.'] } },
      { eyebrow: 'PURPOSE DIRECTION', title: 'What kind of contribution feels most meaningful?', options: { build: ['Building something lasting', 'I want my work to become useful and dependable.'], guide: ['Guiding people', 'I want to make complexity easier to navigate.'], create: ['Creating new possibilities', 'I want to give form to what does not exist yet.'], connect: ['Connecting people', 'I want the right people and ideas to find each other.'] } },
    ],
    previewLabel: 'A profile you can use', previewTitle: 'Insight without the fog.', previewCopy: 'Your profile translates reflection into practical guidance for work, relationships, decisions and direction.',
    profileLabel: 'YOUR PERSONAL DESIGN', profileFor: 'Prepared for you',
    profileNames: { build: 'The Intentional Builder', guide: 'The Grounded Guide', create: 'The Original Maker', connect: 'The Human Connector' },
    profileIntros: { build: 'You find meaning by turning a clear intention into something people can rely on.', guide: 'You find meaning by helping people see what matters and move forward with confidence.', create: 'You find meaning by making room for original ideas and giving them a useful form.', connect: 'You find meaning by noticing relationships others miss and bringing people into better conversation.' },
    sections: ['Decision style', 'Best environment', 'Watch for', 'Purpose direction'],
    decision: { facts: ['Evidence first', 'You make stronger choices when the relevant facts are visible. Define the decision, gather what changes the outcome, then stop researching.'], voice: ['Clarity in conversation', 'A trusted conversation helps you separate your own view from outside noise. Ask for reflection, not instructions.'], instinct: ['Respect the first signal', 'Your earliest response often contains useful information. Notice it, then verify it against reality before committing.'], time: ['Let clarity mature', 'Important choices improve when you allow the first reaction to settle. Set a decision time so reflection does not become delay.'] },
    environments: { quiet: ['Protected focus', 'You do your best work with defined priorities, fewer interruptions and enough room to think deeply.'], together: ['Trusted collaboration', 'Your thinking becomes more precise around people who challenge ideas without competing for attention.'], variety: ['Fresh perspective', 'You stay engaged when your work includes new inputs, changing contexts and room to connect different ideas.'], motion: ['Progress you can touch', 'You understand problems by acting on them. Prototypes, drafts and physical movement help thought become clear.'] },
    frictions: { switching: ['Protect continuity', 'Too many parallel demands can make you mistake motion for progress. Keep one primary thread visible and park the rest.'], ambiguity: ['Name the finish line', 'Unclear expectations quietly consume your attention. Before starting, agree what “done” needs to look like.'], access: ['Make access intentional', 'Being useful can become over-availability. Decide when you are open to others and when your priorities are protected.'], stagnation: ['Create visible movement', 'Repetition is hardest when its purpose disappears. Link routine work to a meaningful outcome or change the method.'] },
    purposes: { build: ['Make the useful thing real', 'Your direction is not a job title. It is a recurring contribution: creating structures, products or practices that hold up over time.'], guide: ['Turn complexity into direction', 'Your direction is to help people orient themselves—through teaching, leadership, care or clear communication.'], create: ['Give new ideas a form', 'Your direction is to open possibilities, then shape the strongest one into work others can experience and use.'], connect: ['Strengthen the human network', 'Your direction is to create understanding across people, disciplines or communities that would otherwise remain separate.'] },
    restart: 'Retake the assessment', savePrompt: 'Keep your profile close.', saveCopy: 'Sign in to return to your personal space and continue your reflection over time.', saveIn: 'Open my account', saveOut: 'Sign in with ChatGPT',
    methodLabel: 'THE METHOD', methodTitle: 'Serious reflection. Clear boundaries.',
    principles: [['Input-led', 'Your profile is calculated from the name and birth date you provide. The same inputs always produce the same profile.'], ['Practical', 'Each insight includes a way to apply it in ordinary decisions, work and relationships.'], ['Open-ended', 'Use the profile as a lens, not a verdict. You are allowed to change, contradict it and choose differently.']],
    disclaimer: 'Holyarted is an independent self-inquiry product. It is not affiliated with any third-party system or brand. It offers reflection, not diagnosis or prediction.', footer: 'A clearer way to understand yourself.',
  },
  tr: {
    nav: ['Değerlendirme', 'Profilin', 'Yöntem'], signIn: 'Giriş yap', account: 'Hesap', signOut: 'Çıkış yap', menu: 'Menü',
    edition: 'Human Design, yeniden yorumlandı', titleA: 'Hayatta nasıl', titleB: 'ilerlediğini keşfet.',
    intro: 'Adın ve doğum tarihinden hesaplanan; karar, çalışma, ilişki kurma ve yön bulma biçimini netleştiren rafine bir kişisel profil.',
    start: 'Tasarımımı keşfet', sample: 'Ne alacağını gör', trust: ['Senin için hesaplanır', 'Gizlilik odaklı', 'Sabit etiket yok'],
    panelLabel: 'KİŞİSEL TASARIM · ÖZEL OTURUM', panelTitle: 'Profili sana özel yapan bilgilerle başla.', panelCopy: 'Adını, soyadını ve doğum tarihini gir. Hesaplama motoru kişisel profilini oluştursun.',
    progress: 'Profilin burada başlıyor', back: 'Geri', next: 'Devam et', finish: 'Profilimi hesapla',
    firstName: 'Ad', firstPlaceholder: 'Adın', lastName: 'Soyad', lastPlaceholder: 'Soyadın', birthDate: 'Doğum tarihi', inputNote: 'Bilgilerin bu profili hesaplamak için kullanılır; herkese açık şekilde gösterilmez.',
    questions: [
      { eyebrow: 'KARAR BİÇİMİ', title: 'Önemli bir kararda neye güvenmek sana en çok yardımcı olur?', options: { facts: ['Net bilgiler', 'Gerekli veriyi önümde görmek isterim.'], voice: ['Konuşarak düşünmek', 'Ne düşündüğümü söylerken daha iyi duyarım.'], instinct: ['İlk iç tepki', 'Başta belirgin bir evet ya da hayır fark ederim.'], time: ['Zamana bırakmak', 'İlk tepki geçince netlik gelir.'] } },
      { eyebrow: 'EN İYİ ORTAM', title: 'En iyi nerede düşünürsün?', options: { quiet: ['Sessiz düzen', 'Korunaklı bir alan ve net bir plan.'], together: ['Birlikte düşünmek', 'Güvendiğim insanların yanında fikirlerim keskinleşir.'], variety: ['Değişen uyaranlar', 'Yeni bakış açıları ve ortamlar ilgimi canlı tutar.'], motion: ['Hareket içinde', 'Üretirken veya hareket ederken düşüncem netleşir.'] } },
      { eyebrow: 'ZORLANMA ÖRÜNTÜSÜ', title: 'Seni en hızlı ne tüketir?', options: { switching: ['Sürekli konu değiştirmek', 'Çok fazla açık iş dikkatimi dağıtır.'], ambiguity: ['Belirsiz beklentiler', 'Hedef sürekli değiştiğinde zorlanırım.'], access: ['Her an ulaşılabilir olmak', 'Başkalarının ihtiyaçları önceliklerimi görünmez kılar.'], stagnation: ['İlerlemenin olmaması', 'Sonuç vermeyen tekrar beni geri çeker.'] } },
      { eyebrow: 'AMAÇ YÖNÜ', title: 'Hangi katkı biçimi sana en anlamlı geliyor?', options: { build: ['Kalıcı bir şey kurmak', 'İşimin faydalı ve güvenilir olmasını isterim.'], guide: ['İnsanlara yol göstermek', 'Karmaşıklığı daha anlaşılır hale getirmek isterim.'], create: ['Yeni olasılıklar yaratmak', 'Henüz var olmayan şeye biçim vermek isterim.'], connect: ['İnsanları buluşturmak', 'Doğru insanların ve fikirlerin birbirini bulmasını isterim.'] } },
    ],
    previewLabel: 'Kullanabileceğin bir profil', previewTitle: 'Belirsizlik olmadan içgörü.', previewCopy: 'Profilin, öz-keşfi iş, ilişkiler, kararlar ve yön için uygulanabilir bir rehbere dönüştürür.',
    profileLabel: 'KİŞİSEL TASARIMIN', profileFor: 'Senin için hazırlandı',
    profileNames: { build: 'Niyetli Kurucu', guide: 'Sağlam Rehber', create: 'Özgün Üretici', connect: 'İnsanları Buluşturan' },
    profileIntros: { build: 'Net bir niyeti insanların güvenebileceği bir şeye dönüştürdüğünde anlam bulursun.', guide: 'İnsanların önemli olanı görmesine ve güvenle ilerlemesine yardım ettiğinde anlam bulursun.', create: 'Özgün fikirlere alan açıp onlara işe yarar bir biçim verdiğinde anlam bulursun.', connect: 'Başkalarının kaçırdığı ilişkileri fark edip insanları daha iyi bir konuşmada buluşturduğunda anlam bulursun.' },
    sections: ['Karar biçimi', 'En iyi ortam', 'Dikkat et', 'Amaç yönü'],
    decision: { facts: ['Önce kanıt', 'İlgili bilgiler görünür olduğunda daha güçlü seçimler yaparsın. Kararı tanımla, sonucu değiştiren veriyi topla ve araştırmayı bitir.'], voice: ['Konuşmada netlik', 'Güvenilir bir konuşma, kendi görüşünü dış seslerden ayırmana yardım eder. Yönlendirme değil, yansıtma iste.'], instinct: ['İlk sinyali ciddiye al', 'İlk tepkin çoğu zaman değerli bilgi taşır. Fark et, sonra karar vermeden önce gerçeklikle karşılaştır.'], time: ['Netliğin olgunlaşsın', 'Önemli seçimler, ilk tepkinin yatışmasına izin verdiğinde iyileşir. Düşünmenin ertelemeye dönüşmemesi için karar zamanı belirle.'] },
    environments: { quiet: ['Korunan odak', 'Net öncelikler, daha az bölünme ve derin düşünme alanı olduğunda en iyi işini çıkarırsın.'], together: ['Güvenilir işbirliği', 'Fikirlerle rekabet etmeden onları zorlayan insanların yanında düşüncen daha kesin hale gelir.'], variety: ['Taze bakış', 'İşin yeni girdiler, değişen bağlamlar ve farklı fikirleri birleştirme alanı içerdiğinde ilgini korursun.'], motion: ['Dokunabildiğin ilerleme', 'Problemleri onlara etki ederek anlarsın. Taslaklar, denemeler ve fiziksel hareket düşünceni netleştirir.'] },
    frictions: { switching: ['Sürekliliği koru', 'Çok fazla eşzamanlı talep, hareketi ilerleme sanmana neden olabilir. Tek bir ana işi görünür tut, diğerlerini beklet.'], ambiguity: ['Bitiş çizgisini adlandır', 'Belirsiz beklentiler dikkatini sessizce tüketir. Başlamadan önce “bitti”nin nasıl görüneceğini netleştir.'], access: ['Ulaşılabilirliği bilinçli seç', 'Faydalı olmak aşırı ulaşılabilirliğe dönüşebilir. Başkalarına ne zaman açık, kendi önceliklerine ne zaman kapalı olduğunu belirle.'], stagnation: ['Görünür ilerleme yarat', 'Tekrarın amacı kaybolduğunda zorlanırsın. Rutin işi anlamlı bir sonuca bağla veya yöntemini değiştir.'] },
    purposes: { build: ['Faydalı olanı gerçeğe dönüştür', 'Yönün bir iş unvanı değil, tekrarlayan bir katkıdır: zamana dayanan yapılar, ürünler veya uygulamalar kurmak.'], guide: ['Karmaşıklığı yöne dönüştür', 'Yönün; öğretme, liderlik, bakım veya açık iletişim aracılığıyla insanların kendini konumlandırmasına yardım etmek.'], create: ['Yeni fikre biçim ver', 'Yönün olasılık açmak, ardından en güçlü olanı başkalarının deneyimleyip kullanabileceği bir işe dönüştürmek.'], connect: ['İnsan ağını güçlendir', 'Yönün normalde ayrı kalacak insanlar, alanlar veya topluluklar arasında anlayış yaratmak.'] },
    restart: 'Değerlendirmeyi yeniden yap', savePrompt: 'Profilini yanında tut.', saveCopy: 'Kişisel alanına dönmek ve zaman içindeki keşfine devam etmek için giriş yap.', saveIn: 'Hesabımı aç', saveOut: 'ChatGPT ile giriş yap',
    methodLabel: 'YÖNTEM', methodTitle: 'Ciddi öz-keşif. Net sınırlar.',
    principles: [['Girdi odaklı', 'Profilin verdiğin ad ve doğum tarihinden hesaplanır. Aynı girdiler her zaman aynı profili üretir.'], ['Uygulanabilir', 'Her içgörü, gündelik kararlarda, işte ve ilişkilerde kullanılabilecek bir karşılık içerir.'], ['Açık uçlu', 'Profili hüküm olarak değil, bir bakış açısı olarak kullan. Değişebilir, ona ters düşebilir ve farklı seçebilirsin.']],
    disclaimer: 'Holyarted bağımsız bir öz-keşif ürünüdür. Herhangi bir üçüncü taraf sistem veya markayla bağlantılı değildir. Tanı veya öngörü değil, düşünme alanı sunar.', footer: 'Kendini anlamanın daha net bir yolu.',
  },
} as const;

export function Experience({ user, signInPath, signOutPath }: ExperienceProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [complete, setComplete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profile, setProfile] = useState(() => calculateDesign('Alex', 'Morgan', '1992-07-16'));
  const text = copy[locale];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const resultCards = useMemo(() => [text.decision[profile.decision], text.environments[profile.environment], text.frictions[profile.friction], text.purposes[profile.purpose]], [text, profile]);
  function begin() { document.querySelector('#assessment')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfile(calculateDesign(firstName, lastName, birthDate));
    setComplete(true);
    window.setTimeout(() => document.querySelector('#profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f1ede4] text-[#151816]">
      <nav className="relative z-50 border-b border-white/10 bg-[#111411] px-5 text-[#f3efe7] md:px-10">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Holyarted home"><span className="grid size-9 place-items-center border border-[#b98b5b]/60 text-sm font-bold">H</span><span className="text-xs font-bold tracking-[0.28em]">HOLYARTED</span></a>
          <div className="hidden items-center gap-8 lg:flex"><a href="#assessment" className="nav-link">{text.nav[0]}</a><a href="#profile" className="nav-link">{text.nav[1]}</a><a href="#method" className="nav-link">{text.nav[2]}</a><div className="flex items-center border-l border-white/15 pl-5 text-[11px] font-bold tracking-[0.12em]"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#d5a66f]' : 'text-white/50'}>EN</button><span className="mx-2 text-white/25">/</span><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#d5a66f]' : 'text-white/50'}>TR</button></div><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="inline-flex h-10 items-center gap-2 border border-white/25 px-5 text-xs font-bold transition hover:border-[#d5a66f] hover:text-[#d5a66f]">{user ? <UserRound className="size-4" /> : <LogIn className="size-4" />}{user ? text.account : text.signIn}</a></div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center border border-white/20 lg:hidden" aria-label={text.menu}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/10 pb-6 pt-4 lg:hidden"><div className="mx-auto grid max-w-[1400px] gap-4 text-sm"><a href="#assessment" onClick={() => setMenuOpen(false)}>{text.nav[0]}</a><a href="#profile" onClick={() => setMenuOpen(false)}>{text.nav[1]}</a><a href="#method" onClick={() => setMenuOpen(false)}>{text.nav[2]}</a><div className="flex gap-4"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#d5a66f]' : ''}>EN</button><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#d5a66f]' : ''}>TR</button></div><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'}>{user ? text.account : text.signIn}</a></div></div>}
      </nav>

      <section id="top" className="relative bg-[#111411] px-5 pb-20 pt-14 text-[#f3efe7] md:px-10 md:pb-28 md:pt-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b98b5b]/60 to-transparent" />
        <div className="mx-auto grid max-w-[1400px] gap-14 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow text-[#d5a66f]">{text.edition}</p>
            <h1 className="mt-7 font-heading text-[clamp(4rem,8.2vw,8.1rem)] font-medium leading-[0.84] tracking-[-0.062em]">
              <span className="block">{text.titleA}</span><span className="block italic text-[#d5a66f]">{text.titleB}</span>
            </h1>
            <p className="mt-9 max-w-2xl text-base leading-7 text-white/62 md:text-xl md:leading-8">{text.intro}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row"><button onClick={begin} className="premium-button">{text.start}<ArrowRight className="size-4" /></button><a href="#preview" className="secondary-button">{text.sample}</a></div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6">{text.trust.map((item) => <span key={item} className="inline-flex items-center gap-2 text-xs text-white/55"><Check className="size-3.5 text-[#d5a66f]" />{item}</span>)}</div>
          </div>
          <div id="assessment" className="scroll-mt-28 border border-white/15 bg-[#1a1e1a] shadow-[0_36px_90px_rgba(0,0,0,.3)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-8"><p className="text-[10px] font-bold tracking-[0.18em] text-[#d5a66f]">{text.panelLabel}</p><ShieldCheck className="size-4 text-white/35" /></div>
            <form onSubmit={calculate} className="p-6 md:p-9">
              <h2 className="max-w-xl font-heading text-3xl leading-tight md:text-4xl">{text.panelTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">{text.panelCopy}</p>
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-white/40"><span>{text.progress}</span><span>01 · 03</span></div>
                <div className="h-px bg-white/10"><div className="h-px w-full bg-[#d5a66f]" /></div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-bold text-white/65">{text.firstName}<input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder={text.firstPlaceholder} autoComplete="given-name" className="h-14 border border-white/15 bg-white/[0.03] px-4 text-base font-normal text-[#f3efe7] outline-none transition placeholder:text-white/25 focus:border-[#d5a66f]" required /></label>
                  <label className="grid gap-2 text-xs font-bold text-white/65">{text.lastName}<input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={text.lastPlaceholder} autoComplete="family-name" className="h-14 border border-white/15 bg-white/[0.03] px-4 text-base font-normal text-[#f3efe7] outline-none transition placeholder:text-white/25 focus:border-[#d5a66f]" required /></label>
                  <label className="grid gap-2 text-xs font-bold text-white/65 sm:col-span-2">{text.birthDate}<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className="h-14 border border-white/15 bg-white/[0.03] px-4 text-base font-normal text-[#f3efe7] [color-scheme:dark] outline-none transition focus:border-[#d5a66f]" required /></label>
                </div>
                <div className="mt-7 flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center"><p className="max-w-sm text-[11px] leading-5 text-white/35">{text.inputNote}</p><button type="submit" className="premium-button h-12 shrink-0 px-5">{text.finish}<ArrowRight className="size-4" /></button></div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section id="preview" className="px-5 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"><div className="lg:sticky lg:top-28"><p className="eyebrow text-[#93683f]">{text.previewLabel}</p><h2 className="mt-5 max-w-lg font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.previewTitle}</h2><p className="mt-6 max-w-md leading-7 text-[#151816]/60">{text.previewCopy}</p><Image src="/og.png" width={1200} height={630} alt="Holyarted editorial identity" className="mt-9 w-full border border-[#151816]/15" /></div><div className="grid border-t border-[#151816]/20">{text.sections.map((label, index) => <div key={label} className="grid gap-3 border-b border-[#151816]/15 py-8 sm:grid-cols-[9rem_1fr] sm:gap-8"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#93683f]">{label}</p><div><h3 className="font-heading text-3xl">{resultCards[index][0]}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#151816]/58">{resultCards[index][1]}</p></div></div>)}</div></div></section>

      <section id="profile" className="scroll-mt-20 bg-[#c99a67] px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]">{complete ? <div><div className="grid gap-10 border-b border-[#151816]/25 pb-14 lg:grid-cols-[0.65fr_1.35fr]"><div><p className="eyebrow">{text.profileLabel}</p><p className="mt-4 text-xs text-[#151816]/55">{text.profileFor}</p><p className="mt-2 font-heading text-2xl">{profile.fullName}</p></div><div><h2 className="font-heading text-6xl leading-[0.9] tracking-[-0.05em] md:text-8xl">{text.profileNames[profile.purpose]}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-[#151816]/70">{text.profileIntros[profile.purpose]}</p></div></div><div className="grid md:grid-cols-2">{resultCards.map(([title, body], index) => <article key={title} className={`min-h-72 border-b border-[#151816]/20 py-9 md:p-9 ${index % 2 === 0 ? 'md:border-r' : ''}`}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#151816]/55">{text.sections[index]}</p><h3 className="mt-10 font-heading text-4xl">{title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[#151816]/68">{body}</p></article>)}</div><div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-[#151816]/25 pt-8 sm:flex-row sm:items-center"><button onClick={() => { setComplete(false); begin(); }} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"><ArrowLeft className="size-4" />{text.restart}</button><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="inline-flex h-12 items-center gap-2 bg-[#111411] px-6 text-xs font-bold text-[#f3efe7]">{user ? text.saveIn : text.saveOut}<ArrowRight className="size-4" /></a></div></div> : <div className="grid items-end gap-10 lg:grid-cols-2"><div><p className="eyebrow">{text.profileLabel}</p><h2 className="mt-6 font-heading text-6xl leading-[0.9] tracking-[-0.045em] md:text-8xl">{text.profileNames[profile.purpose]}</h2></div><div className="max-w-xl lg:justify-self-end"><p className="text-lg leading-8 text-[#151816]/70">{text.profileIntros[profile.purpose]}</p><button onClick={begin} className="mt-8 inline-flex h-12 items-center gap-2 bg-[#111411] px-6 text-xs font-bold text-[#f3efe7]">{text.start}<ArrowRight className="size-4" /></button></div></div>}</div></section>

      <section className="bg-[#111411] px-5 py-20 text-[#f3efe7] md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="eyebrow text-[#d5a66f]">{text.savePrompt}</p><h2 className="mt-5 max-w-3xl font-heading text-5xl leading-[0.95] md:text-7xl">{user ? `${text.account}: ${user.displayName}` : text.savePrompt}</h2><p className="mt-6 max-w-xl leading-7 text-white/50">{text.saveCopy}</p></div><a href={user ? '/profile' : signInPath} target={user ? undefined : '_top'} className="premium-button lg:justify-self-end">{user ? text.saveIn : text.saveOut}<ArrowRight className="size-4" /></a></div></section>

      <section id="method" className="px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]"><p className="eyebrow text-[#93683f]">{text.methodLabel}</p><h2 className="mt-5 max-w-4xl font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.methodTitle}</h2><div className="mt-14 grid border-y border-[#151816]/20 md:grid-cols-3">{text.principles.map(([title, body], index) => <article key={title} className={`py-8 md:min-h-64 md:p-8 ${index < 2 ? 'border-b border-[#151816]/15 md:border-b-0 md:border-r' : ''}`}><span className="text-[10px] font-bold tracking-[0.18em] text-[#93683f]">0{index + 1}</span><h3 className="mt-12 font-heading text-3xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[#151816]/58">{body}</p></article>)}</div><p className="mt-8 max-w-3xl text-xs leading-6 text-[#151816]/45">{text.disclaimer}</p></div></section>

      <footer className="border-t border-[#151816]/15 px-5 py-8 md:px-10"><div className="mx-auto flex max-w-[1400px] flex-col gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#151816]/50 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Holyarted</span><span>{text.footer}</span>{user && <a href={signOutPath} target="_top" className="inline-flex items-center gap-2 hover:text-[#151816]"><LogOut className="size-3.5" />{text.signOut}</a>}</div></footer>
    </main>
  );
}
