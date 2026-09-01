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

import { calculateProfile } from './lib/numerology';

const labels: Record<number, string> = {
  1: 'Öncü', 2: 'Dengeleyici', 3: 'Yaratıcı', 4: 'İnşa eden', 5: 'Özgür ruh', 6: 'Şefkatli',
  7: 'Bilge', 8: 'Dönüştürücü', 9: 'Şifacı', 11: 'İlham veren', 22: 'Usta kurucu', 33: 'Evrensel rehber',
};

export default function App() {
  const [name, setName] = useState('Derya');
  const [birthDate, setBirthDate] = useState('1992-07-14');
  const [profile, setProfile] = useState(() => calculateProfile('Derya', '1992-07-14'));
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandStar}>✦</Text></View>
            <Text style={styles.brand}>HOLYARTED</Text>
            <View style={styles.language}><Text style={styles.languageText}>TR</Text></View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.kicker}>☾  KENDİ RİTMİNİ HATIRLA</Text>
            <Text style={styles.title}>İçindeki{`\n`}<Text style={styles.titleAccent}>haritayı</Text> oku.</Text>
            <Text style={styles.subtitle}>İsmin ve doğum tarihin, karakterinin ve hayat yönünün sessiz bir imzası.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formEyebrow}>KİŞİSEL HARİTA</Text>
            <Text style={styles.formTitle}>Yolculuğun nerede başlıyor?</Text>
            <Text style={styles.label}>Adın</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Adını yaz" placeholderTextColor="#76857e" style={styles.input} autoCapitalize="words" />
            <Text style={styles.label}>Doğum tarihin</Text>
            <TextInput value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-AA-GG" placeholderTextColor="#76857e" style={styles.input} keyboardType="numbers-and-punctuation" maxLength={10} />
            <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => { setProfile(calculateProfile(name, birthDate)); setExpanded(null); }}>
              <Text style={styles.buttonText}>Haritamı aç</Text><Text style={styles.buttonArrow}>→</Text>
            </Pressable>
          </View>

          <View style={styles.numberCard}>
            <View style={styles.numberCopy}><Text style={styles.numberEyebrow}>{profile.name.toLocaleUpperCase('tr-TR')} İÇİN ANA TİTREŞİM</Text><Text style={styles.numberTitle}>{labels[profile.lifeNumber] ?? 'Bütünleyen'}</Text></View>
            <View style={styles.numberCircle}><Text style={styles.number}>{profile.lifeNumber}</Text></View>
          </View>

          <View style={styles.resultHeader}><Text style={styles.resultKicker}>KİŞİSEL YORUM</Text><Text style={styles.resultTitle}>Sayıların sende anlattığı hikâye.</Text></View>
          {profile.sections.map((section) => {
            const isExpanded = expanded === section.key;
            return (
              <Pressable key={section.key} style={styles.resultCard} onPress={() => setExpanded(isExpanded ? null : section.key)}>
                <View style={styles.resultTop}><Text style={styles.resultCardKicker}>{section.title.toLocaleUpperCase('tr-TR')}</Text><View style={styles.smallNumber}><Text style={styles.smallNumberText}>{section.number}</Text></View></View>
                <Text style={styles.resultCopy} numberOfLines={isExpanded ? undefined : 6}>{section.content}</Text>
                <Text style={styles.readMore}>{isExpanded ? 'Kısalt ↑' : 'Tam yorum ↓'}</Text>
              </Pressable>
            );
          })}

          <Text style={styles.disclaimer}>Bu harita kesin bir kader anlatısı değil; kendini görmek ve yeni sorular sormak için bir aynadır.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const gold = '#D8AA5B';
const ink = '#071713';
const card = '#10251F';
const cream = '#F4EEDD';
const display = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: ink },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 56 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandMark: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#8C713C', alignItems: 'center', justifyContent: 'center', backgroundColor: '#142820' },
  brandStar: { color: gold, fontSize: 16 },
  brand: { marginLeft: 12, color: cream, letterSpacing: 4, fontFamily: display, fontSize: 16 },
  language: { marginLeft: 'auto', borderWidth: 1, borderColor: '#30443D', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  languageText: { color: cream, fontSize: 12 },
  intro: { marginBottom: 28 },
  kicker: { color: gold, letterSpacing: 2, fontWeight: '700', fontSize: 11, marginBottom: 18 },
  title: { color: cream, fontFamily: display, fontSize: 58, lineHeight: 54, letterSpacing: -2 },
  titleAccent: { color: gold, fontStyle: 'italic' },
  subtitle: { color: '#9EACA5', lineHeight: 24, marginTop: 22, fontSize: 15, maxWidth: 330 },
  formCard: { backgroundColor: card, borderWidth: 1, borderColor: '#30443D', borderRadius: 24, padding: 22, marginBottom: 14 },
  formEyebrow: { color: gold, letterSpacing: 2.3, fontWeight: '700', fontSize: 10 },
  formTitle: { color: cream, fontFamily: display, fontSize: 29, lineHeight: 33, marginTop: 8, marginBottom: 24 },
  label: { color: cream, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#385047', backgroundColor: '#0B1B17', color: cream, paddingHorizontal: 15, fontSize: 16, marginBottom: 18 },
  button: { height: 52, borderRadius: 14, backgroundColor: gold, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { color: ink, fontSize: 15, fontWeight: '800' },
  buttonArrow: { color: ink, fontSize: 23 },
  numberCard: { borderRadius: 22, backgroundColor: '#172D26', borderWidth: 1, borderColor: '#6A5530', padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 50 },
  numberCopy: { flex: 1, paddingRight: 14 },
  numberEyebrow: { color: '#9EACA5', fontSize: 9, letterSpacing: 1.3, marginBottom: 5 },
  numberTitle: { color: cream, fontFamily: display, fontSize: 28 },
  numberCircle: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: gold, alignItems: 'center', justifyContent: 'center', backgroundColor: ink },
  number: { color: gold, fontFamily: display, fontSize: 29 },
  resultHeader: { marginBottom: 20 },
  resultKicker: { color: gold, fontSize: 10, letterSpacing: 2.2, fontWeight: '700' },
  resultTitle: { color: cream, fontFamily: display, fontSize: 42, lineHeight: 43, marginTop: 8 },
  resultCard: { backgroundColor: '#EEE6D4', borderRadius: 22, padding: 22, marginBottom: 12 },
  resultTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  resultCardKicker: { color: '#936D2F', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  smallNumber: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#B58B48', alignItems: 'center', justifyContent: 'center' },
  smallNumberText: { color: '#8A6428', fontFamily: display, fontSize: 21 },
  resultCopy: { color: '#435851', fontSize: 14, lineHeight: 23 },
  readMore: { color: '#17312B', fontWeight: '800', fontSize: 12, marginTop: 18 },
  disclaimer: { color: '#7F9189', textAlign: 'center', lineHeight: 20, fontSize: 11, marginTop: 20, paddingHorizontal: 18 },
});
