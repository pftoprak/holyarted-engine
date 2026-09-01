import { StatusBar } from 'expo-status-bar';
import { Newsreader_500Medium, Newsreader_600SemiBold, useFonts } from '@expo-google-fonts/newsreader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateDesign } from './lib/profile-engine';

type Locale = 'en' | 'tr';

const content = {
  en: {
    switch: 'TR', edition: 'A PRIVATE HUMAN DESIGN EXPERIENCE', title: 'Meet the person you are becoming.', intro: 'A refined portrait of how you think, decide, connect and grow.',
    private: 'PRIVATE PORTRAIT', progress: 'YOUR PORTRAIT STARTS HERE', inputLabel: 'PRIVATE INPUT', resultLabel: 'YOUR PERSONAL PORTRAIT', back: 'Back', next: 'Continue', reveal: 'Reveal my portrait', reset: 'Create another portrait',
    trust: ['Personal to you', 'Private by design', 'No fixed labels'], firstName: 'First name', firstPlaceholder: 'Your first name', lastName: 'Last name', lastPlaceholder: 'Your last name', birthDate: 'Date of birth', inputNote: 'Your details stay private and are never shown publicly.',
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
    switch: 'EN', edition: 'ÖZEL BİR HUMAN DESIGN DENEYİMİ', title: 'Dönüştüğün kişiyi daha yakından tanı.', intro: 'Nasıl düşündüğünü, karar verdiğini, bağ kurduğunu ve geliştiğini gösteren rafine bir portre.',
    private: 'KİŞİSEL PORTRE', progress: 'PORTREN BURADA BAŞLIYOR', inputLabel: 'KİŞİSEL GİRDİ', resultLabel: 'KİŞİSEL PORTREN', back: 'Geri', next: 'Devam et', reveal: 'Portremi göster', reset: 'Başka bir portre oluştur',
    trust: ['Sana özel', 'Gizlilik odaklı', 'Sabit etiket yok'], firstName: 'Ad', firstPlaceholder: 'Adın', lastName: 'Soyad', lastPlaceholder: 'Soyadın', birthDate: 'Doğum tarihi', inputNote: 'Bilgilerin gizli kalır ve hiçbir zaman herkese açık gösterilmez.',
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
    if (!firstName.trim() || !lastName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return;
    setProfile(calculateDesign(firstName, lastName, birthDate));
    setCalculating(true);
    scan.setValue(0);
    Animated.timing(scan, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => {
      setCalculating(false);
      setDone(true);
    });
  }

  if (!fontsLoaded) return <SafeAreaView style={styles.safe}><StatusBar style="light" /></SafeAreaView>;

  if (calculating) return (
    <SafeAreaView style={styles.safe}><StatusBar style="light" /><View style={styles.calculationPage}><Animated.View style={[styles.ambientOrb, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }] }]} /><View style={styles.calcMonogram}><Animated.Text style={[styles.calcMonogramText, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [1, 0.42] }) }]}>H</Animated.Text></View><Text style={styles.calcTitle}>{locale === 'en' ? 'Creating your personal portrait' : 'Kişisel portren hazırlanıyor'}</Text><Text style={styles.calcCopy}>{locale === 'en' ? 'Your individual reading is taking shape…' : 'Sana özel okuma şekilleniyor…'}</Text><View style={styles.calcTrack}><Animated.View style={[styles.calcFill, { transform: [{ scaleX: scan }] }]} /></View></View></SafeAreaView>
  );

  if (done) return (
    <SafeAreaView style={styles.safe}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.resultPage}><Animated.View style={[styles.ambientOrbResult, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.16] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }] }]} />
      <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>H</Text></View><Text style={styles.brand}>HOLYARTED</Text><Pressable style={styles.language} onPress={() => setLocale(locale === 'en' ? 'tr' : 'en')}><Text style={styles.languageText}>{text.switch}</Text></Pressable></View>
      <Animated.View style={{ opacity: resultEntrance, transform: [{ translateY: resultEntrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) }] }}><Text style={styles.resultLabel}>{text.resultLabel} · {profile.fullName.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')}</Text><Text style={styles.resultTitle}>{text.names[profile.purpose]}</Text><Text style={styles.resultIntro}>{text.intros[profile.purpose]}</Text></Animated.View>
      <View style={styles.resultGrid}>{cards.map(([title, body], index) => <Animated.View key={title} style={[styles.resultCard, { opacity: resultEntrance, transform: [{ translateY: resultEntrance.interpolate({ inputRange: [0, 1], outputRange: [28 + index * 8, 0] }) }] }]}><Text style={styles.cardIndex}>{text.headings[index]}</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardBody}>{body}</Text><View style={styles.cardAccent} /></Animated.View>)}</View>
      <Pressable style={styles.darkButton} onPress={() => setDone(false)}><Text style={styles.darkButtonText}>←  {text.reset}</Text></Pressable><Text style={styles.note}>{text.note}</Text>
    </ScrollView></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.page}><Animated.View style={[styles.ambientOrb, { opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }), transform: [{ translateY: ambient.interpolate({ inputRange: [0, 1], outputRange: [-20, 30] }) }, { scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.1] }) }] }]} />
      <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>H</Text></View><Text style={styles.brand}>HOLYARTED</Text><Pressable style={styles.language} onPress={() => setLocale(locale === 'en' ? 'tr' : 'en')}><Text style={styles.languageText}>{text.switch}</Text></Pressable></View>
      <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [38, 0] }) }] }}><View style={styles.hero}><Text style={styles.edition}>{text.edition}</Text><Text style={styles.title}>{text.title}</Text><Text style={styles.intro}>{text.intro}</Text><View style={styles.trustRow}>{text.trust.map((item) => <Text key={item} style={styles.trust}>✓ {item}</Text>)}</View></View>
      <View style={styles.session}><View style={styles.sessionTop}><Text style={styles.sessionTopText}>{text.private}</Text><Text style={styles.lock}>◇</Text></View><View style={styles.sessionBody}><View style={styles.progressText}><Text style={styles.micro}>{text.progress}</Text><Text style={styles.microGold}>{text.inputLabel}</Text></View><View style={styles.track}><View style={[styles.trackFill, { width: '100%' }]} /></View><View style={styles.fields}><Text style={styles.fieldLabel}>{text.firstName}</Text><TextInput value={firstName} onChangeText={setFirstName} placeholder={text.firstPlaceholder} placeholderTextColor="rgba(255,255,255,.25)" style={styles.input} autoCapitalize="words" autoComplete="name-given" /><Text style={styles.fieldLabel}>{text.lastName}</Text><TextInput value={lastName} onChangeText={setLastName} placeholder={text.lastPlaceholder} placeholderTextColor="rgba(255,255,255,.25)" style={styles.input} autoCapitalize="words" autoComplete="name-family" /><Text style={styles.fieldLabel}>{text.birthDate}</Text><TextInput value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor="rgba(255,255,255,.25)" style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} autoComplete="birthdate-full" /></View><Text style={styles.inputNote}>{text.inputNote}</Text><Pressable style={({ pressed }) => [styles.goldButtonWide, pressed && styles.buttonPressed]} onPress={submit}><Text style={styles.goldButtonText}>{text.reveal}  →</Text></Pressable></View></View></Animated.View>
      <Text style={styles.note}>{text.note}</Text>
    </ScrollView></SafeAreaView>
  );
}

const ink = '#0D0D12';
const panel = '#18131B';
const ivory = '#F5F0E8';
const bronze = '#C8A77A';
const gold = '#D9BB91';
const display = 'Newsreader_500Medium';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ink }, page: { backgroundColor: ink, paddingBottom: 44, overflow: 'hidden' }, resultPage: { backgroundColor: bronze, minHeight: '100%', paddingBottom: 48, overflow: 'hidden' },
  ambientOrb: { position: 'absolute', width: 360, height: 360, borderRadius: 180, borderWidth: 1, borderColor: gold, backgroundColor: 'rgba(200,167,122,.1)', top: 90, right: -210 }, ambientOrbResult: { position: 'absolute', width: 420, height: 420, borderRadius: 210, borderWidth: 1, borderColor: ink, top: 80, right: -250 },
  brandRow: { height: 72, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.12)', backgroundColor: ink },
  mark: { width: 34, height: 34, borderWidth: 1, borderColor: 'rgba(200,167,122,.65)', alignItems: 'center', justifyContent: 'center' }, markText: { color: gold, fontFamily: display, fontSize: 17 }, brand: { color: ivory, marginLeft: 11, fontFamily: 'Newsreader_600SemiBold', fontSize: 14, letterSpacing: 2.7 }, language: { marginLeft: 'auto', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', paddingHorizontal: 12, paddingVertical: 8 }, languageText: { color: gold, fontWeight: '800', fontSize: 10 },
  hero: { paddingHorizontal: 20, paddingTop: 44, paddingBottom: 36 }, edition: { color: gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.9 }, title: { color: ivory, fontFamily: display, fontSize: 58, lineHeight: 56, letterSpacing: -2.2, marginTop: 18 }, intro: { color: 'rgba(245,240,232,.58)', fontSize: 15, lineHeight: 24, marginTop: 22 }, trustRow: { marginTop: 24, gap: 9 }, trust: { color: 'rgba(245,240,232,.5)', fontSize: 11 },
  session: { marginHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', backgroundColor: panel }, sessionTop: { paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }, sessionTopText: { color: gold, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, lock: { color: 'rgba(255,255,255,.35)', marginLeft: 'auto' }, sessionBody: { padding: 20 }, progressText: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, micro: { color: 'rgba(255,255,255,.35)', fontSize: 8, fontWeight: '800', letterSpacing: 1 }, microGold: { color: gold, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, track: { height: 1, backgroundColor: 'rgba(255,255,255,.1)', marginTop: 12 }, trackFill: { height: 1, backgroundColor: gold }, question: { color: ivory, fontFamily: display, fontSize: 30, lineHeight: 34, marginTop: 28 }, options: { gap: 8, marginTop: 22 }, option: { minHeight: 82, borderWidth: 1, borderColor: 'rgba(255,255,255,.11)', padding: 15 }, optionSelected: { borderColor: gold, backgroundColor: 'rgba(217,187,145,.09)' }, optionTop: { flexDirection: 'row', alignItems: 'flex-start' }, optionTitle: { color: ivory, fontSize: 13, fontWeight: '700', flex: 1 }, optionBody: { color: 'rgba(255,255,255,.42)', fontSize: 11, lineHeight: 17, marginTop: 6, paddingRight: 28 }, radio: { width: 17, height: 17, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' }, radioSelected: { backgroundColor: gold, borderColor: gold }, check: { color: ink, fontSize: 10, fontWeight: '900' }, actions: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { color: 'rgba(255,255,255,.48)', fontSize: 11, fontWeight: '700' }, disabled: { opacity: 0.2 }, goldButton: { minHeight: 48, backgroundColor: bronze, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }, goldButtonText: { color: ink, fontSize: 11, fontWeight: '800' }, note: { color: 'rgba(245,240,232,.36)', fontSize: 10, lineHeight: 17, textAlign: 'center', paddingHorizontal: 30, marginTop: 24 },
  fields: { marginTop: 28 }, fieldLabel: { color: 'rgba(245,240,232,.65)', fontSize: 11, fontWeight: '700', marginBottom: 7 }, input: { height: 54, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', color: ivory, paddingHorizontal: 14, fontSize: 15, marginBottom: 17, backgroundColor: 'rgba(255,255,255,.025)' }, inputNote: { color: 'rgba(245,240,232,.34)', fontSize: 10, lineHeight: 16, marginTop: 2 }, goldButtonWide: { minHeight: 52, backgroundColor: bronze, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, buttonPressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  calculationPage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, overflow: 'hidden' }, calcMonogram: { width: 82, height: 82, borderWidth: 1, borderColor: 'rgba(217,187,145,.38)', alignItems: 'center', justifyContent: 'center' }, calcMonogramText: { color: gold, fontFamily: display, fontSize: 38 }, calcTitle: { color: ivory, fontFamily: display, fontSize: 40, lineHeight: 44, textAlign: 'center', marginTop: 30 }, calcCopy: { color: 'rgba(245,240,232,.42)', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 }, calcTrack: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,.1)', marginTop: 38, overflow: 'hidden' }, calcFill: { height: 1, width: '100%', backgroundColor: gold, transformOrigin: 'left' },
  resultLabel: { color: 'rgba(23,20,28,.6)', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 44, paddingHorizontal: 20 }, resultTitle: { color: ink, fontFamily: display, fontSize: 58, lineHeight: 55, letterSpacing: -2, paddingHorizontal: 20, marginTop: 16 }, resultIntro: { color: 'rgba(23,20,28,.68)', fontSize: 15, lineHeight: 24, paddingHorizontal: 20, marginTop: 22 }, resultGrid: { marginTop: 36, borderTopWidth: 1, borderTopColor: 'rgba(23,20,28,.2)' }, resultCard: { minHeight: 210, borderBottomWidth: 1, borderBottomColor: 'rgba(23,20,28,.2)', padding: 22, overflow: 'hidden' }, cardIndex: { color: 'rgba(23,20,28,.54)', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, cardTitle: { color: ink, fontFamily: display, fontSize: 31, lineHeight: 34, marginTop: 30 }, cardBody: { color: 'rgba(23,20,28,.66)', fontSize: 13, lineHeight: 21, marginTop: 12 }, sourceBody: { color: 'rgba(23,20,28,.5)', fontSize: 11, lineHeight: 19, marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(23,20,28,.14)', paddingTop: 14 }, cardAccent: { position: 'absolute', width: 90, height: 1, backgroundColor: '#2A1824', right: 0, bottom: 0 }, darkButton: { backgroundColor: '#2A1824', marginHorizontal: 20, marginTop: 30, minHeight: 50, alignItems: 'center', justifyContent: 'center' }, darkButtonText: { color: ivory, fontSize: 11, fontWeight: '800' },
});
