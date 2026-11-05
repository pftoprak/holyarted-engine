// All interface text of the landing page, in both languages. Paid portrait
// texts are not here: they come from the server (lib/portrait-chapters.ts).
export type Locale = 'en' | 'tr';

export const copy = {
  en: {
    nav: ['Discover', 'Your portrait', 'Membership', 'Approach'], readingNav: 'Detailed reading', signIn: 'Continue with Google', account: 'Account', signOut: 'Sign out', menu: 'Menu',
    edition: 'A private Human Design experience', titleA: 'Meet the person', titleB: 'you are becoming.',
    intro: 'A refined portrait of how you think, decide, connect and grow—translated into clear guidance you can use in real life.',
    start: 'Discover my design', sample: 'Preview the experience', trust: ['Personal to you', 'Private by design', 'No fixed labels'],
    panelLabel: 'PERSONAL PORTRAIT', panelTitle: 'Your portrait begins here.', panelCopy: 'A few details are all it takes to begin. Your individual reading will unfold in moments.',
    progress: 'Your private profile', inputLabel: 'YOUR DETAILS', finish: 'Reveal my portrait', calculating: 'Creating your personal portrait', calculatingNote: 'Your individual reading is taking shape…', focusHint: 'Select an insight to bring it into focus',
    firstName: 'First name', firstPlaceholder: 'Your first name', lastName: 'Last name', lastPlaceholder: 'Your last name', birthDate: 'Date of birth', inputNote: 'Your details stay private and are never shown publicly.', invalidProfile: 'Please enter a complete name and a valid birth date.',
    previewLabel: 'A portrait you can use', previewTitle: 'See yourself more clearly.', previewCopy: 'Your portrait turns personal patterns into practical guidance for work, relationships, decisions and direction.',
    profileLabel: 'YOUR PERSONAL PORTRAIT', profileFor: 'Prepared privately for',
    profileNames: { build: 'The Intentional Builder', guide: 'The Grounded Guide', create: 'The Original Maker', connect: 'The Human Connector' },
    profileIntros: { build: 'You find meaning by turning a clear intention into something people can rely on.', guide: 'You find meaning by helping people see what matters and move forward with confidence.', create: 'You find meaning by making room for original ideas and giving them a useful form.', connect: 'You find meaning by noticing relationships others miss and bringing people into better conversation.' },
    sections: ['Decision style', 'Best environment', 'Watch for', 'Purpose direction'],
    comingSoon: 'Memberships open soon', restart: 'Create another portrait', savePrompt: 'Keep your portrait close.', saveCopy: 'Continue with your Google account to return to your private space and keep your membership in one place.', saveIn: 'Open my account', saveOut: 'Continue with Google', portraitSaving: 'Saving to your private space…', portraitSaved: 'Saved to your private space', portraitSaveFailed: 'Your portrait is ready, but it could not be saved. Please try again.', lockedTitle: 'More of your portrait is waiting.', lockedCopy: 'Plus opens the two remaining portrait cards and the abilities, life path and relationship readings. Premium adds short relationship and work notes and the ideal work reading.',
    extendedSections: ['Relationship note', 'Work note'],
    readingLabel: 'DETAILED READING', readingTitle: 'Your full reading.', readingCopy: 'The complete texts behind your portrait, calculated from your name and birth date.', readingLocaleNote: 'The reading texts are written in Turkish and have no English version yet. Section titles and the explanation above each text are in English.', portraitLoading: 'Preparing your portrait…', portraitError: 'Your portrait could not be prepared. Please try again.', readingLoading: 'Preparing your detailed reading…', readingError: 'Your detailed reading could not be prepared. Please try again.', readingRetry: 'Try again',
    readingTiers: { basic: 'Basic', plus: 'Plus', premium: 'Premium' }, readingWhy: 'Why this result', readingPending: 'This section is being prepared.', readingLocked: (plan: string) => `Opens with ${plan}.`, readingSoon: 'Opens soon.', readingRelationships: 'You in relationships', readingRelationshipsCopy: 'Sentences about closeness, boundaries and conflict, quoted from the sections above.', readingRelationshipsEmpty: 'Your reading says nothing specific about this.',
    membershipLabel: 'MEMBERSHIP', membershipTitle: 'Choose how deeply you want to explore.', membershipCopy: 'Start free. Upgrade when you want the complete portrait. Payments and cancellations are handled by our payment provider, iyzico; card details never reach Holyarted.', currentPlan: 'Current plan', manageBilling: 'Manage billing', popular: 'MOST CHOSEN',
    plans: [
      { id: 'basic', name: 'Basic', price: '€0', cadence: 'forever', description: 'A clear first look at your personal portrait.', features: ['Decision style', 'Best environment', 'Showcase reading'], cta: 'Continue free' },
      { id: 'plus', name: 'Plus', price: '€8.99', cadence: 'per month', description: 'The complete portrait for everyday reflection.', features: ['Everything in Basic', 'Watch for', 'Purpose direction', 'Abilities and life path readings'], cta: 'Choose Plus' },
      { id: 'premium', name: 'Premium', price: '€14.99', cadence: 'per month', description: 'Everything, including how you relate and work.', features: ['Everything in Plus', 'Relationship note', 'Work note', 'Ideal work reading'], cta: 'Choose Premium' },
    ],
    methodLabel: 'OUR APPROACH', methodTitle: 'Personal insight. Clear boundaries.',
    principles: [['Consistent', 'Every portrait is calculated from your name and birth date with the same method, so the same details always give the same result.'], ['Practical', 'Each insight includes a way to apply it in ordinary decisions, work and relationships.'], ['Open-ended', 'Use the portrait as a lens, not a verdict. You are allowed to change, contradict it and choose differently.']],
    disclaimer: 'Holyarted is an independent self-inquiry product. It is not affiliated with or endorsed by the creators of Human Design or any other system. It offers reflective guidance, not medical or psychological diagnosis.', footer: 'A clearer way to understand yourself.',
  },
  tr: {
    nav: ['Keşfet', 'Portren', 'Üyelik', 'Yaklaşım'], readingNav: 'Detaylı okuma', signIn: 'Google ile devam et', account: 'Hesap', signOut: 'Çıkış yap', menu: 'Menü',
    edition: 'Özel bir Human Design deneyimi', titleA: 'Dönüştüğün kişiyi', titleB: 'daha yakından tanı.',
    intro: 'Nasıl düşündüğünü, karar verdiğini, bağ kurduğunu ve geliştiğini gerçek hayatta kullanabileceğin net bir rehbere dönüştüren rafine bir portre.',
    start: 'Tasarımımı keşfet', sample: 'Deneyimi önizle', trust: ['Sana özel', 'Gizlilik odaklı', 'Sabit etiket yok'],
    panelLabel: 'KİŞİSEL PORTRE', panelTitle: 'Portren burada başlıyor.', panelCopy: 'Başlamak için birkaç bilgi yeterli. Sana özel okuma kısa süre içinde şekillenecek.',
    progress: 'Özel profilin', inputLabel: 'BİLGİLERİN', finish: 'Portremi göster', calculating: 'Kişisel portren hazırlanıyor', calculatingNote: 'Sana özel okuma şekilleniyor…', focusHint: 'Odağa almak için bir içgörü seç',
    firstName: 'Ad', firstPlaceholder: 'Adın', lastName: 'Soyad', lastPlaceholder: 'Soyadın', birthDate: 'Doğum tarihi', inputNote: 'Bilgilerin gizli kalır ve hiçbir zaman herkese açık gösterilmez.', invalidProfile: 'Lütfen adını, soyadını ve geçerli bir doğum tarihini gir.',
    previewLabel: 'Kullanabileceğin bir portre', previewTitle: 'Kendini daha net gör.', previewCopy: 'Portren; kişisel örüntüleri iş, ilişkiler, kararlar ve yön için uygulanabilir bir rehbere dönüştürür.',
    profileLabel: 'KİŞİSEL PORTREN', profileFor: 'Özel olarak hazırlandı',
    profileNames: { build: 'Niyetli Kurucu', guide: 'Sağlam Rehber', create: 'Özgün Üretici', connect: 'İnsanları Buluşturan' },
    profileIntros: { build: 'Net bir niyeti insanların güvenebileceği bir şeye dönüştürdüğünde anlam bulursun.', guide: 'İnsanların önemli olanı görmesine ve güvenle ilerlemesine yardım ettiğinde anlam bulursun.', create: 'Özgün fikirlere alan açıp onlara işe yarar bir biçim verdiğinde anlam bulursun.', connect: 'Başkalarının kaçırdığı ilişkileri fark edip insanları daha iyi bir konuşmada buluşturduğunda anlam bulursun.' },
    sections: ['Karar biçimi', 'En iyi ortam', 'Dikkat et', 'Amaç yönü'],
    comingSoon: 'Üyelikler yakında açılıyor', restart: 'Başka bir portre oluştur', savePrompt: 'Portreni yanında tut.', saveCopy: 'Özel alanına geri dönmek ve üyeliğini tek yerde tutmak için Google hesabınla devam et.', saveIn: 'Hesabımı aç', saveOut: 'Google ile devam et', portraitSaving: 'Kişisel alanına kaydediliyor…', portraitSaved: 'Kişisel alanına kaydedildi', portraitSaveFailed: 'Portren hazır, ancak kaydedilemedi. Lütfen tekrar dene.', lockedTitle: 'Portrenin devamı seni bekliyor.', lockedCopy: 'Plus kalan iki portre kartını ve yetenek, hayat yolu ve ilişki okumalarını açar. Premium kısa ilişki ve iş notlarını ve ideal iş okumasını ekler.',
    extendedSections: ['İlişki notu', 'İş yaşamı notu'],
    readingLabel: 'DETAYLI OKUMA', readingTitle: 'Tam okuman.', readingCopy: 'Portrenin arkasındaki metinlerin tamamı; adın ve doğum tarihinden hesaplandı.', readingLocaleNote: '', portraitLoading: 'Portren hazırlanıyor…', portraitError: 'Portren hazırlanamadı. Lütfen tekrar dene.', readingLoading: 'Detaylı okuman hazırlanıyor…', readingError: 'Detaylı okuman hazırlanamadı. Lütfen tekrar dene.', readingRetry: 'Tekrar dene',
    readingTiers: { basic: 'Basic', plus: 'Plus', premium: 'Premium' }, readingWhy: 'Neden bu sonuç', readingPending: 'Bu bölüm hazırlanıyor.', readingLocked: (plan: string) => `${plan} ile açılır.`, readingSoon: 'Yakında açılacak.', readingRelationships: 'İlişkide sen', readingRelationshipsCopy: 'Yakınlık, sınır ve çatışmayla ilgili cümleler; yukarıdaki bölümlerden olduğu gibi alındı.', readingRelationshipsEmpty: 'Verin bu konuda belirgin bir şey söylemiyor.',
    membershipLabel: 'ÜYELİK', membershipTitle: 'Ne kadar derine inmek istediğini seç.', membershipCopy: 'Ücretsiz başla. Tam portreni istediğinde yükselt. Ödemeler ve iptaller ödeme sağlayıcımız iyzico üzerinden yürür; kart bilgilerin bize ulaşmaz.', currentPlan: 'Mevcut plan', manageBilling: 'Ödemeyi yönet', popular: 'EN ÇOK SEÇİLEN',
    plans: [
      { id: 'basic', name: 'Basic', price: '€0', cadence: 'süresiz', description: 'Kişisel portrene net bir ilk bakış.', features: ['Karar biçimi', 'En iyi ortam', 'Vitrin okuması'], cta: 'Ücretsiz devam et' },
      { id: 'plus', name: 'Plus', price: '€8.99', cadence: 'aylık', description: 'Gündelik düşünme için tam portre.', features: ['Basic içeriğinin tamamı', 'Dikkat et', 'Amaç yönü', 'Yetenek ve hayat yolu okumaları'], cta: 'Plus seç' },
      { id: 'premium', name: 'Premium', price: '€14.99', cadence: 'aylık', description: 'İlişki ve iş yaşamı dahil her şey.', features: ['Plus içeriğinin tamamı', 'İlişki notu', 'İş yaşamı notu', 'İdeal iş okuması'], cta: 'Premium seç' },
    ],
    methodLabel: 'YAKLAŞIMIMIZ', methodTitle: 'Kişisel içgörü. Net sınırlar.',
    principles: [['Tutarlı', 'Her portre adın ve doğum tarihinden aynı yöntemle hesaplanır; aynı bilgiler her zaman aynı sonucu verir.'], ['Uygulanabilir', 'Her içgörü, gündelik kararlarda, işte ve ilişkilerde kullanılabilecek bir karşılık içerir.'], ['Açık uçlu', 'Portreyi hüküm olarak değil, bir bakış açısı olarak kullan. Değişebilir, ona ters düşebilir ve farklı seçebilirsin.']],
    disclaimer: 'Holyarted bağımsız bir öz-keşif ürünüdür. Human Design ya da başka bir sistemin yaratıcılarıyla bağlantılı değildir ve onlar tarafından onaylanmamıştır. Tıbbi veya psikolojik tanı değil, düşünmeye yardımcı bir rehberlik sunar.', footer: 'Kendini anlamanın daha net bir yolu.',
  },
} as const;

export type Copy = (typeof copy)[Locale];
