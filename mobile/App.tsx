import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Locale = 'en' | 'tr';
type Goal = 'space' | 'focus' | 'slow' | 'boundary';
type MindState = 'busy' | 'restless' | 'tired' | 'steady';

const copy = {
  en: {
    toggle: 'TR', kicker: 'A QUIETER WAY TO CHECK IN', title: 'Make room for what matters.',
    subtitle: 'A low-pressure space to notice what you need and choose one small next step.',
    formTitle: 'How are you arriving today?', formCopy: 'There are no right answers. Choose what feels closest.',
    nameLabel: 'What should we call you?', namePlaceholder: 'Your name', goalLabel: 'What would help most right now?', stateLabel: 'How does your mind feel?', submit: 'Build my guide',
    goals: { space: 'Clear my head', focus: 'Find focus', slow: 'Slow down', boundary: 'Set a boundary' },
    states: { busy: 'Busy', restless: 'Restless', tired: 'Tired', steady: 'Steady' },
    resultKicker: 'YOUR CHECK-IN', resultTitle: 'A gentler plan for today.', resultCopy: 'Use what helps, leave what does not. This is a practical reflection—not a label or a diagnosis.',
    start: 'START HERE', remember: 'KEEP IN MIND', practice: 'TRY THIS NOW',
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
    nextStep: 'One small next step', footer: 'Holyarted supports everyday reflection. It is not medical care or a diagnostic tool.',
  },
  tr: {
    toggle: 'EN', kicker: 'KENDİNE BAKMANIN DAHA SAKİN BİR YOLU', title: 'Önemli olana yer aç.',
    subtitle: 'Neye ihtiyaç duyduğunu fark etmek ve küçük bir sonraki adım seçmek için baskısız bir alan.',
    formTitle: 'Bugüne nasıl geliyorsun?', formCopy: 'Doğru cevap yok. Sana en yakın geleni seç.',
    nameLabel: 'Sana nasıl hitap edelim?', namePlaceholder: 'Adın', goalLabel: 'Şu an en çok ne yardımcı olur?', stateLabel: 'Zihnin şu an nasıl?', submit: 'Rehberimi oluştur',
    goals: { space: 'Zihnimi boşaltmak', focus: 'Odaklanmak', slow: 'Yavaşlamak', boundary: 'Sınır koymak' },
    states: { busy: 'Dolu', restless: 'Huzursuz', tired: 'Yorgun', steady: 'Dengeli' },
    resultKicker: 'BUGÜNKÜ CHECK-IN’İN', resultTitle: 'Bugün için daha yumuşak bir plan.', resultCopy: 'İşine yarayanı al, yaramayanı bırak. Bu pratik bir düşünme alanı; bir etiket veya tanı değil.',
    start: 'BURADAN BAŞLA', remember: 'AKLINDA OLSUN', practice: 'ŞİMDİ DENE',
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
    nextStep: 'Küçük bir sonraki adım', footer: 'Holyarted günlük öz-farkındalığı destekler; tıbbi bakım veya tanı aracı değildir.',
  },
} as const;

export default function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [name, setName] = useState('Derya');
  const [goal, setGoal] = useState<Goal>('space');
  const [mindState, setMindState] = useState<MindState>('busy');
  const [result, setResult] = useState({ name: 'Derya', goal: 'space' as Goal, mindState: 'busy' as MindState });
  const text = copy[locale];
  const goalCard = text.goalsContent[result.goal];
  const stateCard = text.statesContent[result.mindState];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>H</Text></View>
            <Text style={styles.brand}>HOLYARTED</Text>
            <Pressable style={styles.language} onPress={() => setLocale(locale === 'en' ? 'tr' : 'en')} accessibilityRole="button" accessibilityLabel="Change language"><Text style={styles.languageText}>{text.toggle}</Text></Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.kicker}>{text.kicker}</Text>
            <Text style={styles.title}>{text.title}</Text>
            <Text style={styles.subtitle}>{text.subtitle}</Text>
            <View style={styles.reassuranceRow}><Text style={styles.reassurance}>✓ {locale === 'en' ? 'No labels' : 'Etiket yok'}</Text><Text style={styles.reassurance}>✓ {locale === 'en' ? 'No prediction' : 'Öngörü yok'}</Text></View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{text.formTitle}</Text>
            <Text style={styles.formCopy}>{text.formCopy}</Text>
            <Text style={styles.label}>{text.nameLabel}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={text.namePlaceholder} placeholderTextColor="#80918B" style={styles.input} autoCapitalize="words" />

            <Text style={styles.label}>{text.goalLabel}</Text>
            <View style={styles.optionGrid}>{(Object.keys(text.goals) as Goal[]).map((item) => <Pressable key={item} onPress={() => setGoal(item)} style={[styles.option, goal === item && styles.optionSelected]}><Text style={[styles.optionText, goal === item && styles.optionTextSelected]}>{text.goals[item]}</Text></Pressable>)}</View>

            <Text style={styles.label}>{text.stateLabel}</Text>
            <View style={styles.pillRow}>{(Object.keys(text.states) as MindState[]).map((item) => <Pressable key={item} onPress={() => setMindState(item)} style={[styles.pill, mindState === item && styles.pillSelected]}><Text style={[styles.pillText, mindState === item && styles.pillTextSelected]}>{text.states[item]}</Text></Pressable>)}</View>

            <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => setResult({ name: name.trim() || (locale === 'en' ? 'You' : 'Sen'), goal, mindState })}><Text style={styles.buttonText}>{text.submit}</Text><Text style={styles.buttonArrow}>→</Text></Pressable>
          </View>

          <View style={styles.resultHeader}><Text style={styles.resultKicker}>{text.resultKicker} · {result.name.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')}</Text><Text style={styles.resultTitle}>{text.resultTitle}</Text><Text style={styles.resultIntro}>{text.resultCopy}</Text></View>
          {[[text.start, goalCard[0], goalCard[1]], [text.remember, stateCard[0], stateCard[1]], [text.practice, text.nextStep, stateCard[2]]].map(([eyebrow, title, body], index) => <View key={eyebrow} style={[styles.resultCard, index === 1 && styles.resultCardLavender]}><View style={styles.cardHandle} /><Text style={styles.cardEyebrow}>{eyebrow}</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardCopy}>{body}</Text></View>)}
          <Text style={styles.footer}>{text.footer}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ink = '#18332E';
const cream = '#F7F4ED';
const paper = '#FFFDF8';
const sage = '#DCE9E4';
const coral = '#ED8F70';
const muted = '#62736E';
const display = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: cream }, content: { paddingBottom: 56 },
  brandRow: { minHeight: 76, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: paper, borderBottomWidth: 1, borderBottomColor: '#DDE2DD' },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' }, brandMarkText: { color: paper, fontFamily: display, fontSize: 20, fontWeight: '700' },
  brand: { marginLeft: 12, color: ink, letterSpacing: 3.4, fontSize: 14, fontWeight: '800' }, language: { marginLeft: 'auto', borderWidth: 1, borderColor: '#C8D0CB', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: paper }, languageText: { color: ink, fontSize: 11, fontWeight: '800' },
  hero: { backgroundColor: sage, paddingHorizontal: 20, paddingTop: 42, paddingBottom: 36 }, kicker: { color: '#52786C', letterSpacing: 1.8, fontWeight: '800', fontSize: 10, marginBottom: 16 }, title: { color: ink, fontFamily: display, fontSize: 54, lineHeight: 51, letterSpacing: -1.8 }, subtitle: { color: '#4F6560', lineHeight: 23, marginTop: 20, fontSize: 15 },
  reassuranceRow: { flexDirection: 'row', gap: 8, marginTop: 22, flexWrap: 'wrap' }, reassurance: { backgroundColor: '#F4F8F6', color: '#35524B', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, fontWeight: '700' },
  formCard: { backgroundColor: paper, borderRadius: 26, padding: 22, marginHorizontal: 16, marginTop: -2, shadowColor: '#2D4E44', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 3 },
  formTitle: { color: ink, fontFamily: display, fontSize: 31, lineHeight: 35 }, formCopy: { color: muted, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 24 }, label: { color: ink, fontSize: 13, fontWeight: '700', marginBottom: 9, marginTop: 5 },
  input: { height: 50, borderRadius: 16, borderWidth: 1, borderColor: '#D6DDD8', backgroundColor: cream, color: ink, paddingHorizontal: 15, fontSize: 16, marginBottom: 20 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, option: { width: '48%', minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#D6DDD8', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: paper }, optionSelected: { backgroundColor: sage, borderColor: '#52786C' }, optionText: { color: muted, fontSize: 12, fontWeight: '700' }, optionTextSelected: { color: ink },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 22 }, pill: { borderRadius: 18, borderWidth: 1, borderColor: '#D6DDD8', paddingHorizontal: 13, paddingVertical: 9, backgroundColor: paper }, pillSelected: { backgroundColor: ink, borderColor: ink }, pillText: { color: muted, fontSize: 12, fontWeight: '700' }, pillTextSelected: { color: paper },
  button: { height: 54, borderRadius: 17, backgroundColor: coral, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] }, buttonText: { color: ink, fontSize: 15, fontWeight: '800' }, buttonArrow: { color: ink, fontSize: 22 },
  resultHeader: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 20 }, resultKicker: { color: '#52786C', fontSize: 10, letterSpacing: 1.8, fontWeight: '800' }, resultTitle: { color: ink, fontFamily: display, fontSize: 43, lineHeight: 44, marginTop: 9 }, resultIntro: { color: muted, fontSize: 13, lineHeight: 21, marginTop: 14 },
  resultCard: { backgroundColor: paper, borderRadius: 24, padding: 22, marginHorizontal: 16, marginBottom: 12, minHeight: 220, borderWidth: 1, borderColor: '#E0E3DE' }, resultCardLavender: { backgroundColor: '#E9E3F0', borderColor: '#DED5E7' }, cardHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#A9CBC0', marginBottom: 32 }, cardEyebrow: { color: '#52786C', fontSize: 10, letterSpacing: 1.6, fontWeight: '800' }, cardTitle: { color: ink, fontFamily: display, fontSize: 29, lineHeight: 32, marginTop: 8 }, cardCopy: { color: muted, fontSize: 14, lineHeight: 23, marginTop: 13 },
  footer: { color: '#7B8985', textAlign: 'center', lineHeight: 20, fontSize: 11, marginTop: 22, paddingHorizontal: 28 },
});
