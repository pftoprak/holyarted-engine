# Holyarted yayın hazırlığı — 28 Eylül 2026

Bu belge tamamlandı iddiası değil, kanıt ve eksik listesidir. Hesaplama motoru, sonuç metinleri ve nihai tasarım bu çalışmanın dışındadır. Canlı testlerde yalnızca ayrı test hesabı kullanılmalıdır; ana hesap test verisi değildir. Hiçbir madde yalnızca kodu mevcut diye canlıda doğrulanmış sayılmaz.

## Mimari ve kapsam

- `web/`: canlı web uygulaması; Google kimliği Supabase Auth, portre ve üyelik kayıtları Cloudflare D1.
- `mobile/`: Expo uygulama iskeleti. Paketler ve App.tsx incelemesinde ortak Supabase oturumu / güvenli token saklama entegrasyonu görülmedi.
- `api/`: ayrı eski API ve yönetici uçları. `generate-composite.js` harici `@holyarted/api-shared` LLM koduna başvuruyor; bu bağımlılığın uygulaması ve bu uçların canlıya açık olup olmadığı henüz doğrulanmadı. Bu yüzey güvenli kabul edilmemeli.
- Supabase RLS tek başına D1 verilerini korumaz. Web route'ları kimliği sunucuda doğrular ve D1 sorgularını doğrulanmış kullanıcı ID'siyle sınırlar.

## 1. Gerçek hesap ve veri akışı — kısmen tamamlandı

- [x] Ayrı Google hesabıyla giriş ve hesap seçicisi canlıda doğrulandı.
- [x] Test portresi kaydedildi; çıkış/giriş sonrası aynı portre açıldı.
- [x] Test portresi silindi; profil boş göründü.
- [x] Veri dışa aktarma API'sinin başarılı yanıtı önceki canlı loglarda görüldü; JSON içerik ve kullanıcı izolasyonu yerel testte doğrulandı.
- [ ] İndirilen gerçek dosyanın içerik, UTF-8 ve kullanıcı eşleşmesi. Uygulama içi tarayıcıda iki denemede download olayı zaman aşımına uğradı. Bu, tek başına uygulama hatası veya tarayıcı kısıtı olduğunu kanıtlamaz.
- [ ] İptal edilen / süresi dolan OAuth, bağlantı kesilmesi ve çoklu sekmede oturum testleri.
- [ ] Chrome, Safari, iOS Safari ve Android Chrome üzerinde hesap akışı.

## 2. Tam hesap silme — Basic canlıda doğrulandı

- [x] Sunucuya özel Supabase yönetici anahtarı hosting gizli değişkeni olarak yapılandırıldı.
- [x] Test hesabı uygulama üzerinden silindi; oturum kapandı ve Supabase kullanıcı listesinde kalmadı.
- [x] Yeniden Google girişi boş Basic hesap açtı; eski portre geri dönmedi. Testlerin devamı için bu yeni boş test hesabı şu anda mevcut. Yeniden kayıt olabilmek silmenin başarısız olduğu anlamına gelmez.
- [x] Yerel test: ücretli abonelik önce iptal edilir; yalnızca doğrulanmış kullanıcının verileri silinir; başka kullanıcı korunur.
- [x] Yerel test: Stripe iptal hatasında ve eksik abonelik kimliğinde veri silinmez. Eksik kimlik koruması bu incelemede eklendi.
- [x] Yerel test: Supabase silme hatası başarı sayılmaz; tekrar deneme tamamlayabilir.
- [ ] D1 + Stripe + Supabase işlemleri atomik değil. Yarım kalan silmeler için kalıcı iş durumu, yeniden deneme ve operasyonel uzlaştırma tasarlanmalı.
- [ ] Canlı D1 üyelik satırının yokluğu doğrudan doğrulanmalı; UI ve Supabase doğrulaması bunun yerine geçmez.
- [ ] Stripe test ortamında gerçek abonelik iptali ve webhook yarışları doğrulanmalı.
- [ ] Yedeklerde kalan silinmiş kayıtların saklama / geri yükleme sonrası yeniden silme politikası uygulanmalı.

## 3. Güvenlik — temel kontroller var, yayın onayı yok

- [x] Web API'sinde token sunucuda Supabase ile doğrulanıyor; istemcinin userId alanına güvenilmiyor.
- [x] İki kullanıcıyla gerçek SQL ve route kodu üzerinde yerel kayıt/okuma/export/silme izolasyonu testleri var.
- [x] Küçük JSON gövdesi, geçersiz veri, no-store ve nosniff kontrolleri var.
- [x] Web hata yanıtları ve logları kişisel veri yerine sabit hata kodları kullanıyor; yerel hata testleri var.
- [x] Uygulama içinde istek sınırı var; export limiti kullanıcı izolasyonu testi geçti.
- [ ] Canlıda iki ayrı geçici test kimliğiyle yetki aşımı ve çapraz hesap erişimi testleri.
- [ ] Bellekteki rate limit çoklu worker / yeniden başlatma karşısında ortak koruma sağlamaz; süresi dolan anahtarların temizliği ve bellek üst sınırı da eksik. Edge veya ortak depolama tabanlı koruma kurulmalı.
- [ ] HTML yanıtlarında CSP, frame koruması, referrer/permissions politikaları ve TLS/HSTS dağıtımı ölçülmeli; OAuth ile uyumluluk test edilmeli.
- [ ] XSS, CSRF/CORS, open redirect, oturum/token saklama ve log/veri sızıntısı incelemesi tamamlanmalı.
- [ ] Bağımlılık ve gizli anahtar taraması; eski admin/LLM API yüzeyi ve deployment envanteri; GitHub erişimleri, branch protection, CI ve deployment yetkileri denetlenmeli.
- [ ] Yönetici MFA / en az yetki / anahtar rotasyonu; test ve üretim ortamı ayrımı doğrulanmalı.
- [ ] Bağımsız sızma testi ve kritik/yüksek bulguların kapanışı.

### Agent ve prompt injection kapsamı

Web portre akışı şu anda hesaplanan sinyalleri hazır metinlere eşliyor. Eski API'deki LLM yolu nedeniyle tüm depo için “AI yok” veya “agent-hack-free” iddiası yapılamaz. Üretime alınan her AI yolu için:

- Kullanıcı girdisi, dosya, web içeriği ve model çıktısı güvenilmeyen veri olmalı; talimat/yetki kaynağı olmamalı.
- Model hiçbir zaman kullanıcı kimliği, üyelik veya erişim kararını belirlememeli; sunucu belirlemeli.
- Araçlar izin listeli ve en az yetkili olmalı; keyfi shell/SQL/URL erişimi verilmemeli. Ağ çıkışı, maliyet, süre ve gövde sınırları uygulanmalı.
- Secret/token istemlere ve loglara gönderilmemeli; kullanıcılar arası bellek/arama izolasyonu test edilmeli.
- Veri silme, ödeme ve erişim değişikliği gibi işlemler model çıktısından doğrudan yürütülmemeli.
- Doğrudan/dolaylı prompt injection, veri sızdırma, tool abuse ve model çıktısının HTML olarak çalıştırılması için adversarial testler yapılmalı.

Referanslar: [OWASP ASVS](https://owasp.org/projects/asvs), [MASVS kontrol rehberi](https://cheatsheetseries.owasp.org/IndexMASVS.html), [Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html). Bunlar hedef çerçevelerdir; uyumluluk sertifikası değildir.

## 4. Yedekleme ve operasyon — sağlık endpoint'i hazır

- [x] `/api/health` yalnızca kullanılabilirlik durumu döndürüyor; önceki canlı kontrolde 200, yerel veritabanı hata testinde 503.
- [ ] D1 ve Supabase için gerçek planın yedekleme olanakları, erişim ve saklama süreleri doğrulanmalı.
- [ ] Hedef veri kaybı ve toparlanma süresi belirlenmeli; izole ortamda geri yükleme tatbikatı yapılmalı.
- [ ] Kişisel veri içermeyen hata/performans izleme, uptime alarmı ve sorumlu kişi belirlenmeli.
- [ ] Geri alma, migration, kesinti ve anahtar sızıntısı müdahale planı; silinen verinin geri yüklemeyle dönmemesi kontrolü.

## 5. Ödeme — kod iskeleti var, gerçek ödeme açılmamalı

- [x] Basic/Plus/Premium üyelik modeli, checkout, portal ve webhook route'ları mevcut; iptal edilmiş üyeliğin Basic'e düşmesi yerel testte var.
- [ ] Her ücretli özelliğin sunucu yetkilendirmesi ve plan matrisi doğrulanmalı.
- [ ] Stripe test anahtarları/fiyatları/webhook kurulumu ve başarılı/iptal/başarısız/3DS senaryoları.
- [ ] Webhook tekrarları, sırasız olaylar, gecikmeli ödeme, iade, ödeme itirazı ve hesap silme yarışı. Mevcut webhook'ta kalıcı event-id tekilleştirmesi görülmedi.
- [ ] Abonelik iptali, plan değişimi, dönem sonu, portal ve faturalar.
- [ ] Nihai fiyat/şirket/vergi ve mobil mağaza ödeme gereklilikleri kesinleştirilmeli. Mevcut web fiyatları nihai karar kanıtı değildir.

## 6. Mobil — tamamlanmadı

- [ ] Web ile ortak Google/Supabase kullanıcı kimliği, güvenli oturum saklama, token yenileme ve çıkış.
- [ ] Aynı API üzerinden portre/üyelik/export/silme; üretim anahtarlarının mobil pakete girmemesi.
- [ ] Universal/App Links, OAuth deep-link doğrulama ve link ele geçirme testleri.
- [ ] iOS/Android gerçek cihazlar; ağ kesilmesi, yeniden açılış, arka plan ve güncelleme.
- [ ] Erişilebilirlik, büyük yazı, ekran okuyucu, klavye, düşük bellek ve performans.
- [ ] İmzalama, uygulama kimlikleri, TestFlight/Play iç test, mağaza incelemesi ve sürüm geri alma planı.

## 7. E-posta ve destek — doğrulanmadı

- [ ] info@, hello@, support@ yönlendirmeleri için izinli test mesajları ve teslim kontrolü.
- [ ] Domain gönderimi, SPF/DKIM/DMARC ve bounce/şikâyet yönetimi.
- [ ] Destek kuyruğu, cevap süresi, güvenli kimlik doğrulaması, silme talepleri ve olay iletişimi.

## 8. Yasal ve mağaza — iskelet mevcut, final değil

- [x] Gizlilik ve koşullar sayfaları önceki tarayıcı kontrolünde açıldı.
- [ ] Gerçek veri envanteri, saklama/silme süreleri ve sağlayıcılarla uyumlu final metinler.
- [ ] Kullanılan çerez/SDK envanterine göre izin altyapısı; analitik başlamadan tercihlerin uygulanması.
- [ ] Mağaza gizlilik/veri güvenliği beyanları, hesap silme bağlantısı, yaş/içerik sınıflandırması ve geliştirici hesapları.
- [ ] Şirket ve hedef ülkeler kesinleşince yetkin hukuk incelemesi.

## 9. Premium ürün kalitesi ve yayın kapısı

- [ ] Otomatik CI: test, TypeScript, build, bağımlılık ve secret taraması; prod/test ayrımı.
- [ ] Ana yolculuklarda yüklenme/boş/hata/yeniden deneme durumları ve TR/EN tutarlılığı.
- [ ] Mobil/masaüstü responsive QA, erişilebilirlik ve gerçek cihaz performans ölçümü.
- [ ] Veri kaybı olmadan migration/rollback, yük ve maliyet sınırları.
- [ ] Alan adı/OAuth marka adı, ikonlar, metadata, paylaşım önizlemesi ve destek bilgilerinin tutarlılığı.
- [ ] Nihai hesaplama/içerik/tasarım onayı ayrı yapılmalı; kullanıcıya gösterilen tüm ücretli vaatler uygulanmış ve test edilmiş olmalı.

## Sıradaki uygulama sırası

1. Gerçek export dosyasını desteklenen tarayıcıda alıp incele; indirme problemini yeniden üret ve çöz.
2. İki ayrı test kimliğiyle canlı D1 izolasyonu ve silme doğrulamasını tamamla.
3. Silme hatalarına dayanıklılık, dağıtık rate limit ve webhook güvenliği açıklarını kapat; CI/güvenlik taramalarını kur.
4. Yedek/geri yükleme ve operasyon kontrollerini uygula.
5. Stripe test ödeme ve sunucu yetkilendirme matrisini tamamla.
6. Mobil ortak hesap altyapısı ve cihaz testleri.
7. E-posta, destek, gizlilik ve mağaza hazırlığı.
8. Bağımsız güvenlik testi ve bütün yayın kapılarının kanıtla kapanışı.

## Bu incelemenin otomatik doğrulaması

21 yerel otomatik test ve TypeScript kontrolü geçti. Testler Supabase/Stripe ağ sınırlarında yerel karşılıklar kullanır; gerçek ödeme sağlayıcısı testinin yerini tutmaz. Canlı test hesabının yeni boş kaydı, kalan export testleri için korunmuştur.
