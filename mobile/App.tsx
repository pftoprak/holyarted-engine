import { StatusBar } from 'expo-status-bar';
import { Newsreader_500Medium, Newsreader_600SemiBold, useFonts } from '@expo-google-fonts/newsreader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateDesign } from './lib/profile-engine';

type Locale = 'en' | 'tr';

const content = {
  en: {
    switch: 'TR', edition: 'HUMAN DESIGN, MADE PERSONAL', title: 'What if your life could feel more like you?', intro: 'Your private portrait offers a new way to notice how you decide, connect, work and grow—without putting you in a box.',
    private: 'YOUR PRIVATE PORTRAIT', progress: 'BEGIN WITH WHAT IS UNIQUELY YOURS', inputLabel: 'YOUR DETAILS', resultLabel: 'YOUR PERSONAL PORTRAIT', back: 'Back', next: 'Continue', reveal: 'Reveal my portrait', reset: 'Create another portrait',
    trust: ['Made for reflection', 'Private by design', 'Yours to revisit'], firstName: 'First name', firstPlaceholder: 'Your first name', lastName: 'Last name', lastPlaceholder: 'Your last name', birthDate: 'Date of birth', inputNote: 'Your details are used only to prepare your portrait and are never shown publicly.', formError: 'Please complete your name and birth date.',
    teaserTitle: 'YOUR PORTRAIT MAY HELP YOU NOTICE', teaserFoot: 'A few quiet details can open a surprisingly personal reflection.',
    teasers: [
      ['CLARITY', 'Why some decisions feel right before you can explain them.'],
      ['ENVIRONMENT', 'The conditions that make your mind feel open and capable.'],
      ['DIRECTION', 'The kind of contribution that gives your life more meaning.'],
    ],
    questions: [
      { label: 'DECISION STYLE', title: 'When a decision matters, what helps you trust it?', options: { facts: ['Clear facts', 'I want the evidence in front of me.'], voice: ['Talking it through', 'I hear what I think as I say it.'], instinct: ['An immediate response', 'I notice a clear yes or no early.'], time: ['Time to settle', 'Clarity arrives after the first reaction.'] } },
      { label: 'BEST ENVIRONMENT', title: 'Where do you do your best thinking?', options: { quiet: ['Quiet structure', 'A protected space with a clear plan.'], together: ['A collaborative room', 'Ideas sharpen around trusted people.'], variety: ['Changing inputs', 'New perspectives keep me engaged.'], motion: ['Hands-on momentum', 'Thinking clears while I make or move.'] } },
      { label: 'FRICTION PATTERN', title: 'What wears you down fastest?', options: { switching: ['Constant switching', 'Too many open threads dilute my attention.'], ambiguity: ['Unclear expectations', 'I struggle when the target keeps moving.'], access: ['Always being available', 'My priorities disappear behind other people.'], stagnation: ['Too little movement', 'Repetition without progress makes me withdraw.'] } },
      { label: 'PURPOSE DIRECTION', title: 'What kind of contribution feels most meaningful?', options: { build: ['Building something lasting', 'Useful, dependable work matters to me.'], guide: ['Guiding people', 'I make complexity easier to navigate.'], create: ['Creating possibilities', 'I give form to what does not exist yet.'], connect: ['Connecting people', 'I help the right people and ideas meet.'] } },
    ],
    names: { build: 'The Intentional Builder', guide: 'The Grounded Guide', create: 'The Original Maker', connect: 'The Human Connector' },
    intros: { build: 'You find meaning by turning clear intention into something people can rely on.', guide: 'You find meaning by helping people see what matters and move forward.', create: 'You find meaning by making room for original ideas and giving them useful form.', connect: 'You find meaning by noticing relationships others miss and bringing people together.' },
    headings: ['DECISION STYLE', 'BEST ENVIRONMENT', 'WATCH FOR', 'PURPOSE DIRECTION'],
    decision: { facts: ['Evidence first', 'Define the decision, gather what changes the outcome, then stop researching.'], voice: ['Clarity in conversation', 'Ask a trusted person to reflect what they hear—not to decide for you.'], instinct: ['Respect the first signal', 'Notice your earliest response, then verify it against reality before committing.'], time: ['Let clarity mature', 'Allow the first reaction to settle, but set a time to decide.'] },
    environments: { quiet: ['Protected focus', 'Defined priorities and fewer interruptions give you room to think deeply.'], together: ['Trusted collaboration', 'Your thinking sharpens around people who can challenge ideas without competing.'], variety: ['Fresh perspective', 'New inputs and changing contexts help you connect different ideas.'], motion: ['Progress you can touch', 'Drafts, prototypes and physical movement help your thought become clear.'] },
    frictions: { switching: ['Protect continuity', 'Keep one primary thread visible and park the rest.'], ambiguity: ['Name the finish line', 'Agree what “done” looks like before beginning.'], access: ['Make access intentional', 'Choose when you are open to others and when your priorities are protected.'], stagnation: ['Create visible movement', 'Link routine work to a meaningful outcome or change the method.'] },
    purposes: { build: ['Make the useful thing real', 'Create structures, products or practices that hold up over time.'], guide: ['Turn complexity into direction', 'Help people orient themselves through teaching, leadership, care or communication.'], create: ['Give new ideas a form', 'Open possibilities, then shape the strongest one into work others can use.'], connect: ['Strengthen the human network', 'Create understanding across people, disciplines or communities.'] },
    note: 'Reflective guidance—not a medical or psychological diagnosis.',
  },
  tr: {
    switch: 'EN', edition: 'SANA ÖZEL HUMAN DESIGN', title: 'Yaşamın sana daha çok benzese nasıl olurdu?', intro: 'Kişisel portren; seni bir kalıba koymadan nasıl karar verdiğini, bağ kurduğunu, çalıştığını ve geliştiğini fark etmenin yeni bir yolunu sunar.',
    private: 'KİŞİSEL PORTREN', progress: 'SANA ÖZGÜ OLANLA BAŞLA', inputLabel: 'BİLGİLERİN', resultLabel: 'KİŞİSEL PORTREN', back: 'Geri', next: 'Devam et', reveal: 'Portremi göster', reset: 'Başka bir portre oluştur',
    trust: ['Düşünmek için tasarlandı', 'Gizlilik odaklı', 'Dilediğinde geri dön'], firstName: 'Ad', firstPlaceholder: 'Adın', lastName: 'Soyad', lastPlaceholder: 'Soyadın', birthDate: 'Doğum tarihi', inputNote: 'Bilgilerin yalnızca portreni hazırlamak için kullanılır ve herkese açık gösterilmez.', formError: 'Lütfen adını, soyadını ve doğum tarihini tamamla.',
    teaserTitle: 'PORTREN ŞUNLARI FARK ETMENE YARDIMCI OLABİLİR', teaserFoot: 'Birkaç kişisel ayrıntı, şaşırtıcı derecede sana özgü bir düşünme alanı açabilir.',
    teasers: [
      ['NETLİK', 'Bazı kararların neden açıklayamadan önce doğru hissettirdiği.'],
      ['ORTAM', 'Zihnini açık, rahat ve yetkin hissettiren koşullar.'],
      ['YÖN', 'Yaşamına daha fazla anlam katan katkı biçimi.'],
    ],
    questions: [
      { label: 'KARAR BİÇİMİ', title: 'Önemli bir kararda neye güvenmek sana en çok yardımcı olur?', options: { facts: ['Net bilgiler', 'Gerekli veriyi önümde görmek isterim.'], voice: ['Konuşarak düşünmek', 'Ne düşündüğümü söylerken daha iyi duyarım.'], instinct: ['İlk tepki', 'Başta belirgin bir evet ya da hayır fark ederim.'], time: ['Zamana bırakmak', 'İlk tepki geçince netlik gelir.'] } },
      { label: 'EN İYİ ORTAM', title: 'En iyi nerede düşünürsün?', options: { quiet: ['Sessiz düzen', 'Korunaklı bir alan ve net bir plan.'], together: ['Birlikte düşünmek', 'Güvendiğim insanların yanında fikirlerim keskinleşir.'], variety: ['Değişen uyaranlar', 'Yeni bakış açıları ilgimi canlı tutar.'], motion: ['Hareket içinde', 'Üretirken veya hareket ederken netleşirim.'] } },
      { label: 'ZORLANMA ÖRÜNTÜSÜ', title: 'Seni en hızlı ne tüketir?', options: { switching: ['Sürekli konu değiştirmek', 'Çok fazla açık iş dikkatimi dağıtır.'], ambiguity: ['Belirsiz beklentiler', 'Hedef sürekli değiştiğinde zorlanırım.'], access: ['Her an ulaşılabilir olmak', 'Başkaları önceliklerimi görünmez kılar.'], stagnation: ['İlerlemenin olmaması', 'Sonuç vermeyen tekrar beni geri çeker.'] } },
      { label: 'AMAÇ YÖNÜ', title: 'Hangi katkı biçimi sana en anlamlı geliyor?', options: { build: ['Kalıcı bir şey kurmak', 'Faydalı ve güvenilir iş önemlidir.'], guide: ['İnsanlara yol göstermek', 'Karmaşıklığı anlaşılır kılarım.'], create: ['Yeni olasılıklar yaratmak', 'Var olmayana biçim vermek isterim.'], connect: ['İnsanları buluşturmak', 'Doğru insanları ve fikirleri bir araya getiririm.'] } },
    ],
    names: { build: 'Niyetli Kurucu', guide: 'Sağlam Rehber', create: 'Özgün Üretici', connect: 'İnsanları Buluşturan' },
    intros: { build: 'Net bir niyeti insanların güvenebileceği bir şeye dönüştürdüğünde anlam bulursun.', guide: 'İnsanların önemli olanı görmesine ve ilerlemesine yardım ettiğinde anlam bulursun.', create: 'Özgün fikirlere alan açıp onlara işe yarar biçim verdiğinde anlam bulursun.', connect: 'Başkalarının kaçırdığı ilişkileri fark edip insanları buluşturduğunda anlam bulursun.' },
    headings: ['KARAR BİÇİMİ', 'EN İYİ ORTAM', 'DİKKAT ET', 'AMAÇ YÖNÜ'],
    decision: { facts: ['Önce kanıt', 'Kararı tanımla, sonucu değiştiren veriyi topla ve araştırmayı bitir.'], voice: ['Konuşmada netlik', 'Güvendiğin birinden karar vermesini değil, duyduğunu yansıtmasını iste.'], instinct: ['İlk sinyali ciddiye al', 'İlk tepkini fark et, sonra karardan önce gerçeklikle karşılaştır.'], time: ['Netliğin olgunlaşsın', 'İlk tepkinin yatışmasına izin ver ama karar için zaman belirle.'] },
    environments: { quiet: ['Korunan odak', 'Net öncelikler ve daha az bölünme derin düşünme alanı açar.'], together: ['Güvenilir işbirliği', 'Fikirleri rekabet etmeden zorlayan insanların yanında düşüncen keskinleşir.'], variety: ['Taze bakış', 'Yeni girdiler ve değişen bağlamlar farklı fikirleri birleştirmene yardım eder.'], motion: ['Dokunabildiğin ilerleme', 'Taslaklar, denemeler ve hareket düşünceni netleştirir.'] },
    frictions: { switching: ['Sürekliliği koru', 'Tek bir ana işi görünür tut, diğerlerini beklet.'], ambiguity: ['Bitiş çizgisini adlandır', 'Başlamadan önce “bitti”nin nasıl görüneceğini netleştir.'], access: ['Ulaşılabilirliği bilinçli seç', 'Ne zaman başkalarına açık, ne zaman önceliklerine kapalı olduğunu belirle.'], stagnation: ['Görünür ilerleme yarat', 'Rutin işi anlamlı bir sonuca bağla veya yöntemi değiştir.'] },
    purposes: { build: ['Faydalı olanı gerçeğe dönüştür', 'Zamana dayanan yapılar, ürünler veya uygulamalar kur.'], guide: ['Karmaşıklığı yöne dönüştür', 'Öğretme, liderlik, bakım veya iletişimle insanların yönünü bulmasına yardım et.'], create: ['Yeni fikre biçim ver', 'Olasılık aç, ardından en güçlüsünü kullanılabilir bir işe dönüştür.'], connect: ['İnsan ağını güçlendir', 'İnsanlar, alanlar veya topluluklar arasında anlayış yarat.'] },
    note: 'Düşünmeye yardımcı bir rehberliktir; tıbbi veya psikolojik tanı değildir.',
  },
} as const;

export default function App() {
  const [fontsLoaded] = useFonts({ Newsreader_500Medium, Newsreader_600SemiBold });
  const [locale, setLocale] = useState<Locale>('en');
  const [done, setDone] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formError, setFormError] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profile, setProfile] = useState(() => calculateDesign('Alex', 'Morgan', '1992-07-16'));
  const entrance = useRef(new Animated.Value(0)).current;
  const ambient = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const resultEntrance = useRef(new Animated.Value(0)).current;
  const text = content[locale];
  const cards = useMemo(() => [text.decision[profile.decision], text.environments[profile.environment], text.frictions[profile.friction], text.purposes[profile.purpose]], [text, profile]);

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ambientLoop = Animated.loop(Animated.sequence([
      Animated.timing(ambient, { toValue: 1, duration: 4300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ambient, { toValue: 0, duration: 4300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    ambientLoop.start();
    return () => ambientLoop.stop();
  }, [ambient, entrance]);

  useEffect(() => {
    if (!done) return;
    resultEntrance.setValue(0);
    Animated.timing(resultEntrance, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [done, resultEntrance]);

  function submit() {
    if (!firstName.trim() || !lastName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setFormError(true);
      return;
    }
    setFormError(false);
    setProfile(calculateDesign(firstName, lastName, birthDate));
    setCalculating(true);
    scan.setValue(0);
    Animated.timing(scan, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => {
      setCalculating(false);
      setDone(true);
    });
  }

  if (!fontsLoaded) return <SafeAreaView style={styles.safe}><StatusBar style="dark" /></SafeAreaView>;

  if (calculating) return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><View style={styles.calculationPage}><Animated.View style={[styles.calcHaloOuter, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }]} /><Animated.View style={[styles.calcHaloInner, { transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [1.06, 0.94] }) }] }]} /><View style={styles.calcMonogram}><Animated.Text style={[styles.calcMonogramText, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [1, 0.56] }) }]}>H</Animated.Text></View><Text style={styles.calcEyebrow}>{locale === 'en' ? 'A MOMENT FOR YOU' : 'SANA AYRILMIŞ BİR AN'}</Text><Text style={styles.calcTitle}>{locale === 'en' ? 'Creating your personal portrait' : 'Kişisel portren hazırlanıyor'}</Text><Text style={styles.calcCopy}>{locale === 'en' ? 'Let the rest of the day wait here.' : 'Günün geri kalanı burada biraz beklesin.'}</Text><View style={styles.calcTrack}><Animated.View style={[styles.calcFill, { transform: [{ scaleX: scan }] }]} /></View></View></SafeAreaView>
  );

  if (done) return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView key="result" contentContainerStyle={styles.resultPage} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>H</Text></View><Text style={styles.brand}>HOLYARTED</Text><Pressable style={styles.language} onPress={() => setLocale(locale === 'en' ? 'tr' : 'en')}><Text style={styles.languageText}>{text.switch}</Text></Pressable></View>
      <Animated.View style={[styles.resultHero, { opacity: resultEntrance, transform: [{ translateY: resultEntrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) }] }]}><Animated.View style={[styles.resultHalo, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] }]} /><Text style={styles.resultLabel}>{text.resultLabel}</Text><Text style={styles.resultName}>{profile.fullName}</Text><View style={styles.resultRule} /><Text style={styles.resultTitle}>{text.names[profile.purpose]}</Text><Text style={styles.resultIntro}>{text.intros[profile.purpose]}</Text></Animated.View>
      <View style={styles.resultGrid}>{cards.map(([title, body], index) => <Animated.View key={title} style={[styles.resultCard, index % 2 === 1 && styles.resultCardTint, { opacity: resultEntrance, transform: [{ translateY: resultEntrance.interpolate({ inputRange: [0, 1], outputRange: [28 + index * 8, 0] }) }] }]}><View style={styles.cardTop}><Text style={styles.cardIndex}>{text.headings[index]}</Text><View style={styles.cardDot} /></View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardBody}>{body}</Text></Animated.View>)}</View>
      <Pressable style={({ pressed }) => [styles.darkButton, pressed && styles.buttonPressed]} onPress={() => setDone(false)}><Text style={styles.darkButtonText}>←  {text.reset}</Text></Pressable><Text style={styles.note}>{text.note}</Text>
    </ScrollView></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}><StatusBar style="dark" /><ScrollView key="entry" contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}><Animated.View style={[styles.decorSage, { transform: [{ translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] }) }, { rotate: '-12deg' }] }]} /><Animated.View style={[styles.decorClay, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.58, 0.9] }), transform: [{ translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [16, -14] }) }] }]} />
      <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>H</Text></View><Text style={styles.brand}>HOLYARTED</Text><Pressable style={styles.language} onPress={() => setLocale(locale === 'en' ? 'tr' : 'en')}><Text style={styles.languageText}>{text.switch}</Text></Pressable></View>
      <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [38, 0] }) }] }}><View style={styles.hero}><View style={styles.editionPill}><View style={styles.editionDot} /><Text style={styles.edition}>{text.edition}</Text></View><Text style={styles.title}>{text.title}</Text><Text style={styles.intro}>{text.intro}</Text><View style={styles.trustRow}>{text.trust.map((item) => <View key={item} style={styles.trustPill}><View style={styles.trustDot} /><Text style={styles.trust}>{item}</Text></View>)}</View></View>
      <View style={styles.teaserWrap}><View style={styles.teaserBack} /><View style={styles.teaserPanel}><View style={styles.teaserHeader}><Text style={styles.teaserEyebrow}>{text.teaserTitle}</Text><Animated.View style={[styles.teaserPulse, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.16] }) }] }]} /></View>{text.teasers.map(([label, copy]) => <View key={label} style={styles.teaserRow}><View style={styles.teaserMarker}><View style={styles.teaserMarkerInner} /></View><View style={styles.teaserCopy}><Text style={styles.teaserLabel}>{label}</Text><Text style={styles.teaserText}>{copy}</Text></View><Text style={styles.teaserArrow}>↗</Text></View>)}<Text style={styles.teaserFoot}>{text.teaserFoot}</Text></View></View>
      <View style={styles.session}><View style={styles.sessionTop}><View><Text style={styles.sessionTopText}>{text.private}</Text><Text style={styles.sessionHint}>{text.progress}</Text></View><View style={styles.privatePill}><View style={styles.privateDot} /><Text style={styles.lock}>{locale === 'en' ? 'PRIVATE' : 'GİZLİ'}</Text></View></View><View style={styles.sessionBody}><Text style={styles.inputHeading}>{text.inputLabel}</Text><View style={styles.fields}><Text style={styles.fieldLabel}>{text.firstName}</Text><TextInput value={firstName} onChangeText={(value) => { setFirstName(value); setFormError(false); }} placeholder={text.firstPlaceholder} placeholderTextColor="rgba(67,72,64,.28)" style={styles.input} autoCapitalize="words" autoComplete="name-given" /><Text style={styles.fieldLabel}>{text.lastName}</Text><TextInput value={lastName} onChangeText={(value) => { setLastName(value); setFormError(false); }} placeholder={text.lastPlaceholder} placeholderTextColor="rgba(67,72,64,.28)" style={styles.input} autoCapitalize="words" autoComplete="name-family" /><Text style={styles.fieldLabel}>{text.birthDate}</Text><TextInput value={birthDate} onChangeText={(value) => { setBirthDate(value); setFormError(false); }} placeholder="YYYY-MM-DD" placeholderTextColor="rgba(67,72,64,.28)" style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} autoComplete="birthdate-full" /></View>{formError && <Text style={styles.errorText}>{text.formError}</Text>}<Text style={styles.inputNote}>{text.inputNote}</Text><Pressable style={({ pressed }) => [styles.goldButtonWide, pressed && styles.buttonPressed]} onPress={submit}><Text style={styles.goldButtonText}>{text.reveal}</Text><Text style={styles.buttonArrow}>→</Text></Pressable></View></View></Animated.View>
      <Text style={styles.note}>{text.note}</Text>
    </ScrollView></SafeAreaView>
  );
}

const canvas = '#F3EFE8';
const paper = '#FCF9F4';
const ink = '#434840';
const olive = '#4D584D';
const sage = '#AEB9A6';
const clay = '#D9B8A7';
const oat = '#E8DDCE';
const accent = '#9A715E';
const display = 'Newsreader_500Medium';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: canvas },
  page: { backgroundColor: canvas, minHeight: '100%', paddingBottom: 48, overflow: 'hidden' },
  resultPage: { backgroundColor: canvas, minHeight: '100%', paddingBottom: 48 },
  decorSage: { position: 'absolute', width: 360, height: 270, borderRadius: 180, backgroundColor: '#DCE3D7', top: 118, right: -190 },
  decorClay: { position: 'absolute', width: 155, height: 155, borderRadius: 80, backgroundColor: '#E5CABE', top: 265, left: -102 },
  brandRow: { height: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' },
  mark: { width: 38, height: 38, borderRadius: 19, backgroundColor: paper, borderWidth: 1, borderColor: 'rgba(77,88,77,.12)', alignItems: 'center', justifyContent: 'center', shadowColor: ink, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  markText: { color: accent, fontFamily: 'Newsreader_600SemiBold', fontSize: 18 },
  brand: { color: ink, marginLeft: 12, fontFamily: 'Newsreader_600SemiBold', fontSize: 13, letterSpacing: 2.6 },
  language: { marginLeft: 'auto', borderRadius: 18, backgroundColor: 'rgba(252,249,244,.76)', borderWidth: 1, borderColor: 'rgba(77,88,77,.12)', paddingHorizontal: 14, paddingVertical: 9 },
  languageText: { color: olive, fontWeight: '800', fontSize: 10, letterSpacing: 0.7 },
  hero: { paddingHorizontal: 22, paddingTop: 34, paddingBottom: 34 },
  editionPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, backgroundColor: 'rgba(252,249,244,.7)', paddingHorizontal: 12, paddingVertical: 9 },
  editionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: clay },
  edition: { color: olive, fontSize: 9, fontWeight: '800', letterSpacing: 1.45 },
  title: { color: ink, fontFamily: display, fontSize: 48, lineHeight: 49, letterSpacing: -1.75, marginTop: 22, maxWidth: 340 },
  intro: { color: 'rgba(67,72,64,.67)', fontSize: 15, lineHeight: 24, marginTop: 20, maxWidth: 338 },
  trustRow: { marginTop: 25, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(77,88,77,.11)', backgroundColor: 'rgba(252,249,244,.57)', paddingHorizontal: 10, paddingVertical: 8 },
  trustDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: accent },
  trust: { color: 'rgba(67,72,64,.68)', fontSize: 10 },
  teaserWrap: { marginHorizontal: 14, marginBottom: 22, position: 'relative' },
  teaserBack: { position: 'absolute', top: 9, left: 8, right: 8, bottom: -8, borderRadius: 28, backgroundColor: '#D5C3B5', transform: [{ rotate: '-1.4deg' }] },
  teaserPanel: { borderRadius: 28, overflow: 'hidden', backgroundColor: olive, paddingHorizontal: 21, paddingTop: 22, paddingBottom: 19, shadowColor: olive, shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 13 }, elevation: 4 },
  teaserHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(252,249,244,.11)' },
  teaserEyebrow: { color: '#E3C9BB', fontSize: 8, fontWeight: '800', letterSpacing: 1.35, maxWidth: '85%' },
  teaserPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: clay },
  teaserRow: { minHeight: 89, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(252,249,244,.1)' },
  teaserMarker: { width: 27, height: 27, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(252,249,244,.2)', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  teaserMarkerInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E3C9BB' },
  teaserCopy: { flex: 1, paddingVertical: 14 },
  teaserLabel: { color: '#E3C9BB', fontSize: 8, fontWeight: '800', letterSpacing: 1.15 },
  teaserText: { color: 'rgba(252,249,244,.78)', fontFamily: display, fontSize: 17, lineHeight: 21, marginTop: 5 },
  teaserArrow: { color: 'rgba(252,249,244,.35)', fontSize: 15, marginLeft: 9 },
  teaserFoot: { color: 'rgba(252,249,244,.48)', fontSize: 10, lineHeight: 16, marginTop: 16, paddingRight: 20 },
  session: { marginHorizontal: 14, borderRadius: 30, overflow: 'hidden', backgroundColor: paper, borderWidth: 1, borderColor: 'rgba(77,88,77,.1)', shadowColor: ink, shadowOpacity: 0.13, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 5 },
  sessionTop: { minHeight: 84, paddingHorizontal: 22, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6DDCF', borderBottomWidth: 1, borderBottomColor: 'rgba(77,88,77,.08)' },
  sessionTopText: { color: ink, fontFamily: 'Newsreader_600SemiBold', fontSize: 19 },
  sessionHint: { color: 'rgba(67,72,64,.5)', fontSize: 8, fontWeight: '700', letterSpacing: 0.8, marginTop: 5 },
  privatePill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, backgroundColor: 'rgba(252,249,244,.65)', paddingHorizontal: 9, paddingVertical: 7 },
  privateDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: sage },
  lock: { color: 'rgba(67,72,64,.58)', fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  sessionBody: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 22 },
  inputHeading: { color: accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  fields: { marginTop: 22 },
  fieldLabel: { color: 'rgba(67,72,64,.76)', fontSize: 11, fontWeight: '700', marginBottom: 8, marginLeft: 3 },
  input: { height: 57, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(77,88,77,.12)', color: ink, paddingHorizontal: 17, fontSize: 15, marginBottom: 17, backgroundColor: '#F4F0E9' },
  errorText: { color: '#9B5E55', fontSize: 10, lineHeight: 16, marginTop: -2, marginBottom: 9 },
  inputNote: { color: 'rgba(67,72,64,.47)', fontSize: 10, lineHeight: 16, paddingRight: 8 },
  goldButtonWide: { minHeight: 58, borderRadius: 20, backgroundColor: olive, paddingLeft: 20, paddingRight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, shadowColor: olive, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  goldButtonText: { color: paper, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  buttonArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(252,249,244,.14)', color: paper, textAlign: 'center', lineHeight: 34, fontSize: 17 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  note: { color: 'rgba(67,72,64,.42)', fontSize: 10, lineHeight: 17, textAlign: 'center', paddingHorizontal: 34, marginTop: 26 },
  calculationPage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden', backgroundColor: oat },
  calcHaloOuter: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 1, borderColor: 'rgba(77,88,77,.17)', backgroundColor: 'rgba(174,185,166,.18)' },
  calcHaloInner: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(154,113,94,.16)', backgroundColor: 'rgba(252,249,244,.28)' },
  calcMonogram: { width: 82, height: 82, borderRadius: 41, backgroundColor: paper, alignItems: 'center', justifyContent: 'center', shadowColor: ink, shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  calcMonogramText: { color: accent, fontFamily: display, fontSize: 38 },
  calcEyebrow: { color: accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.6, marginTop: 34 },
  calcTitle: { color: ink, fontFamily: display, fontSize: 39, lineHeight: 42, textAlign: 'center', marginTop: 12, maxWidth: 330 },
  calcCopy: { color: 'rgba(67,72,64,.53)', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  calcTrack: { height: 3, width: 210, borderRadius: 2, backgroundColor: 'rgba(77,88,77,.1)', marginTop: 34, overflow: 'hidden' },
  calcFill: { height: 3, width: '100%', borderRadius: 2, backgroundColor: accent, transformOrigin: 'left' },
  resultHero: { marginHorizontal: 14, marginTop: 18, borderRadius: 32, overflow: 'hidden', backgroundColor: olive, paddingHorizontal: 24, paddingTop: 27, paddingBottom: 30, shadowColor: olive, shadowOpacity: 0.17, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  resultHalo: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: paper, backgroundColor: sage, top: -150, right: -120 },
  resultLabel: { color: '#D9C1B4', fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  resultName: { color: 'rgba(252,249,244,.64)', fontSize: 12, marginTop: 10 },
  resultRule: { width: 42, height: 1, backgroundColor: 'rgba(252,249,244,.32)', marginTop: 24 },
  resultTitle: { color: paper, fontFamily: display, fontSize: 46, lineHeight: 47, letterSpacing: -1.4, marginTop: 20, maxWidth: 330 },
  resultIntro: { color: 'rgba(252,249,244,.72)', fontSize: 14, lineHeight: 23, marginTop: 18, maxWidth: 330 },
  resultGrid: { marginTop: 15, paddingHorizontal: 14, gap: 12 },
  resultCard: { minHeight: 190, borderRadius: 25, backgroundColor: paper, borderWidth: 1, borderColor: 'rgba(77,88,77,.09)', padding: 21, shadowColor: ink, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  resultCardTint: { backgroundColor: '#E5E8DE' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIndex: { color: 'rgba(67,72,64,.5)', fontSize: 9, fontWeight: '800', letterSpacing: 1.25 },
  cardDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: clay },
  cardTitle: { color: ink, fontFamily: display, fontSize: 30, lineHeight: 33, marginTop: 30 },
  cardBody: { color: 'rgba(67,72,64,.66)', fontSize: 13, lineHeight: 21, marginTop: 11 },
  darkButton: { backgroundColor: olive, borderRadius: 20, marginHorizontal: 20, marginTop: 24, minHeight: 55, alignItems: 'center', justifyContent: 'center' },
  darkButtonText: { color: paper, fontSize: 11, fontWeight: '800' },
});
