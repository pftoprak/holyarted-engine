# Holyarted yayın hazırlığı — 28 Eylül 2026

Bu belge tamamlandı iddiası değil, kanıt ve eksik listesidir. Hesaplama motoru, sonuç metinleri ve nihai tasarım bu çalışmanın dışındadır. Canlı testlerde yalnızca ayrı test hesabı kullanılmalıdır; ana hesap test verisi değildir. Hiçbir madde yalnızca kodu mevcut diye canlıda doğrulanmış sayılmaz.

## Öncelik düzeltmesi ve son kanıtlar

### İşletme ve veri kararları — sağlayıcı kodundan önce

- [ ] Şirket ülkesi/türü ve hedef pazarlar kullanıcı tarafından netleştirilmeli. Türkiye şirketi varsayılmamalı. [Stripe ülke listesinde](https://stripe.com/global) Türkiye yer almıyor; sağlayıcı seçilmeden Stripe'a özgü kapsam büyütülmemeli.
- [ ] Web ödeme sağlayıcısı için şirket uygunluğu, abonelik, iptal/iade, para birimi ve faturalama desteği değerlendirilip karar kaydedilmeli.
- [ ] Mobilde dijital içerik için StoreKit / Google Play Billing ve sunucuda satın alma doğrulama, geri yükleme, iade ve ortak erişim hakkı modeli planlanmalı. Bölge/program istisnaları güncel [Apple](https://developer.apple.com/app-store/review/guidelines/) ve [Google](https://support.google.com/googleplay/android-developer/answer/9858738) kurallarına göre ayrıca değerlendirilmeli.
- [ ] Gerçek dış kullanıcı varlığı henüz belirlenmedi. Önceki kontrollerde ana hesap ve test hesabı görülmesi, tüm kullanıcı/anonim kullanım envanteri değildir. Gerçek kullanıcı varsa yedek/geri dönüş doğrulaması riskli veri değişikliklerinden önce gelir; staging dışında yıkıcı test yapılmaz.
- [ ] iOS Google girişine eşdeğer Sign in with Apple akışı (4.8 kapsam/istisna kontrolüyle), hesap bağlama ve silmede token iptali.
- [ ] Türkiye kapsamında KVKK aydınlatma metni ve yurt dışı aktarım mekanizması; veri sorumlusu/işleyen ve alt işleyen envanteri.
- [ ] Mesafeli satış sözleşmesi ve ön bilgilendirme formu; dijital içerik/cayma ve abonelik iptal süreci için hukuk incelemesi.
- [ ] E-arşiv/e-fatura yükümlülüğü ve muhasebe entegrasyonu için şirket/işlem modeline göre mali müşavir incelemesi. Bu maddeler otomatik hukuki uygunluk iddiası değildir.
- [ ] LLM için kimlik/üyelik kontrolü yanında kullanıcı ve proje bazlı harcama kotası, atomik bütçe rezervasyonu, token/model sınırı, eşzamanlılık/timeout, alarm ve otomatik durdurma. Yalnızca alarm veya IP rate limit maliyet üst sınırı değildir.

Veri sahipliği: mevcut uygulamada Supabase Auth kimliğin; D1 portre ve uygulama üyelik kaydının; ödeme sağlayıcısı gerçek faturalama durumunun kaynağıdır. D1 üyelik satırı faturalamanın yerel yansımasıdır. İki veri deposu zorunlu değildir: portre/üyelik verisi Supabase Postgres'e taşınabilir. Ancak bu, migration, RLS, atomiklik, maliyet ve geri dönüş planıyla değerlendirilmelidir; ödeme sağlayıcısıyla dağıtık işlem sorunu tek veritabanına geçince bitmez. Mevcut ikili yapıyı seçen özgün karar kaydı bulunmadığı için neden seçildiği hakkında gerekçe uydurulmamalı.

Son API kontrolü: dört eski yol (`/api/admin/login`, `/api/admin/content`, `/api/admin/llm-config`, `/api/generate-composite`) hem `holyarted.com` hem `holyarted-engine.pftoprak.chatgpt.site` üzerinde kimliksiz, boş JSON POST isteğine 404 döndü. Sites özel domain envanterinde yalnızca `holyarted.com` var. Depoda yapılan metin aramasında eski pages.dev/workers.dev/vercel.app/netlify.app adresi bulunmadı. Diğer hesapların hosting envanteri ve bütün HTTP yöntemleri kontrol edilmiş sayılmaz. Bu kontrol hassas veri veya gerçek LLM iş yükü göndermedi.

Paylaşılacak ekran görüntüleri ve hata kayıtlarında e-posta, kullanıcı ID'si ve tokenlar maskelenmeli. Bu tur ekran görüntüsü dışarı gönderilmedi.

**Ücretli yayın onayı verilmemiştir.** Önceki listenin numarası risk önceliğini temsil etmez; aşağıdaki uygulama sırası esas alınır.

- **Kritik ürün engeli — doğrulandı:** `web/app/experience.tsx` portreyi istemcide hesaplar; Basic sonuçları `slice(0, 2)` ile gizlenir. Premium metinleri de istemci kodundadır. `GET /api/portrait` üyelik kontrolü olmadan tüm kayıtlı sonuç alanlarını döndürür. Ücretli içeriğin sunucu tarafında üretilmesi/sunulması ve Basic yanıtından çıkarılması gerekir; yalnızca route filtresi yeterli değildir, istemci paketi de düzeltilmelidir. Kullanıcının kendi verisini dışa aktarma hakkı, ücretli içerik erişiminden ayrı tasarlanmalıdır.
- **Ödeme yapılandırması — kontrol edildi:** Sites üretim ortamı revision 2 yalnızca üç Supabase değişkeni içeriyor; Stripe secret/webhook/price değişkenleri tanımlı değil. Mevcut checkout kodu bunlar olmadan Stripe oturumu açamaz. Bu tespit başka platformlarda veya geçmişte hiç ödeme alınmadığı anlamına gelmez.
- **Dağıtım — doğrulandı:** sürüm 19 başarılı; görünür export bağlantısı ve eksik abonelik kimliğinde silmeyi durduran geçici koruma canlıda.
- **Bilinen eski yollar — sınırlı canlı kontrol:** 28 Eylül 2026 tarihinde `holyarted.com` üzerinde oturumsuz GET ile `/api/admin/content`, `/api/admin/login`, `/api/admin/llm-config`, `/api/generate-composite` 404; `/api/health` 200. Eski yollar web derleme route listesinde de yok. Diğer alan adları, dağıtımlar ve HTTP yöntemleri bu kontrolde doğrulanmadı. "Tüm eski API'ler kapalı" sonucu çıkarılamaz.
- **Silme — tamamlanmadı:** eksik abonelik kimliğinde hata vermek yalnızca geçici korumadır. Müşteri/abonelik sahipliği doğrulanarak Stripe ile uzlaştırma, kalıcı silme işi, yeniden deneme ve kullanıcıya süreç bilgisi gerekir. Webhook kodu boş subscription ID ile active üyelik yazılmasına izin veriyor; bunu canlıda yaşanmış olay olarak değil, doğrulanmış kod kusuru olarak sınıflandırıyoruz.
- **Staging — açık:** ayrı Supabase/D1 ve Stripe test kaynaklarıyla bir staging ortamı henüz doğrulanmış değil. Hata enjeksiyonu ve yıkıcı güvenlik testleri üretimde yapılmamalı.

## Her değişiklikte ikinci inceleme

Bu, aynı ajanın uygulamadan ayrı yürüttüğü eleştirel incelemedir; bağımsız insan denetimi veya sızma testi değildir.

1. Değişiklikten önce kabul koşulu, etkilenen veri ve başarısızlık senaryosu yazılır.
2. Uygulamadan sonra diff yeniden okunur: yetki atlama, veri sızıntısı, tekrar/sıra dışı istek, yarım işlem ve geri alma incelenir.
3. Test adı/sayısı yerine hangi davranışın kanıtlandığı ve neyin taklit edildiği kaydedilir.
4. Kaynak commit, yayın sürümü ve canlı doğrulama ayrı durumlar olarak bildirilir. Yayın başarısı uçtan uca işlev kanıtı değildir.
5. Açık yüksek risk varken "hazır", "güvenli", "hack-free" veya "tamamlandı" denmez. Başarısız test çözülmeden ya da sınırı açıkça belirtilmeden kapatılmaz.
6. Aynı araç kısıtında tekrarlayan denemeler bırakılır; engellenmiş işlemin etrafından dolaşılmaz. Etkilenmeyen iş sürdürülür.
7. Her değişiklik turu sonunda commit ve GitHub branch güncellemesi doğrulanır. Push engellenirse açıkça belirtilir; yalnız yerel commit uzakta yedeklenmiş sayılmaz.

Son ikinci inceleme: ödeme ayarlarının yokluğu gelir alınmadığının evrensel kanıtı değil; 404 sonuçları GET ve bu alan adıyla sınırlı; Basic silme kanıtı ücretli silme kanıtı değil; export dosya doğrulaması hâlâ açık. Bu tur ürün kodu veya üretim verisi değiştirilmedi.

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
- [x] Sürüm 19'da dosya hazırlığı sonrası görünür JSON indirme bağlantısı yayınlandı. Otomatik tıklama için bağlantı DOM'a ekleniyor; dosya URL'si sabit bir saniye sonra değil, değiştirilince veya bileşen kapanınca temizleniyor. Canlı test hesabında bağlantı oluştu.
- [ ] Sürüm 19'da doğrudan link tıklaması da uygulama içi tarayıcıda download olayı üretmedi. İçeriği açma denemesi tarayıcı URL politikası tarafından `blob:` adresi nedeniyle reddedildi; bu yöntemle doğrulama durduruldu. Kullanıcının gerçek tarayıcı indirmesiyle kontrol gerekli.
- [ ] İptal edilen / süresi dolan OAuth, bağlantı kesilmesi ve çoklu sekmede oturum testleri.
- [ ] Chrome, Safari, iOS Safari ve Android Chrome üzerinde hesap akışı.

## 2. Tam hesap silme — Basic canlıda doğrulandı

- [x] Sunucuya özel Supabase yönetici anahtarı hosting gizli değişkeni olarak yapılandırıldı.
- [x] Test hesabı uygulama üzerinden silindi; oturum kapandı ve Supabase kullanıcı listesinde kalmadı.
- [x] Yeniden Google girişi boş Basic hesap açtı; eski portre geri dönmedi. Testlerin devamı için bu yeni boş test hesabı şu anda mevcut. Yeniden kayıt olabilmek silmenin başarısız olduğu anlamına gelmez.
- [x] Yerel test: ücretli abonelik önce iptal edilir; yalnızca doğrulanmış kullanıcının verileri silinir; başka kullanıcı korunur.
- [x] Yerel test: Stripe iptal hatasında ve eksik abonelik kimliğinde veri silinmez. Eksik kimlik koruması bu incelemede eklendi.
- [x] Eksik abonelik kimliği koruması sürüm 19 ile canlıya dağıtıldı; gerçek Stripe senaryosu hâlâ aşağıdaki açık maddedir.
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

1. Kullanıcı/veri ve dağıtım envanterini tamamla; gerçek kullanıcı varsa yedek/geri dönüşü öne al. Bilinen GET ve POST yolları kontrol edildi; eski hosting hesapları ve diğer yöntemler açık. Şirket ülkesi/türü ve web/mobil ödeme sağlayıcısı kararını sağlayıcıya özgü geliştirmeden önce ver. Gerekli olmayan, erişilebilir uçları kapat; ücretli yayına izin verme.
2. Ayrı staging ortamı kur. Ücretli sonuçları istemci paketinden çıkar, sunucuda plan bazlı erişim uygula. Kabul: Basic istemcinin bundle, HTML ve API yanıtından ücretli sonucu alamaması; Plus/Premium için izin matrisi testleri.
3. Webhook'ta eksik kayıt, olay tekrarı/sırası ve ödeme durumunu düzelt. Stripe müşteri eşleşmesini doğrula; yarım kalan silmelerin kalıcı iş kaydı ve yeniden denemesini uygula. Kabul: servis kesintisinden sonra işlem tamamlanır, başka müşteri etkilenmez, silinen kayıt gecikmiş webhook ile geri gelmez.
4. Staging'de iki ayrı kullanıcıyla izolasyon ve gerçek Stripe test senaryoları; CI, bağımlılık/secret taraması, dağıtık rate limit ve eski API/LLM güvenliği.
5. D1/Supabase yedeklerini doğrula; geri yükleme tatbikatı, alarmlar ve müdahale planını tamamla.
6. Mobil ortak hesap, güvenli oturum, deep-link ve cihaz testleri.
7. E-posta, destek, gizlilik ve mağaza hazırlığı; erişilebilirlik, performans ve ürün kalite testleri.
8. Bağımsız güvenlik testi ve yayın kapılarının kanıtla kapanışı.

Export dosyasının manuel indirme/içerik kontrolü açık kalır; güvenlik işlerinin önünü kesen tekrar döngüsüne dönüştürülmez.

## Bu incelemenin otomatik doğrulaması

21 yerel otomatik test ve TypeScript kontrolü geçti. Testler Supabase/Stripe ağ sınırlarında yerel karşılıklar kullanır; gerçek ödeme sağlayıcısı testinin yerini tutmaz. Canlı test hesabının yeni boş kaydı, kalan export testleri için korunmuştur.

Test dağılımı: 4 hesaplama/girdi testi, 5 yanıt/gövde sınırı/rate limit testi, 12 hesap/API testi. Hesap testleri kimlik, izolasyon, export, üyelik, servis hatası, silme ve export limiti davranışlarını kapsar. Gerçek OAuth, Stripe, mobil cihaz, tarayıcı indirmesi, performans ve bağımsız güvenlik testi bu 21 testin kapsamına girmez. Derlemenin geçmesi yalnızca teknik asgari koşuldur.
