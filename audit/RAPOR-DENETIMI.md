# Holyarted rapor denetimi — 29 Ekim 2026

**Durum: ONAYLANDI (29 Ekim 2026, Furkan Öksüz: "hepsini onaylıyorum").** Uygulanabilen öneriler bu branch'te uygulandı; neyin uygulanıp neyin beklediği [Bölüm 6](#6-uygulama-durumu)'da. Veri metinleri ve hesaplama kuralı değiştirilmedi.

- Branch: `feature/report-audit-tests` (`clean-skeleton`'dan ayrıldı; ana branch'e dokunulmadı)
- Tekrar üretmek için: `node audit/run-audit.mjs` (Node 22.13+)
- Kişilerin aldığı metinlerin tamamı: [output/persona-outputs.md](output/persona-outputs.md)
- Tüm metinlerin makine taraması: [output/scan.json](output/scan.json)

## 0. Kapsam: görev tanımı ile sistemin gerçek durumu

Görev tanımındaki bazı varsayımlar repoda karşılık bulmuyor. Denetim, sistemin **gerçekte ürettiği** çıktı üzerinden yapıldı.

| Görev tanımı | Repodaki gerçek durum | Denetime etkisi |
| --- | --- | --- |
| Excel tabloları | `data/*.json` (Excel'den dönüştürülmüş olmalı). Değişmez kaynak olarak bunlar alındı. | Excel'le birebir uyum ayrıca doğrulanmalı (Bölüm 2-A). |
| Ad, doğum tarihi, **saat, yer** | Yalnızca ad, soyad ve doğum tarihi kullanılıyor. Saat ve yer hiçbir yerde yok. | Saat/yer kaynaklı kişiselleştirme denetlenemez. |
| Enneagram / mizaç | Kodda ve veride mizaç yok. Numeroloji var: vitrin, yetenek, meslek, hayat yolu; ayrıca kullanılmayan piramit ve sinerji. | Mizaç–numeroloji çelişkisi (P5 tipi) yerine numeroloji içi çelişki denetlendi. |
| Basic / Gold / Platinum | Kodda Basic / Plus / Premium var. Bu belgede **Gold = Plus**, **Platinum = Premium** alındı. | Bölüm 3 bu eşlemeyle yazıldı. |
| Aktif üretim prompt'u | Web uygulaması LLM kullanmıyor; metinler veriden olduğu gibi gösteriliyor. Tek prompt `data/llm_config.json` (eski, çalışmayan `api/` kodu). | Bölüm 4'te hem şablon hem bu prompt'un revizyonu önerildi. |

Raporun bugünkü bileşenleri:

- **Portre kartları:** `web/app/experience.tsx` içinde elle yazılmış kısa kartlar. Basic'te 2 kart, Plus'ta 4 kart, Premium'da bunlara ek olarak 2 "bakış" kartı. Bu kartlar veri dosyalarından değil, uygulama metninden geliyor.
- **Detaylı okuma:** `data/` metinleri: vitrin, yetenekler, ideal iş, hayat yolu. Yalnızca `feature/no-login-local` branch'inde ekrana bağlı.

## 1. Simüle kişi seti

36 kişi, 18–40 yaş (29 Ekim 2026 itibarıyla). Dağılım: 18 kadın, 13 erkek, 3 non-binary, 1 belirtilmemiş, 1 cinsiyet ikizi çifti (P25 kadın / P26 erkek, aynı girdi). Kişiler; ad yapısı (bileşik, tireli, yabancı, Kürtçe, Türkçe karakter yoğun, sesli harfsiz), tarih uçları (1 Ocak, 31 Aralık, 29 Şubat, usta sayı günleri) ve yaşam bağlamı (boşanma, dul, yeni ebeveyn, poliamori, aynı cinsiyetten ilişki, engellilik, göç, kırsal yaşam, kariyer kesintisi) bakımından ayrışacak biçimde seçildi.

Verideki 13 vitrin anahtarından 12'si, 13 yetenek ve 13 meslek anahtarının **tamamı** bu setle kapsanıyor. Kapsanmayan tek vitrin anahtarı olan 33'e hiçbir doğum günü ulaşamıyor (Bölüm 2-A). Hayat yolunda 45 anahtarın 19'u kapsandı; 45'in tamamı ayrıca makine taramasıyla denetlendi.

Görev tanımındaki beş arketipin karşılığı:

| Arketip | Kişiler |
| --- | --- |
| P1 · 18–22 · kimlik oluşumu | P01, P02, P03, P04, P05, P36 |
| P2 · 28–32 · kariyer/ilişki dönüşümü | P12, P13, P14, P15, P31, P34 |
| P3 · 38–40 · olgunluk/bütünleşme | P21, P22, P23 |
| P4 · karmaşık ad / yüksek veri yoğunluğu | P08, P10, P19, P20, P11 |
| P5 · çelişkili / uç durum | P18 (sesli harf yok), P04, P14, P27 (meslek 33), P31 (kopya yetenek metni), P25–P26 (cinsiyet ikizi) |

| ID | Yaş | Cinsiyet | Ad Soyad | Doğum | Vitrin | Yetenek | Meslek | Hayat yolu | İlişki / yaşam bağlamı |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | 18 | kadın | Ece Su Kaya | 2008-03-11 | 11 | 6 | 1 | 156 | ilk ciddi ilişki; hazırlık öğrencisi |
| P02 | 19 | erkek | Arda Yılmaz | 2007-01-01 | 1 | 3 | 11 | 112 | bekar; üniversite 1 |
| P03 | 20 | non-binary | Deniz Aksoy | 2006-02-28 | 1 | 3 | 3 | 202 | bağlanmaktan çekiniyor; sanat öğrencisi |
| P04 | 21 | kadın | Rojda Ünal | 2005-07-22 | 22 | 11 | **33** | 189 | uzak mesafe; hemşirelik öğrencisi |
| P05 | 22 | erkek | Mehmet Ali Öztürk | 2004-02-29 | 11 | 11 | 8 | 1910 | evlilik baskısı; aile şirketi |
| P06 | 23 | erkek | Can Er | 2003-09-19 | 19 | 6 | 5 | 246 | birlikte yaşıyor; stajyer |
| P07 | 23 | kadın | Zeynep Nur Çağlayan | 2002-12-31 | 4 | 7 | 1 | 112 | nişanlı; öğretmen adayı |
| P08 | 25 | erkek | Şükrü Güneş Uğurlu | 2001-05-05 | 5 | 5 | 4 | 134 | ayrılık sonrası; yeni şehir |
| P09 | 26 | kadın | Elif Şahin-Korkmaz | 2000-10-10 | 1 | 4 | 7 | 44 | yeni evli; avukat |
| P10 | 27 | erkek | Abdurrahman Karaosmanoğlu | 1999-08-08 | 8 | 6 | 6 | 448 | ilk çocuğu yolda; esnaf |
| P11 | 28 | erkek | Jean-Luc Moreau | 1998-04-27 | 9 | 6 | 4 | 404 | kültürlerarası ilişki |
| P12 | 28 | kadın | Sıla Ilgın Aydın | 1997-11-29 | 11 | 11 | 1 | 3912 | boşanmış, temkinli |
| P13 | 30 | non-binary | Yağmur Özdemir | 1996-06-30 | 3 | 6 | 4 | 347 | aynı cinsiyetten partner |
| P14 | 31 | erkek | Barış Kaya | 1995-03-03 | 3 | 3 | **33** | 303 | yeni baba |
| P15 | 31 | kadın | Ayşegül Ünal | 1994-12-12 | 3 | 4 | 3 | 2911 | evlilik kararı; kariyer değişimi |
| P16 | 33 | erkek | Emre Can Toprak | 1993-01-23 | 5 | 9 | 5 | 2810 | sık ilişki değişimi; şirketi batmış |
| P17 | 34 | kadın | Gökçe Ilıcak | 1992-09-09 | 9 | 3 | 5 | 3912 | evli, iki çocuk |
| P18 | 35 | kadın | Lyn Sky | 1991-04-14 | 5 | **0** | 7 | 2911 | bekar; müzisyen |
| P19 | 36 | kadın | Anna Hannah Aras | 1990-07-17 | 8 | 6 | 7 | 347 | kaçıngan partner |
| P20 | 37 | erkek | Hüseyin Hüsnü Çelikkanat | 1989-02-14 | 5 | 3 | 1 | 347 | evlilikte uzun çatışma |
| P21 | 38 | kadın | Nilüfer Gün | 1988-10-28 | 1 | 2 | 1 | 3710 | dul |
| P22 | 39 | erkek | Kemal Erdoğan | 1987-05-25 | 7 | 9 | 7 | 3710 | evli, tükenmişlik |
| P23 | 40 | kadın | Meryem Doğan | 1986-08-04 | 4 | 8 | 3 | 369 | bekar anne |
| P24 | 30 | belirtilmemiş | Alex Morgan | 1996-07-16 | 7 | 4 | 11 | 3912 | belirtilmemiş |
| P25 | 27 | kadın | Deniz Yıldız | 1999-03-15 | 6 | 5 | 8 | 3710 | ilişkide; mimar |
| P26 | 27 | erkek | Deniz Yıldız | 1999-03-15 | 6 | 5 | 8 | 3710 | ilişkide; mimar |
| P27 | 24 | erkek | Can Şahin | 2001-11-11 | 11 | 11 | **33** | 77 | bekar |
| P28 | 32 | kadın | İrem Ilıcak | 1994-06-06 | 6 | 33 | 9 | 358 | partneri iş ortağı |
| P29 | 36 | erkek | Ömer Faruk Koç | 1990-01-19 | 19 | 3 | 11 | 303 | eşiyle iletişim sorunu |
| P30 | 33 | kadın | Pınar Toprak | 1993-09-30 | 3 | 8 | 4 | 347 | yeni ilişkiye açık |
| P31 | 28 | kadın | Zeynep Kılıç | 1998-06-20 | 2 | **1** | 9 | 358 | birlikte yaşıyor; tekerlekli sandalye kullanıcısı |
| P32 | 34 | erkek | Mehmet Bozkurt | 1991-12-02 | 2 | 19 | 6 | 257 | eşi yurt dışında; göç |
| P33 | 26 | non-binary | Yağmur Kılıç | 2000-04-16 | 7 | 22 | 3 | 134 | poliamori |
| P34 | 31 | erkek | Kaan Koç | 1995-08-13 | 4 | 8 | 2 | 369 | sakatlık sonrası kariyer |
| P35 | 36 | kadın | Tuğba Taş | 1989-11-07 | 7 | 5 | 19 | 369 | köyde, aile tarlasında |
| P36 | 19 | kadın | Ada Kurt | 2007-05-18 | 9 | 5 | 22 | 235 | lise sonrası kasiyer |

Kalın değerler hatalı çıktı üreten anahtarlardır.

## 2. Barnum etkisi ve ilişki dinamikleri denetimi

### 2-A. Kritik veri hataları (kullanıcıya bozuk rapor gidiyor)

Bunlar dil kalitesi değil, doğrudan hatalı çıktıdır. Veri değişmez kaynak olduğu için **düzeltmeyi yapmadım**. Her birinin doğru metni Excel'den teyit edilmeli.

1. **Meslek 33 = `"n/a"`.** `ideal_job.json` içindeki 33 numaralı kayıt metin değil, yer tutucu. İsim toplamı 33 olan herkes "İdeal iş" bölümünde `n/a` görüyor: P04, P14, P27. Barış Kaya, Can Şahin, Ece Arslan gibi çok yaygın isimler bu gruba giriyor; denenen 1.800 ad-soyad kombinasyonunun yaklaşık %2'si.
2. **Yetenek 0 için metin yok.** Adında A, E, I, O, U bulunmayan kişilerde sesli harf toplamı 0 çıkıyor. Hesaplama Y'yi sesli harf saymıyor. Veride "0" anahtarı olmadığı için bölüm boş kalıyor: P18 Lyn Sky. Sahne adları ve yabancı adlar için gerçekçi bir durum.
3. **Yetenek 1, Vitrin 33'ün birebir kopyası.** `abilities["1"]`, `showcase["33"]` ile aynı 2.119 karakter ("ruhsal tekâmül" metni). Yetenek 1'e düşen herkes (P31) bir vitrin metnini yetenek diye okuyor. Ayrıca vitrin 33'e hiçbir doğum günü ulaşamıyor (ay en fazla 31 gün; 29 → 11'e indiriliyor). Muhtemel açıklama: Excel'den aktarımda sütunlar kaymış. Doğru yetenek 1 metni Excel'den alınmalı.
4. **Hayat yolu 123 = 213, birebir aynı.** 12 ve 21 tarih toplamları farklı kişilere aynı metni veriyor.
5. **Rakamları yer değiştirmiş diğer anahtarlar yarı kopya.** 145/415 (21 ortak cümle), 235/325 (16), 347/437 (14), 134/314 (11), 246/426 (3). Bu çiftlerdeki kişiler raporlarını karşılaştırırsa aynı paragrafları görür. Bu kasıtlı da olabilir (aynı indirgenmiş sayı), ama Excel'de böyle olup olmadığı kontrol edilmeli.

### 2-B. Barnum (soğuk okuma) bulguları

- **Yoğunluk.** "bazen / zaman zaman / kimi zaman / genellikle / çoğu zaman" ifadeleri 1.000 kelimede ortalama hayat yolunda **11,3**, yetenekte 8,1, vitrinde 7,2 kez geçiyor; meslekte hiç geçmiyor. En yoğun metinler: hayat yolu 99 (32,5), 88 (26,5), 112 (26,3), 66 (22,9), yetenek 6 (21,6).
- **"X'sin, ancak bazen Y'sin" kalıbı.** Tüm veride **146 cümle** bu kalıpta. Bu, Barnum etkisinin ders kitabı tanımı: hem güçlü yanı hem karşıtını söyleyerek herkese uyan bir cümle. Örnekler (kişilerin gerçekte aldığı metinlerden):
  - Yetenek 6 (P01, P06, P10, P11, P13, P19): "Ancak, bazen fazla kontrolcü olabilir, başkalarının hayatlarına müdahale etme eğiliminde olabilirsin."
  - Hayat yolu 112 (P02, P07): "Bazen, toplumun veya çevrenin beklentileriyle kendi yaratıcı kimliğin arasında bir çatışma hissedebilirsin."
  - Hayat yolu 347 (P13, P19, P20, P30): "Ama bazen, hayatın kendi akışına güvenmek gerekiyor."
- **Açık evrensel iddia.** Hayat yolu 2911 (P15, P18): "Birçok insan gibi, belki de geçmişte kendini ifade etmekte zorlandın ya da sevgi ve güven eksiklikleri hissettin." Hem "birçok insan gibi" hem "belki de" içeriyor; görev tanımına göre **kritik sistem hatası** sınıfında.
- **Çift olasılık eki.** "-ebilir / -abilirsin" ile kurulan cümleler, sinyal taşımayan kehanete dönüşüyor ("seni yavaşlatabilir", "tükenmiş hissettirebilir"). Kişiye özgü bir tetikleyici veya durum belirtilmiyor.
- **Barnum olmayan güçlü taraf:** Meslek metinleri somut rol listeleri içeriyor ve kaçamak ifade kullanmıyor. Tonu en net olan veri bu.

### 2-C. Kişiselleştirme sınırı: yaş, cinsiyet ve yaşam bağlamı

- **Cinsiyet:** Hesaplama cinsiyeti kullanmıyor. P25 (kadın) ve P26 (erkek) birebir aynı raporu aldı. Metinler ikinci tekil şahısla yazıldığı için cinsiyetli dil ("kadın, erkek, anne, baba, kocan, karın") **hiç bulunmadı**. Bu non-binary kişiler (P03, P13, P33) için olumlu. Tek eşleşme meslek 6'daki "Evlilik Danışmanı" bir meslek adı, sorun değil.
- **İlişki modeli:** "eşin, evlilik, karşı cins" gibi heteronormatif ifadeler raporlarda geçmiyor. Aynı cinsiyetten ilişki (P13) ve poliamori (P33) için dışlayıcı bir dil yok.
- **Yaş:** Raporda yaşa duyarlı hiçbir katman yok; metin, yaş yerine yalnızca rakam toplamlarına göre seçiliyor. Sonuç:
  - P01 (18, hazırlık öğrencisi) meslek 1'de "Üst Düzey Yönetici (CEO, Genel Müdür, Yönetim Kurulu Başkanı)", "General", "Vali, Bakan" önerisi alıyor.
  - P36 (19, kasiyer) meslek 22'de "Armatör", "Büyük Çaplı İhale Uzmanı" alıyor.
  - P35 (36, köyde tarımla uğraşıyor) için kırsal veya beden emeğine dayalı hiçbir karşılık yok.
  - Gençlere de 40 yaşındakilere de aynı "hayat yolculuğu" anlatısı veriliyor.
- **Hassas bağlam:** Hayat yolu 3710 (P21 dul, P22, P25, P26) "Hayat zaman zaman seni hayal kırıklıkları ve ihanetlerle sınayabilir." diyor. Yas yaşayan biri için kişisel ve ağır bir iddia. Raporun bir yaşam olayı bilgisi olmadığı halde böyle bir ima yapması risklidir.

### 2-D. İlişki derinliği

- **İlişki dili zayıf metinler:** İlişki, partner, aile, sınır, çatışma, güven, iletişim gibi kelimeler 1.000 kelimede 5'ten az geçen metinler:
  - Yetenek 3, 11, 33 (hiç yok)
  - Meslek 1, 3, 7, 8, 11, 22, 33
  - Hayat yolu 44, 55, 66, 112, 459 (hiç yok); 268, 358, 3811, 4610
  - Örnek kişi: P02'nin hem yetenek 3 hem hayat yolu 112 metninde ilişki boyutu yok.
- **İlişki geçen metinler de yüzeyde kalıyor.** Bağlanma biçimi, çatışma döngüsü, sınır yönetimi ya da iletişim tıkanıklığı somut bir tetikleyiciyle anlatılmıyor. Örnek, yetenek 6: "Ailen, sevdiklerin ve onların güvenliği senin için her şeyden önce gelir…" Değer ifadesi var, ama ilişkide nasıl davrandığı yok.
- **Asıl ilişki verisi hiç kullanılmıyor.** `synergy_c1-9` dosyalarında 9 ilişki sorusu var ("Birbirimizi nasıl görüyoruz?", "Birbirimize borcumuz", "İlişkinin şifası" vb.). `piramit_c1-9` içinde "Gerçek karakter / İLİŞKİLER" alanı var. Bunların hangi sayıyla seçileceğine dair kural kodda yok. Platinum/Premium'un "ilişki derinliği" vaadi bu veri bağlanmadan karşılanamaz.
- **Premium "İlişki bakışı" tek cümle.** Uygulamadaki ilişki kartı, ortam sorusuna verilen 4 olası cevaptan birine bağlı tek cümlelik bir metin. 36 kişinin hepsi bu 4 cümleden birini alıyor.

## 3. Katman bazında açık ve iyileştirme tablosu

Öneriler **sunum katmanı** içindir: hangi verinin hangi katmanda, hangi sırayla ve nasıl çerçevelenerek gösterileceği. Veri metinleri değiştirilmez; bozuk kayıtlar için yalnızca Excel'den doğru metnin alınması önerilir.

| Katman | Açık / zayıf bölüm | Yapısal ve ilişkisel etki | Önerilen revizyon |
| :--- | :--- | :--- | :--- |
| **Basic** | 2 elle yazılmış kart; 4 seçenekten biri seçiliyor, kullanıcının verisinden türemiyor. "Önce kanıt", "Konuşmada netlik" gibi metinler herkese uyabilir. | "Beni gördü" etkisi zayıf; aynı kartı 36 kişinin dörtte biri alıyor. | Basic'in çekirdeğini veriye dayandır: **vitrin metninin ilk paragrafı** + hesaplanan sayının adı ("Vitrin sayın 7"). Kart metinleri kaldırılmasın, sayının veriden gelen anlamına bağlanarak "neden bu sonuç" satırı eklensin. Ör.: "Doğum günün 7'ye indirgeniyor; vitrin metnin bu yüzden yalnız çalışma ve derin analiz üzerine." |
| **Basic** | Meslek 33 `n/a`, yetenek 0 boş (2-A/1-2). | Bozuk rapor; güven kaybı. | Sunumda yer tutucu veya eksik metin **hiç gösterilmesin**; bölüm "Bu bölüm hazırlanıyor" diye işaretlensin ve olay loglansın. Kalıcı çözüm: Excel'den doğru metin. |
| **Gold (Plus)** | Plus'ın farkı yalnızca 2 kart daha (zorlanma + amaç). Detaylı okuma katmana bağlı değil. | Basic'ten gerçekten yeni bir katman açılmıyor. | Plus = **yetenek + hayat yolu** tam metinleri + ilişki odaklı yeniden düzen: her metnin ilişki geçen paragrafları "İlişkide sen" başlığı altında öne alınsın. İlişki dili zayıf anahtarlar (yetenek 3, 11, 33; hayat yolu 44, 55, 66, 112, 459) için piramit "İLİŞKİLER" alanı ek kaynak olarak bağlansın (kural gerekli, bkz. Bölüm 5). |
| **Gold (Plus)** | Hayat yolunda yoğun "bazen… ancak…" kalıbı (146 cümle). | Kişi kendini değil, herkesi okuyor. | Veri sabit kaldığı için sunumda cümle **silinmez veya filtrelenmez**. Bunun yerine Bölüm 4'teki LLM katmanı yalnızca bu metinlerden, kaçamak ifade kullanmadan ilişki sentezi yapsın. Veri sahibi isterse Excel'de en yoğun 5 metin (hayat yolu 99, 88, 112, 66; yetenek 6) yeniden yazılabilir; bu ayrı bir onay gerektirir. |
| **Platinum (Premium)** | "İlişki bakışı" ve "İş bakışı" tek cümle; sinerji ve piramit kullanılmıyor; gölge çalışması, kriz yönetimi, yol haritası hiç yok. | Premium fiyatı içerikle desteklenmiyor. | Premium = **sinerji (iki kişilik rapor)** + **piramit (9 alan)** + kişisel yol haritası. Sinerji için ikinci kişi girişi gerekli. Piramit "Borçlar/OLUMLU", "Sezgiler/OLUMSUZ", "Beklenmedik olaylara tepkiler", "Gerçek karakter/İLİŞKİLER" alanları gölge ve kriz bölümlerinin doğal kaynağı. |
| **Platinum (Premium)** | Yaş ve yaşam evresi yok (P01'e "Bakan", P36'ya "Armatör"). | Gençler için gerçekçi olmayan, olgun kullanıcılar için yüzeysel öneri. | Sunumda yaşa göre çerçeve: 18–24 için meslek listesi "yöneldiğin alanlar ve ilk adımlar" diye sunulsun, 25–40 için "dönüşüm ve derinleşme". Liste değişmez, başlık ve giriş cümlesi değişir. |
| **Tüm katmanlar** | Hassas varsayımlar ("ihanetlerle sınayabilir"). | Yas/kayıp yaşayan kullanıcıda zarar riski. | Sunumda bu tür olay iması içeren cümlelerin önüne çerçeve: "Bu metin bir olasılığı anlatır, yaşadıklarına dair bir tespit değildir." Kalıcı çözüm Excel'de. |

## 4. Önerilen şablon ve prompt (ONAY BEKLİYOR)

Aşağıdakiler staging için taslaktır, üretimde değildir.

### 4-A. Rapor şablonu

```text
[KAPAK]
Ad Soyad · Doğum tarihi · Hesaplanan sayılar: Vitrin {showcase} · Yetenek {abilities} · Meslek {idealJob} · Hayat yolu {lifePath}
"Bu rapor yalnızca adın ve doğum tarihinden hesaplanır."

[BASIC]
1. Vitrin — {showcase}           : showcase[{showcase}] paragraf 1–2
   Neden bu sonuç                 : "Doğum günün {day}, {showcase}'e indirgeniyor."
2. Portre kartları (2)            : mevcut karar ve ortam kartları

[PLUS = GOLD]
3. Vitrin — tam metin             : showcase[{showcase}]
4. Yetenekler — {abilities}       : abilities[{abilities}]
5. Hayat yolu — {lifePath}        : life_path[{lifePath}]
6. İlişkide sen                   : 3–5 bölümlerindeki ilişki paragrafları + (kural onaylanınca) piramit "İLİŞKİLER"
7. Portre kartları (4)

[PREMIUM = PLATINUM]
8. İdeal iş — {idealJob}          : ideal_job[{idealJob}] (yaşa göre başlık: 18–24 "Yöneldiğin alanlar", 25–40 "Derinleşme alanları")
9. Piramit (9 alan)               : piramit_c{n} (seçim kuralı onay bekliyor)
10. Sinerji (iki kişi)             : synergy_c{n} (ikinci kişi girişi + kural onay bekliyor)
11. Yol haritası                   : LLM sentezi (4-B), yalnızca 1–10'daki metinlerden

[KORUMA KURALLARI]
- Metin yoksa veya "n/a" ise bölüm gösterilmez; "hazırlanıyor" notu ve log.
- Veri metinleri değiştirilmeden gösterilir; yalnızca başlık, sıra ve çerçeve cümlesi uygulamaya aittir.
```

### 4-B. `data/llm_config.json` için revize sistem prompt'u

Mevcut prompt "akıcı ve etkileyici bir anlatı" istiyor ve kaçamak ifadeyi yasaklamıyor. Bu da Barnum metin üretimini ödüllendiriyor. Öneri:

```text
Sen Holyarted raporlarının sentez editörüsün. Görevin, sana verilen numeroloji metinlerini YENİ BİLGİ EKLEMEDEN tek bir kişisel yol haritasına dönüştürmek.

Kaynak kuralı
- Yalnızca <kaynak> etiketleri içindeki metinleri kullan. Kaynakta olmayan hiçbir özellik, olay, ilişki durumu, yaş, cinsiyet veya geçmiş deneyim iddia etme.
- Her paragrafın sonunda dayandığı kaynakları köşeli parantezle belirt: [Vitrin 7], [Hayat yolu 347].

Barnum yasağı
- "bazen, zaman zaman, kimi zaman, genellikle, çoğu zaman, birçok insan gibi, belki de" ifadelerini kullanma.
- Bir özelliği ve karşıtını aynı cümlede söyleme ("X'sin ama bazen Y'sin").
- Her iddia bir durum ve davranışla somutlaşsın: "Bir karar başkasına bağlı kaldığında …" gibi. Somutlaştıramıyorsan o cümleyi yazma.

İlişki bölümü (zorunlu)
- Başlık: "İlişkide sen". Dört alt başlık: Yakınlık kurma biçimi · Çatışmada tepki · Sınır ihtiyacı · İletişimde tıkanma noktası.
- Her alt başlık kaynakta dayanağı varsa yazılır; yoksa "Bu konuda verin bir şey söylemiyor." yazılır. Tahmin etme.

Dil ve güvenlik
- Türkçe, ikinci tekil şahıs, cinsiyet ve ilişki modeli belirtmeyen dil ("eşin, kocan, karın" yerine "partnerin, yakınların").
- Tıbbi, psikolojik veya hukuki tanı koyma. Kayıp, ihanet, hastalık gibi yaşam olaylarını ima etme.
- 4 bölüm: Özün · İlişkide sen · Gelişim alanın · İlk üç adım. Her cümle noktayla biter.
```

`user_prompt_template`:

```text
Kişinin hesaplanan sayıları: {numbers}
<kaynak ad="Vitrin {showcase}">{showcase_text}</kaynak>
<kaynak ad="Yetenek {abilities}">{abilities_text}</kaynak>
<kaynak ad="Hayat yolu {lifePath}">{life_path_text}</kaynak>
<kaynak ad="İdeal iş {idealJob}">{ideal_job_text}</kaynak>
Yalnızca bu kaynaklarla, sistem kurallarına uyarak yol haritasını yaz.
```

## 5. Kurucunun kararını bekleyen sorular

1. Meslek 33, yetenek 1 ve hayat yolu 213 için Excel'deki doğru metinler nedir?
2. Sesli harfi olmayan adlarda (yetenek 0) ne gösterilsin? Y sesli harf sayılsın mı? Bu bir **hesaplama değişikliği** olur ve ayrıca onay gerekir.
3. Piramit ve sinerji metinleri hangi sayıyla seçiliyor? Kural Excel'de varsa paylaşılmalı. Bu kural olmadan Platinum ilişki katmanı kurulamaz.
4. Rakamları yer değiştirmiş hayat yolu çiftlerindeki (145/415 vb.) ortak paragraflar kasıtlı mı?
5. Katman eşlemesi: Gold = Plus, Platinum = Premium varsayımı doğru mu, yoksa ürün adları değişecek mi?

## 6. Uygulama durumu

Onaydan sonra bu branch'te yapılanlar. Hepsi sunum katmanında; `data/` içindeki rapor metinleri ve `web/lib/calculation-core.ts` aynen duruyor.

| Öneri | Durum | Nerede |
| --- | --- | --- |
| Yer tutucu (`n/a`) veya eksik metin gösterilmesin; "hazırlanıyor" notu ve log | **Uygulandı.** Barış Kaya'da "İdeal iş", Lyn Sky'da "Yetenekler" artık "Bu bölüm hazırlanıyor." gösteriyor; sunucu `reading_section_unavailable idealJob:33` gibi yalnızca bölüm ve sayı loglar, kişisel veri loglamaz. | `web/lib/reading.ts` |
| Her bölümde "Neden bu sonuç" satırı | **Uygulandı.** Ör.: "Adındaki sesli harflerin (A, E, I, O, U) toplamı 12; bu 3 sayısına indirgeniyor." | `web/lib/reading.ts`, `web/app/experience.tsx` |
| Şablon sırası ve katman etiketi (Basic: Vitrin · Plus: Yetenekler, Hayat yolu, İlişkide sen · Premium: İdeal iş) | **Uygulandı** (etiket olarak). Hesap kapalıyken herkes hepsini görür. Katmana göre **kilitleme** sunucu tarafında üyelik kontrolü ister; HANDOFF.md 2. madde, arka uç mühendisinde. | aynı |
| "İlişkide sen" bölümü | **Uygulandı.** Vitrin, yetenek ve hayat yolu metinlerinden ilişkiyle ilgili cümleler (her bölümden en fazla 2) **değiştirilmeden** alıntılanıyor ve kaynağı yazılıyor. Cümle yoksa "Verin bu konuda belirgin bir şey söylemiyor." Seçim anahtar kelimeyle yapılıyor; kusursuz değil. | aynı |
| Yaşa göre meslek başlığı | **Uygulandı.** 25 yaş altı "Yöneldiğin alanlar", 25 ve üstü "Derinleşme alanların". Liste metni aynen. | `web/lib/reading.ts` |
| Hayat yolunda olasılık notu | **Uygulandı.** "Bu metin bir olasılığı anlatır, yaşadıklarına dair bir tespit değildir." | aynı |
| Revize LLM prompt'ları (4-B) | **Uygulandı.** `system_prompt`, `user_prompt_template`, `summary_system_prompt` güncellendi; eski kodun beklediği `{context}`, `{label}`, `{text}` yer tutucuları korundu. Not: bu prompt'u kullanan kod repoda değil (`@holyarted/api-shared`), şu an hiçbir yerde çalışmıyor. | `data/llm_config.json` |
| Testler | **Eklendi.** `n/a` ve eksik metnin hiç gönderilmediği, yaş başlığının metni değiştirmediği, ilişki cümlelerinin kişinin kendi metninde birebir bulunduğu doğrulanıyor. 25 testin hepsi geçiyor. | `web/tests/account.test.mjs` |

**Onaya rağmen yapılmayanlar ve nedeni:**

- **Bozuk veri kayıtlarının düzeltilmesi** (meslek 33, yetenek 1, hayat yolu 213) ve **en yoğun Barnum metinlerinin yeniden yazılması**: Görev kuralı 1'e göre veri değiştirilemez kaynak. Doğru metinler Excel'den gelmeli; ben metin uydurmadım.
- **Y'nin sesli harf sayılması**: Hesaplama değişikliği; görev kuralı hesaplamaya dokunmayı yasaklıyor. Bölüm 5, soru 2.
- **Piramit, sinerji ve iki kişilik rapor**: Seçim kuralı kodda ve veride yok. Bölüm 5, soru 3.
- **Basic portre kartlarının veriye bağlanması**: Kartlar (karar biçimi, ortam vb.) 4 seçenekli elle yazılmış metinler; veriyle eşleştirme kuralı bir ürün kararı. Şimdilik Basic'in veri karşılığı "Vitrin" bölümü ve "Neden bu sonuç" satırı.
