'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { calculateDesign } from '@/lib/profile-engine';
import type { PublicAuthConfig } from '@/lib/runtime-config';
import { useHolyartedAccount } from './use-holyarted-account';

type Locale = 'en' | 'tr';
type ExperienceProps = { authConfig: PublicAuthConfig | null };

const copy = {
  en: {
    nav: ['Discover', 'Your portrait', 'Membership', 'Approach'], signIn: 'Continue with Google', account: 'Account', signOut: 'Sign out', menu: 'Menu',
    edition: 'A private Human Design experience', titleA: 'Meet the person', titleB: 'you are becoming.',
    intro: 'A refined portrait of how you think, decide, connect and grow—translated into clear guidance you can use in real life.',
    start: 'Discover my design', sample: 'Preview the experience', trust: ['Personal to you', 'Private by design', 'No fixed labels'],
    panelLabel: 'PERSONAL PORTRAIT · PRIVATE SESSION', panelTitle: 'Your private portrait begins here.', panelCopy: 'A few details are all it takes to begin. Your individual reading will unfold in moments.',
    progress: 'Your private profile', inputLabel: 'PRIVATE INPUT', back: 'Back', next: 'Continue', finish: 'Reveal my portrait', calculating: 'Creating your personal portrait', calculatingNote: 'Your individual reading is taking shape…', focusHint: 'Select an insight to bring it into focus',
    firstName: 'First name', firstPlaceholder: 'Your first name', lastName: 'Last name', lastPlaceholder: 'Your last name', birthDate: 'Date of birth', inputNote: 'Your details stay private and are never shown publicly.', invalidProfile: 'Please enter a complete name and a valid birth date.',
    questions: [
      { eyebrow: 'DECISION STYLE', title: 'When a decision matters, what helps you trust it?', options: { facts: ['Clear facts', 'I want the evidence in front of me.'], voice: ['Talking it through', 'I hear what I think as I say it.'], instinct: ['An immediate inner response', 'I notice a clear yes or no early.'], time: ['Time to settle', 'Clarity arrives after the first reaction passes.'] } },
      { eyebrow: 'BEST ENVIRONMENT', title: 'Where do you do your best thinking?', options: { quiet: ['Quiet structure', 'A protected space with a clear plan.'], together: ['A collaborative room', 'Ideas sharpen around trusted people.'], variety: ['Changing inputs', 'New perspectives and settings keep me engaged.'], motion: ['Hands-on momentum', 'Thinking becomes clear while I make or move.'] } },
      { eyebrow: 'FRICTION PATTERN', title: 'What wears you down fastest?', options: { switching: ['Constant switching', 'Too many open threads dilute my attention.'], ambiguity: ['Unclear expectations', 'I struggle when the target keeps moving.'], access: ['Always being available', 'My own priorities disappear behind other people’s needs.'], stagnation: ['Too little movement', 'Repetition without progress makes me withdraw.'] } },
      { eyebrow: 'PURPOSE DIRECTION', title: 'What kind of contribution feels most meaningful?', options: { build: ['Building something lasting', 'I want my work to become useful and dependable.'], guide: ['Guiding people', 'I want to make complexity easier to navigate.'], create: ['Creating new possibilities', 'I want to give form to what does not exist yet.'], connect: ['Connecting people', 'I want the right people and ideas to find each other.'] } },
    ],
    previewLabel: 'A portrait you can use', previewTitle: 'See yourself more clearly.', previewCopy: 'Your portrait turns personal patterns into practical guidance for work, relationships, decisions and direction.',
    profileLabel: 'YOUR PERSONAL PORTRAIT', profileFor: 'Prepared privately for',
    profileNames: { build: 'The Intentional Builder', guide: 'The Grounded Guide', create: 'The Original Maker', connect: 'The Human Connector' },
    profileIntros: { build: 'You find meaning by turning a clear intention into something people can rely on.', guide: 'You find meaning by helping people see what matters and move forward with confidence.', create: 'You find meaning by making room for original ideas and giving them a useful form.', connect: 'You find meaning by noticing relationships others miss and bringing people into better conversation.' },
    sections: ['Decision style', 'Best environment', 'Watch for', 'Purpose direction'],
    decision: { facts: ['Evidence first', 'You make stronger choices when the relevant facts are visible. Define the decision, gather what changes the outcome, then stop researching.'], voice: ['Clarity in conversation', 'A trusted conversation helps you separate your own view from outside noise. Ask for reflection, not instructions.'], instinct: ['Respect the first signal', 'Your earliest response often contains useful information. Notice it, then verify it against reality before committing.'], time: ['Let clarity mature', 'Important choices improve when you allow the first reaction to settle. Set a decision time so reflection does not become delay.'] },
    environments: { quiet: ['Protected focus', 'You do your best work with defined priorities, fewer interruptions and enough room to think deeply.'], together: ['Trusted collaboration', 'Your thinking becomes more precise around people who challenge ideas without competing for attention.'], variety: ['Fresh perspective', 'You stay engaged when your work includes new inputs, changing contexts and room to connect different ideas.'], motion: ['Progress you can touch', 'You understand problems by acting on them. Prototypes, drafts and physical movement help thought become clear.'] },
    frictions: { switching: ['Protect continuity', 'Too many parallel demands can make you mistake motion for progress. Keep one primary thread visible and park the rest.'], ambiguity: ['Name the finish line', 'Unclear expectations quietly consume your attention. Before starting, agree what “done” needs to look like.'], access: ['Make access intentional', 'Being useful can become over-availability. Decide when you are open to others and when your priorities are protected.'], stagnation: ['Create visible movement', 'Repetition is hardest when its purpose disappears. Link routine work to a meaningful outcome or change the method.'] },
    purposes: { build: ['Make the useful thing real', 'Your direction is not a job title. It is a recurring contribution: creating structures, products or practices that hold up over time.'], guide: ['Turn complexity into direction', 'Your direction is to help people orient themselves—through teaching, leadership, care or clear communication.'], create: ['Give new ideas a form', 'Your direction is to open possibilities, then shape the strongest one into work others can experience and use.'], connect: ['Strengthen the human network', 'Your direction is to create understanding across people, disciplines or communities that would otherwise remain separate.'] },
    restart: 'Create another portrait', savePrompt: 'Keep your portrait close.', saveCopy: 'Continue with your Google account to return to your private space and keep your membership in one place.', saveIn: 'Open my account', saveOut: 'Continue with Google', portraitSaving: 'Saving to your private space…', portraitSaved: 'Saved to your private space', portraitSaveFailed: 'Your portrait is ready, but it could not be saved. Please try again.', lockedTitle: 'Two deeper chapters are waiting.', lockedCopy: 'Plus unlocks your complete portrait. Premium adds dedicated relationship and work lenses.',
    extendedSections: ['Relationship lens', 'Work lens'],
    relationships: { quiet: ['Space makes connection clearer', 'You relate best when closeness still leaves room for quiet thought and an unhurried response.'], together: ['Trust grows through conversation', 'Shared thinking helps you feel known. The right relationships make room for both honesty and exchange.'], variety: ['Curiosity keeps connection alive', 'You connect through fresh experiences, evolving conversations and room to keep discovering one another.'], motion: ['Connection deepens through doing', 'Shared plans, movement and making something together often say more to you than prolonged analysis.'] },
    workLenses: { build: ['Make reliability your signature', 'Your strongest work turns intention into something clear, useful and built to last.'], guide: ['Make direction your signature', 'Your strongest work helps people find the next clear step without taking their agency away.'], create: ['Make originality useful', 'Your strongest work gives an unexpected idea enough structure to become real for other people.'], connect: ['Make understanding possible', 'Your strongest work brings people, perspectives and opportunities into a more meaningful relationship.'] },
    membershipLabel: 'MEMBERSHIP', membershipTitle: 'Choose how deeply you want to explore.', membershipCopy: 'Start free. Upgrade when you want the complete portrait. Payments, invoices and cancellations are handled securely through Stripe.', currentPlan: 'Current plan', manageBilling: 'Manage billing', popular: 'MOST CHOSEN',
    plans: [
      { id: 'basic', name: 'Basic', price: '€0', cadence: 'forever', description: 'A clear first look at your personal portrait.', features: ['Core portrait', 'Decision style', 'Best environment'], cta: 'Continue free' },
      { id: 'plus', name: 'Plus', price: '€8.99', cadence: 'per month', description: 'The complete portrait for everyday reflection.', features: ['Everything in Basic', 'Friction pattern', 'Purpose direction', 'Private member account'], cta: 'Choose Plus' },
      { id: 'premium', name: 'Premium', price: '€14.99', cadence: 'per month', description: 'A deeper view of how you relate and contribute.', features: ['Everything in Plus', 'Relationship lens', 'Work lens', 'New portrait chapters'], cta: 'Choose Premium' },
    ],
    methodLabel: 'OUR APPROACH', methodTitle: 'Personal insight. Clear boundaries.',
    principles: [['Personal by design', 'Every portrait follows a consistent private method while remaining individual to the person.'], ['Practical', 'Each insight includes a way to apply it in ordinary decisions, work and relationships.'], ['Open-ended', 'Use the portrait as a lens, not a verdict. You are allowed to change, contradict it and choose differently.']],
    disclaimer: 'Holyarted is an independent self-inquiry product and is not affiliated with any third-party system or brand. It offers reflective guidance, not medical or psychological diagnosis.', footer: 'A clearer way to understand yourself.',
  },
  tr: {
    nav: ['Keşfet', 'Portren', 'Üyelik', 'Yaklaşım'], signIn: 'Google ile devam et', account: 'Hesap', signOut: 'Çıkış yap', menu: 'Menü',
    edition: 'Özel bir Human Design deneyimi', titleA: 'Dönüştüğün kişiyi', titleB: 'daha yakından tanı.',
    intro: 'Nasıl düşündüğünü, karar verdiğini, bağ kurduğunu ve geliştiğini gerçek hayatta kullanabileceğin net bir rehbere dönüştüren rafine bir portre.',
    start: 'Tasarımımı keşfet', sample: 'Deneyimi önizle', trust: ['Sana özel', 'Gizlilik odaklı', 'Sabit etiket yok'],
    panelLabel: 'KİŞİSEL PORTRE · ÖZEL OTURUM', panelTitle: 'Özel portren burada başlıyor.', panelCopy: 'Başlamak için birkaç bilgi yeterli. Sana özel okuma kısa süre içinde şekillenecek.',
    progress: 'Özel profilin', inputLabel: 'KİŞİSEL GİRDİ', back: 'Geri', next: 'Devam et', finish: 'Portremi göster', calculating: 'Kişisel portren hazırlanıyor', calculatingNote: 'Sana özel okuma şekilleniyor…', focusHint: 'Odağa almak için bir içgörü seç',
    firstName: 'Ad', firstPlaceholder: 'Adın', lastName: 'Soyad', lastPlaceholder: 'Soyadın', birthDate: 'Doğum tarihi', inputNote: 'Bilgilerin gizli kalır ve hiçbir zaman herkese açık gösterilmez.', invalidProfile: 'Lütfen adını, soyadını ve geçerli bir doğum tarihini gir.',
    questions: [
      { eyebrow: 'KARAR BİÇİMİ', title: 'Önemli bir kararda neye güvenmek sana en çok yardımcı olur?', options: { facts: ['Net bilgiler', 'Gerekli veriyi önümde görmek isterim.'], voice: ['Konuşarak düşünmek', 'Ne düşündüğümü söylerken daha iyi duyarım.'], instinct: ['İlk iç tepki', 'Başta belirgin bir evet ya da hayır fark ederim.'], time: ['Zamana bırakmak', 'İlk tepki geçince netlik gelir.'] } },
      { eyebrow: 'EN İYİ ORTAM', title: 'En iyi nerede düşünürsün?', options: { quiet: ['Sessiz düzen', 'Korunaklı bir alan ve net bir plan.'], together: ['Birlikte düşünmek', 'Güvendiğim insanların yanında fikirlerim keskinleşir.'], variety: ['Değişen uyaranlar', 'Yeni bakış açıları ve ortamlar ilgimi canlı tutar.'], motion: ['Hareket içinde', 'Üretirken veya hareket ederken düşüncem netleşir.'] } },
      { eyebrow: 'ZORLANMA ÖRÜNTÜSÜ', title: 'Seni en hızlı ne tüketir?', options: { switching: ['Sürekli konu değiştirmek', 'Çok fazla açık iş dikkatimi dağıtır.'], ambiguity: ['Belirsiz beklentiler', 'Hedef sürekli değiştiğinde zorlanırım.'], access: ['Her an ulaşılabilir olmak', 'Başkalarının ihtiyaçları önceliklerimi görünmez kılar.'], stagnation: ['İlerlemenin olmaması', 'Sonuç vermeyen tekrar beni geri çeker.'] } },
      { eyebrow: 'AMAÇ YÖNÜ', title: 'Hangi katkı biçimi sana en anlamlı geliyor?', options: { build: ['Kalıcı bir şey kurmak', 'İşimin faydalı ve güvenilir olmasını isterim.'], guide: ['İnsanlara yol göstermek', 'Karmaşıklığı daha anlaşılır hale getirmek isterim.'], create: ['Yeni olasılıklar yaratmak', 'Henüz var olmayan şeye biçim vermek isterim.'], connect: ['İnsanları buluşturmak', 'Doğru insanların ve fikirlerin birbirini bulmasını isterim.'] } },
    ],
    previewLabel: 'Kullanabileceğin bir portre', previewTitle: 'Kendini daha net gör.', previewCopy: 'Portren; kişisel örüntüleri iş, ilişkiler, kararlar ve yön için uygulanabilir bir rehbere dönüştürür.',
    profileLabel: 'KİŞİSEL PORTREN', profileFor: 'Özel olarak hazırlandı',
    profileNames: { build: 'Niyetli Kurucu', guide: 'Sağlam Rehber', create: 'Özgün Üretici', connect: 'İnsanları Buluşturan' },
    profileIntros: { build: 'Net bir niyeti insanların güvenebileceği bir şeye dönüştürdüğünde anlam bulursun.', guide: 'İnsanların önemli olanı görmesine ve güvenle ilerlemesine yardım ettiğinde anlam bulursun.', create: 'Özgün fikirlere alan açıp onlara işe yarar bir biçim verdiğinde anlam bulursun.', connect: 'Başkalarının kaçırdığı ilişkileri fark edip insanları daha iyi bir konuşmada buluşturduğunda anlam bulursun.' },
    sections: ['Karar biçimi', 'En iyi ortam', 'Dikkat et', 'Amaç yönü'],
    decision: { facts: ['Önce kanıt', 'İlgili bilgiler görünür olduğunda daha güçlü seçimler yaparsın. Kararı tanımla, sonucu değiştiren veriyi topla ve araştırmayı bitir.'], voice: ['Konuşmada netlik', 'Güvenilir bir konuşma, kendi görüşünü dış seslerden ayırmana yardım eder. Yönlendirme değil, yansıtma iste.'], instinct: ['İlk sinyali ciddiye al', 'İlk tepkin çoğu zaman değerli bilgi taşır. Fark et, sonra karar vermeden önce gerçeklikle karşılaştır.'], time: ['Netliğin olgunlaşsın', 'Önemli seçimler, ilk tepkinin yatışmasına izin verdiğinde iyileşir. Düşünmenin ertelemeye dönüşmemesi için karar zamanı belirle.'] },
    environments: { quiet: ['Korunan odak', 'Net öncelikler, daha az bölünme ve derin düşünme alanı olduğunda en iyi işini çıkarırsın.'], together: ['Güvenilir işbirliği', 'Fikirlerle rekabet etmeden onları zorlayan insanların yanında düşüncen daha kesin hale gelir.'], variety: ['Taze bakış', 'İşin yeni girdiler, değişen bağlamlar ve farklı fikirleri birleştirme alanı içerdiğinde ilgini korursun.'], motion: ['Dokunabildiğin ilerleme', 'Problemleri onlara etki ederek anlarsın. Taslaklar, denemeler ve fiziksel hareket düşünceni netleştirir.'] },
    frictions: { switching: ['Sürekliliği koru', 'Çok fazla eşzamanlı talep, hareketi ilerleme sanmana neden olabilir. Tek bir ana işi görünür tut, diğerlerini beklet.'], ambiguity: ['Bitiş çizgisini adlandır', 'Belirsiz beklentiler dikkatini sessizce tüketir. Başlamadan önce “bitti”nin nasıl görüneceğini netleştir.'], access: ['Ulaşılabilirliği bilinçli seç', 'Faydalı olmak aşırı ulaşılabilirliğe dönüşebilir. Başkalarına ne zaman açık, kendi önceliklerine ne zaman kapalı olduğunu belirle.'], stagnation: ['Görünür ilerleme yarat', 'Tekrarın amacı kaybolduğunda zorlanırsın. Rutin işi anlamlı bir sonuca bağla veya yöntemini değiştir.'] },
    purposes: { build: ['Faydalı olanı gerçeğe dönüştür', 'Yönün bir iş unvanı değil, tekrarlayan bir katkıdır: zamana dayanan yapılar, ürünler veya uygulamalar kurmak.'], guide: ['Karmaşıklığı yöne dönüştür', 'Yönün; öğretme, liderlik, bakım veya açık iletişim aracılığıyla insanların kendini konumlandırmasına yardım etmek.'], create: ['Yeni fikre biçim ver', 'Yönün olasılık açmak, ardından en güçlü olanı başkalarının deneyimleyip kullanabileceği bir işe dönüştürmek.'], connect: ['İnsan ağını güçlendir', 'Yönün normalde ayrı kalacak insanlar, alanlar veya topluluklar arasında anlayış yaratmak.'] },
    restart: 'Başka bir portre oluştur', savePrompt: 'Portreni yanında tut.', saveCopy: 'Özel alanına geri dönmek ve üyeliğini tek yerde tutmak için Google hesabınla devam et.', saveIn: 'Hesabımı aç', saveOut: 'Google ile devam et', portraitSaving: 'Kişisel alanına kaydediliyor…', portraitSaved: 'Kişisel alanına kaydedildi', portraitSaveFailed: 'Portren hazır, ancak kaydedilemedi. Lütfen tekrar dene.', lockedTitle: 'İki derin bölüm seni bekliyor.', lockedCopy: 'Plus tam portrenin kilidini açar. Premium ise ilişki ve iş yaşamına özel bakışlar ekler.',
    extendedSections: ['İlişki bakışı', 'İş yaşamı bakışı'],
    relationships: { quiet: ['Alan, bağı daha net kılar', 'Yakınlığın içinde sessiz düşünmeye ve acele etmeden yanıt vermeye yer olduğunda daha iyi bağ kurarsın.'], together: ['Güven konuşmayla büyür', 'Birlikte düşünmek kendini anlaşılmış hissettirir. Doğru ilişkiler hem dürüstlüğe hem alışverişe alan açar.'], variety: ['Merak bağı canlı tutar', 'Yeni deneyimler, gelişen konuşmalar ve birbirini yeniden keşfetme alanı bağını besler.'], motion: ['Bağ birlikte yaparken derinleşir', 'Ortak planlar, hareket ve birlikte bir şey üretmek sana uzun analizlerden daha çok şey söyleyebilir.'] },
    workLenses: { build: ['Güvenilirliği imzan yap', 'En güçlü işin niyeti net, faydalı ve zamana dayanacak bir şeye dönüştürür.'], guide: ['Yön vermeyi imzan yap', 'En güçlü işin insanların kendi iradesini elinden almadan bir sonraki net adımı görmesine yardım eder.'], create: ['Özgünlüğü faydaya dönüştür', 'En güçlü işin beklenmedik bir fikre başkaları için gerçek olacak kadar yapı kazandırır.'], connect: ['Anlayışı mümkün kıl', 'En güçlü işin insanları, bakış açılarını ve fırsatları daha anlamlı bir ilişkide buluşturur.'] },
    membershipLabel: 'ÜYELİK', membershipTitle: 'Ne kadar derine inmek istediğini seç.', membershipCopy: 'Ücretsiz başla. Tam portreni istediğinde yükselt. Ödemeler, faturalar ve iptaller Stripe üzerinden güvenle yönetilir.', currentPlan: 'Mevcut plan', manageBilling: 'Ödemeyi yönet', popular: 'EN ÇOK SEÇİLEN',
    plans: [
      { id: 'basic', name: 'Basic', price: '€0', cadence: 'süresiz', description: 'Kişisel portrene net bir ilk bakış.', features: ['Temel portre', 'Karar biçimi', 'En iyi ortam'], cta: 'Ücretsiz devam et' },
      { id: 'plus', name: 'Plus', price: '€8.99', cadence: 'aylık', description: 'Gündelik düşünme için tam portre.', features: ['Basic içeriğinin tamamı', 'Zorlanma örüntüsü', 'Amaç yönü', 'Özel üye hesabı'], cta: 'Plus seç' },
      { id: 'premium', name: 'Premium', price: '€14.99', cadence: 'aylık', description: 'İlişkilerine ve katkına daha derin bir bakış.', features: ['Plus içeriğinin tamamı', 'İlişki bakışı', 'İş yaşamı bakışı', 'Yeni portre bölümleri'], cta: 'Premium seç' },
    ],
    methodLabel: 'YAKLAŞIMIMIZ', methodTitle: 'Kişisel içgörü. Net sınırlar.',
    principles: [['Kişiye özel', 'Her portre tutarlı ve gizli bir yöntem izlerken kişiye özgü kalır.'], ['Uygulanabilir', 'Her içgörü, gündelik kararlarda, işte ve ilişkilerde kullanılabilecek bir karşılık içerir.'], ['Açık uçlu', 'Portreyi hüküm olarak değil, bir bakış açısı olarak kullan. Değişebilir, ona ters düşebilir ve farklı seçebilirsin.']],
    disclaimer: 'Holyarted bağımsız bir öz-keşif ürünüdür ve herhangi bir üçüncü taraf sistem veya markayla bağlantılı değildir. Tıbbi veya psikolojik tanı değil, düşünmeye yardımcı bir rehberlik sunar.', footer: 'Kendini anlamanın daha net bir yolu.',
  },
} as const;

export function Experience({ authConfig }: ExperienceProps) {
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
  const restoredForUser = useRef<string | null>(null);
  const { user, membership, pending, error, setError, signInWithGoogle, signOut, startCheckout, openBillingPortal, loadPortrait, savePortrait } = useHolyartedAccount(authConfig);
  const text = copy[locale];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const resultCards = useMemo(() => [text.decision[profile.decision], text.environments[profile.environment], text.frictions[profile.friction], text.purposes[profile.purpose]], [text, profile]);
  const visibleResultCards = membership.plan === 'basic' ? resultCards.slice(0, 2) : resultCards;
  const extendedCards = useMemo(() => [text.relationships[profile.environment], text.workLenses[profile.purpose]], [text, profile]);
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
      window.setTimeout(() => document.querySelector('#profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : text.portraitSaveFailed));
  }, [loadPortrait, setError, text.portraitSaveFailed, user]);
  function begin() { document.querySelector('#assessment')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      firstName: String(form.get('firstName') ?? ''),
      lastName: String(form.get('lastName') ?? ''),
      birthDate: String(form.get('birthDate') ?? ''),
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
      return;
    }
    setComplete(false);
    setIsCalculating(true);
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
    <main onPointerMove={(event) => { event.currentTarget.style.setProperty('--pointer-x', `${event.clientX}px`); event.currentTarget.style.setProperty('--pointer-y', `${event.clientY}px`); }} className="premium-canvas min-h-screen overflow-hidden bg-[#f7f3ec] text-[#514b46]">
      {error && <div role="alert" className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-[#9b5e55]/20 bg-[#fbf8f2] px-4 py-3 text-sm shadow-[0_16px_45px_rgba(81,75,70,.18)]"><span className="flex-1">{error}</span><button onClick={() => setError(null)} aria-label="Dismiss"><X className="size-4" /></button></div>}
      <nav className="relative z-50 border-b border-[#625b55]/10 bg-[#f7f3ec]/95 px-5 text-[#514b46] backdrop-blur-md md:px-10">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between">
          <a href="#top" className="flex items-center gap-3" aria-label="Holyarted home"><span className="grid size-9 place-items-center border border-[#a7826c]/55 font-heading text-base text-[#7d695d]">H</span><span className="font-heading text-sm tracking-[0.24em]">HOLYARTED</span></a>
          <div className="hidden items-center gap-8 lg:flex"><a href="#assessment" className="nav-link">{text.nav[0]}</a><a href="#profile" className="nav-link">{text.nav[1]}</a><a href="#membership" className="nav-link">{text.nav[2]}</a><a href="#method" className="nav-link">{text.nav[3]}</a><div className="flex items-center border-l border-[#625b55]/15 pl-5 text-[11px] font-bold tracking-[0.12em]"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#8f705e]' : 'text-[#514b46]/45'}>EN</button><span className="mx-2 text-[#514b46]/20">/</span><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#8f705e]' : 'text-[#514b46]/45'}>TR</button></div>{user ? <a href="/profile" className="inline-flex h-10 items-center gap-2 border border-[#625b55]/25 px-5 text-xs font-bold transition hover:border-[#8f705e] hover:text-[#8f705e]"><UserRound className="size-4" />{text.account}</a> : <button onClick={signInWithGoogle} className="inline-flex h-10 items-center gap-2 border border-[#625b55]/25 px-5 text-xs font-bold transition hover:border-[#8f705e] hover:text-[#8f705e]"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46] shadow-sm">G</span>{text.signIn}</button>}</div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center border border-[#625b55]/20 lg:hidden" aria-label={text.menu}>{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        {menuOpen && <div className="border-t border-[#625b55]/10 pb-6 pt-4 lg:hidden"><div className="mx-auto grid max-w-[1400px] gap-4 text-sm"><a href="#assessment" onClick={() => setMenuOpen(false)}>{text.nav[0]}</a><a href="#profile" onClick={() => setMenuOpen(false)}>{text.nav[1]}</a><a href="#membership" onClick={() => setMenuOpen(false)}>{text.nav[2]}</a><a href="#method" onClick={() => setMenuOpen(false)}>{text.nav[3]}</a><div className="flex gap-4"><button onClick={() => setLocale('en')} className={locale === 'en' ? 'text-[#8f705e]' : ''}>EN</button><button onClick={() => setLocale('tr')} className={locale === 'tr' ? 'text-[#8f705e]' : ''}>TR</button></div>{user ? <a href="/profile">{text.account}</a> : <button className="text-left" onClick={signInWithGoogle}>{text.signIn}</button>}</div></div>}
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

      <section id="preview" className="view-reveal px-5 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"><div className="lg:sticky lg:top-28"><p className="eyebrow text-[#8f705e]">{text.previewLabel}</p><h2 className="mt-5 max-w-lg font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.previewTitle}</h2><p className="mt-6 max-w-md leading-7 text-[#514b46]/60">{text.previewCopy}</p><div className="image-lift mt-9 overflow-hidden border border-[#625b55]/12"><Image src="/og.png" width={1200} height={630} alt="Holyarted editorial identity" className="w-full transition duration-700 hover:scale-[1.025]" /></div></div><div><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/38">{text.focusHint}</p><div className="grid border-t border-[#625b55]/18">{text.sections.map((label, index) => <button type="button" onClick={() => setActiveCard(activeCard === index ? null : index)} key={label} className={`insight-row grid gap-3 border-b border-[#625b55]/14 py-8 text-left sm:grid-cols-[9rem_1fr] sm:gap-8 ${activeCard === index ? 'is-active' : ''}`}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{label}</p><div><h3 className="font-heading text-3xl">{resultCards[index][0]}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#514b46]/58">{resultCards[index][1]}</p><span className="insight-line mt-6 block h-px w-0 bg-[#a7826c]" /></div></button>)}</div></div></div></section>

      <section id="profile" className="scroll-mt-20 bg-[#dcc4b8] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          {complete ? <div>
            <div className="grid gap-10 border-b border-[#625b55]/22 pb-14 lg:grid-cols-[0.65fr_1.35fr]">
              <div><p className="eyebrow">{text.profileLabel}</p><p className="mt-4 text-xs text-[#514b46]/55">{text.profileFor}</p><p className="mt-2 font-heading text-2xl">{profile.fullName}</p>{user && portraitStatus !== 'idle' && <p className="mt-4 text-xs font-bold text-[#514b46]/52">{portraitStatus === 'saving' ? text.portraitSaving : text.portraitSaved}</p>}</div>
              <div><h2 className="font-heading text-6xl leading-[0.9] tracking-[-0.05em] md:text-8xl">{text.profileNames[profile.purpose]}</h2><p className="mt-7 max-w-3xl text-lg leading-8 text-[#514b46]/70">{text.profileIntros[profile.purpose]}</p></div>
            </div>
            <div className="grid md:grid-cols-2">{visibleResultCards.map(([title, body], index) => <article key={title} className={`profile-result-card min-h-72 border-b border-[#625b55]/18 py-9 md:p-9 ${index % 2 === 0 ? 'md:border-r' : ''}`} style={{ animationDelay: `${index * 110}ms` }}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#514b46]/55">{text.sections[index]}</p><h3 className="mt-10 font-heading text-4xl">{title}</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[#514b46]/68">{body}</p></article>)}</div>
            {membership.plan === 'basic' && <div className="mt-8 grid items-center gap-7 rounded-[2rem] border border-[#625b55]/18 bg-[#f7f3ec]/45 p-7 md:grid-cols-[1fr_auto] md:p-10"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f705e]"><LockKeyhole className="size-4" />Plus & Premium</div><h3 className="mt-4 font-heading text-4xl">{text.lockedTitle}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[#514b46]/62">{text.lockedCopy}</p></div><button onClick={() => document.querySelector('#membership')?.scrollIntoView({ behavior: 'smooth' })} className="premium-button">{text.nav[2]}<ArrowRight className="size-4" /></button></div>}
            {membership.plan === 'premium' && <div className="mt-8 grid gap-4 md:grid-cols-2">{extendedCards.map(([title, body], index) => <article key={title} className="rounded-[2rem] bg-[#f7f3ec]/55 p-7 md:p-9"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f705e]">{text.extendedSections[index]}</p><h3 className="mt-8 font-heading text-4xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[#514b46]/68">{body}</p></article>)}</div>}
            <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-[#625b55]/22 pt-8 sm:flex-row sm:items-center"><button onClick={() => { setComplete(false); begin(); }} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]"><ArrowLeft className="size-4" />{text.restart}</button>{user ? <a href="/profile" className="inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">{text.saveIn}<ArrowRight className="size-4" /></a> : <button onClick={signInWithGoogle} className="inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46]">G</span>{text.saveOut}</button>}</div>
          </div> : <div className="grid items-end gap-10 lg:grid-cols-2"><div><p className="eyebrow">{text.profileLabel}</p><h2 className="mt-6 font-heading text-6xl leading-[0.9] tracking-[-0.045em] md:text-8xl">{text.profileNames[profile.purpose]}</h2></div><div className="max-w-xl lg:justify-self-end"><p className="text-lg leading-8 text-[#514b46]/70">{text.profileIntros[profile.purpose]}</p><button onClick={begin} className="mt-8 inline-flex h-12 items-center gap-2 bg-[#625b55] px-6 text-xs font-bold text-[#f7f3ec]">{text.start}<ArrowRight className="size-4" /></button></div></div>}
        </div>
      </section>

      <section className="bg-[#bfc8ba] px-5 py-20 text-[#514b46] md:px-10 md:py-28"><div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="eyebrow text-[#7d695d]">{text.savePrompt}</p><h2 className="mt-5 max-w-3xl font-heading text-5xl leading-[0.95] md:text-7xl">{user ? `${text.account}: ${user.displayName}` : text.savePrompt}</h2><p className="mt-6 max-w-xl leading-7 text-[#514b46]/58">{text.saveCopy}</p></div>{user ? <a href="/profile" className="premium-button lg:justify-self-end">{text.saveIn}<ArrowRight className="size-4" /></a> : <button onClick={signInWithGoogle} className="premium-button lg:justify-self-end"><span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#514b46]">G</span>{text.saveOut}</button>}</div></section>

      <section id="membership" className="scroll-mt-20 bg-[#f7f3ec] px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]"><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="eyebrow text-[#8f705e]">{text.membershipLabel}</p><h2 className="mt-5 font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.membershipTitle}</h2></div><p className="max-w-xl text-base leading-8 text-[#514b46]/60 lg:justify-self-end">{text.membershipCopy}</p></div>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">{text.plans.map((plan, index) => { const isCurrent = membership.plan === plan.id; return <article key={plan.id} className={`relative flex min-h-[34rem] flex-col rounded-[2rem] border p-7 md:p-9 ${index === 1 ? 'border-[#625b55] bg-[#625b55] text-[#f7f3ec] shadow-[0_28px_80px_rgba(98,91,85,.2)]' : 'border-[#625b55]/14 bg-[#fbf8f2]'}`}>{index === 1 && <span className="absolute right-6 top-6 rounded-full bg-[#dcc4b8] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-[#514b46]">{text.popular}</span>}<p className={`text-xs font-bold uppercase tracking-[0.16em] ${index === 1 ? 'text-[#dcc4b8]' : 'text-[#8f705e]'}`}>{plan.name}</p><div className="mt-8 flex items-end gap-2"><span className="font-heading text-6xl">{plan.price}</span><span className={`pb-2 text-xs ${index === 1 ? 'text-[#f7f3ec]/55' : 'text-[#514b46]/45'}`}>{plan.cadence}</span></div><p className={`mt-5 min-h-14 text-sm leading-6 ${index === 1 ? 'text-[#f7f3ec]/65' : 'text-[#514b46]/58'}`}>{plan.description}</p><div className={`my-7 h-px ${index === 1 ? 'bg-[#f7f3ec]/14' : 'bg-[#625b55]/12'}`} /><ul className="grid gap-4">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm"><Check className={`size-4 ${index === 1 ? 'text-[#dcc4b8]' : 'text-[#8f705e]'}`} />{feature}</li>)}</ul><div className="mt-auto pt-9">{isCurrent ? <div className={`flex h-13 items-center justify-center gap-2 rounded-2xl border text-xs font-bold ${index === 1 ? 'border-[#f7f3ec]/25' : 'border-[#625b55]/18'}`}><ShieldCheck className="size-4" />{text.currentPlan}</div> : plan.id === 'basic' ? <button onClick={user ? () => window.location.assign('/profile') : signInWithGoogle} className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold ${index === 1 ? 'bg-[#f7f3ec] text-[#514b46]' : 'bg-[#625b55] text-[#f7f3ec]'}`}>{plan.cta}<ArrowRight className="size-4" /></button> : <button disabled={pending} onClick={membership.plan === 'basic' ? () => startCheckout(plan.id) : openBillingPortal} className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold disabled:opacity-50 ${index === 1 ? 'bg-[#f7f3ec] text-[#514b46]' : 'bg-[#625b55] text-[#f7f3ec]'}`}><CreditCard className="size-4" />{plan.cta}</button>}</div></article> })}</div>
          {user && membership.plan !== 'basic' && <div className="mt-8 flex justify-end"><button disabled={pending} onClick={openBillingPortal} className="inline-flex items-center gap-2 text-xs font-bold text-[#514b46]/65 hover:text-[#514b46]"><CreditCard className="size-4" />{text.manageBilling}</button></div>}
        </div>
      </section>

      <section id="method" className="px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1400px]"><p className="eyebrow text-[#8f705e]">{text.methodLabel}</p><h2 className="mt-5 max-w-4xl font-heading text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{text.methodTitle}</h2><div className="mt-14 grid border-y border-[#625b55]/18 md:grid-cols-3">{text.principles.map(([title, body], index) => <article key={title} className={`py-8 md:min-h-64 md:p-8 ${index < 2 ? 'border-b border-[#625b55]/14 md:border-b-0 md:border-r' : ''}`}><span className="block h-px w-12 bg-[#a7826c]" aria-hidden="true" /><h3 className="mt-12 font-heading text-3xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[#514b46]/58">{body}</p></article>)}</div><p className="mt-8 max-w-3xl text-xs leading-6 text-[#514b46]/45">{text.disclaimer}</p></div></section>

      <footer className="border-t border-[#625b55]/12 px-5 py-8 md:px-10"><div className="mx-auto flex max-w-[1400px] flex-col gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#514b46]/50 sm:flex-row sm:items-center sm:justify-between"><span>© HOLYARTED</span><div className="flex flex-wrap gap-5"><a href="/privacy" className="hover:text-[#514b46]">Privacy</a><a href="/terms" className="hover:text-[#514b46]">Terms</a><a href="mailto:support@holyarted.com" className="hover:text-[#514b46]">Support</a></div><span>{text.footer}</span>{user && <button onClick={signOut} className="inline-flex items-center gap-2 hover:text-[#514b46]"><LogOut className="size-3.5" />{text.signOut}</button>}</div></footer>
    </main>
  );
}
