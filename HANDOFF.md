# Devir notu

Ürün **premium** olarak ilerliyor (kurucu kararı, 3 Kasım 2026). Hesaplar varsayılan olarak açık. Girişsiz mod yalnızca yerel geliştirme içindir. Genel eksik listesi için [RELEASE-READINESS.md](RELEASE-READINESS.md).

## Çalıştırma

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Anahtar olmadan da açılır. Ziyaretçi Basic görür: 2 portre kartı ve detaylı okumada yalnızca Vitrin. Her şeyi giriş yapmadan yerelde görmek için `web/.env.local` dosyasına `HOLYARTED_ACCOUNTS_ENABLED=false` yaz (bu dosya git'e girmez).

## Ayar: `HOLYARTED_ACCOUNTS_ENABLED`

| Değer | Davranış |
| --- | --- |
| tanımsız / `true` / `false` dışında her şey (varsayılan) | Hesaplar açık. Giriş, üyelik ve Stripe çalışır; `.env.example` içindeki diğer değişkenler gerekir. Bunlar yoksa `/api/health` 503 döner. |
| tam olarak `false` | **Yalnızca yerel.** Giriş/üyelik gizli, tüm bölümler herkese açık. Hesap/ödeme route'ları Supabase, D1 veya Stripe'a dokunmadan 404 döner. Yayındaki bir ortamda asla kullanılmamalı. |

Ayarın okunduğu yer: [web/lib/features.ts](web/lib/features.ts).

## Plan erişimi (`feature/premium-gating`)

Ücretli metinler yalnızca sunucuda bulunur ve plana göre süzülerek gönderilir. Tarayıcıya giden pakette yoktur; `dist/client` içinde arandı, bulunmadı.

| İçerik | Basic | Plus | Premium |
| --- | --- | --- | --- |
| Portre kartları (karar, ortam) | ✓ | ✓ | ✓ |
| Portre kartları (dikkat, amaç) | | ✓ | ✓ |
| İlişki ve iş bakışı | | | ✓ |
| Detaylı okuma: Vitrin | ✓ | ✓ | ✓ |
| Detaylı okuma: Yetenekler, Hayat yolu, "İlişkide sen" | | ✓ | ✓ |
| Detaylı okuma: İdeal iş | | | ✓ |

- Plan sunucuda belirlenir: [web/lib/plan-access.ts](web/lib/plan-access.ts). Oturum yoksa ya da geçersizse Basic. Oturum veya üyelik kontrolü hata verirse istek 503 ile reddedilir; plan tahmin edilmez.
- Kart metinleri: [web/lib/portrait-chapters.ts](web/lib/portrait-chapters.ts). Metinler `experience.tsx` içinden kelimesi kelimesine taşındı.
- `POST /api/reading` artık `{ plan, chapters: { en, tr }, reading }` döner. Kilitli bölümlerde başlık ve "Neden bu sonuç" satırı kalır, metin gönderilmez.
- Ana sayfadaki önizleme sabit bir örnek portre kullanır ve yalnızca Basic kartları gösterir.
- Testler: 27 test geçiyor. Yeni testler her plan için sunucunun hangi metni gönderdiğini, Basic yanıtında hiçbir ücretli metin olmadığını, bayrak tanımsızken içeriğin kapalı kaldığını ve kontrol hata verirse isteğin reddedildiğini doğrular.
- Hâlâ açık: `GET /api/portrait`, kayıtlı portrenin profil anahtarlarını döndürür. Bunlar metin değil, kategori adıdır (örneğin `facts`, `quiet`). Kişinin kendi verisi olarak kalabilir.

## Sistem hazırlığı (`feature/system-prep`)

- **Ödeme sağlayıcıdan bağımsız.** Rotalar, hesap silme ve üyelik kuralları (olay sırası, tekilleştirme, planın fiyattan belirlenmesi) artık `web/lib/billing/` altındaki `BillingProvider` arayüzünü kullanıyor. Yeni bir sağlayıcı (iyzico, Paddle…) tek dosya: arayüzü uygular, `web/lib/billing/index.ts` içinde seçilir. Stripe davranışı değişmedi; bir test kuralları Stripe olmayan bir sağlayıcıyla çalıştırıyor.
- **Yalnız ücretsiz yayın mümkün.** Supabase ayarları yoksa giriş, kaydetme ve `/profile` görünmez (`/profile` 404). Ödeme sağlayıcısının tüm anahtarları yoksa üyelik bölümü gizlenir, kilit panelinde "Üyelikler yakında açılıyor" yazar. Ayrı bir bayrak yok: anahtarlar tanımlanınca kendiliğinden açılır.
- **Hata bildirimi.** `web/lib/report-error.ts`: `ERROR_REPORT_URL` (Slack/Discord webhook) tanımlıysa sunucu hataları oraya gider. Yalnızca olay adı gönderilir, kişisel veri yok; aynı olay 5 dakikada bir kez.
- **Mobil motor koruması.** `mobile/lib/` hesaplama motorunun kopyasını tutuyor. `web/lib/engine-sync.test.mjs`, iki kopya 1900'den bugüne her hafta ve çeşitli isimler için farklı sonuç verirse başarısız olur. Ortak pakete taşıma mobil derlemesi denenmeden yapılmadı.
- **Kod düzeni.** `experience.tsx` 309 → 201 satır; arayüz metinleri `experience-copy.ts`, detaylı okuma `detailed-reading.tsx` içinde.
- **Lint sıfır ve CI'da engelleyici.** Kullanılmayan 58 hazır bileşen ve `hooks/use-mobile.ts` silindi (yalnız `alert-dialog` ve `button` kullanılıyordu). İki kural kapalı, gerekçesiyle: `autocomplete-valid` geçerli `given-name`/`family-name` değerlerini reddediyor; `no-html-link-for-pages` `next/link` öneriyor ama bu vinext sürümünde `Link` tıklanınca hata veriyor (denendi), sayfa geçişleri düz bağlantıyla yapılıyor.
- **`api/` klasörü bilerek bırakıldı.** Repoda olmayan `@holyarted/api-shared` paketine bağlı, bu haliyle çalışmıyor. Ama eski bir Vercel dağıtımında yayında olabilir (yönetici girişi ve LLM uçları var) ve piramit/sinerji hesaplarının girişleri burada. Önce o dağıtımın var olup olmadığı kontrol edilmeli; sonra silinir veya arşivlenir.
- **Elle plan verme (ödemesiz).** `membership_grants` tablosu (migration `0003`) e-postaya Plus veya Premium tanımlar; isteğe bağlı süreyle. Kişi ilk kez giriş yapmadan da verilebilir; e-posta büyük/küçük harf fark etmez. Ödenen plan daha yüksekse o geçerli; hediye planı asla düşürmez. Hesap silinince hediye de silinir. Yönetim: `ADMIN_TOKEN` (en az 32 karakter) tanımlanınca açılan `/api/admin/grants` ve komut satırı aracı:
  ```sh
  ADMIN_TOKEN=... node web/scripts/grant.mjs https://holyarted.com give pinar@ornek.com premium 30 "Pınar test"
  ADMIN_TOKEN=... node web/scripts/grant.mjs https://holyarted.com list
  ADMIN_TOKEN=... node web/scripts/grant.mjs https://holyarted.com remove pinar@ornek.com
  ```
  Kişinin giriş yapabilmesi için Supabase/Google girişi kurulu olmalı.
- Satın alma kapalıyken kilitli bölümler "Yakında açılacak" der; plan adları ödeme açılınca görünür.
- **Sıkı CSP.** Betikler her yanıtta yeni üretilen nonce ile çalışıyor (`'strict-dynamic'`), `'unsafe-inline'` kalktı. Derlenmiş sürümde ve geliştirme modunda tüm sayfalarda ihlal olmadan denendi.
- **Kullanılmayan paketler kaldırıldı:** cmdk, date-fns, embla-carousel-react, input-otp, react-day-picker, react-resizable-panels, recharts.
- **Canlı site (4 Kasım, yalnız okuma).** `holyarted.com` Ekim öncesinden kalma eski sürümü çalıştırıyor; o sürümde Plus ve Premium kart metinleri tarayıcı kodunda açıkta. Bu branch yayınlanınca kapanır. `www.holyarted.com` DNS kaydı ve DMARC kaydı yok.
- **Mobil.** `mobile/` sunucuya bağlı değil. 4 kartın kısa sürümlerini ücretsiz gösteriyor; veri dosyalarını içe aktarmıyor. Mağazaya çıkmadan önce web API'sine (`/api/reading`) bağlanmalı; mobil derlemesi burada denenemediği için dokunulmadı.
- Testler: 40.

## `feature/no-login-local` ile yapılanlar

- **Bayrak:** `web/lib/features.ts` (`accountsEnabled`, `accountsDisabledResponse`). Hesap/ödeme route'larının her biri ilk satırda bu kontrolü yapar.
- **Arayüz:** `web/app/experience.tsx` bayrak kapalıyken tüm bölümleri açar, giriş/üyelik öğelerini gizler, menüdeki "Üyelik" bağlantısı "Detaylı okuma"ya döner.
- **Detaylı okuma (yeni):** `data/` içindeki asıl numeroloji metinleri (vitrin, yetenekler, ideal iş, yaşam yolu) artık ekranda gösteriliyor. Daha önce hiç kullanılmıyordu.
  - Sunucu: `web/lib/reading.ts` + `POST /api/reading` (`web/app/api/reading/route.ts`). Metinler istemci paketine girmez; derlenmiş `dist/client` içinde bulunmadığı kontrol edildi.
  - Girdi saklanmaz ve loglanmaz; istemci başına dakikada 30 istek sınırı var.
  - `data/life_path.json`, `web/data/` altına kopyalandı (diğer üç veri dosyası zaten oradaydı).
  - Metinler yalnızca Türkçe. İngilizce arayüzde bunu belirten bir not çıkar.
- **Testler:** 24 test geçiyor. Yeni testler: bayrak kapalıyken tüm hesap/ödeme route'larının 404 döndüğü ve hiçbir ağ/veritabanı çağrısı yapmadığı; okuma API'sinin doğru metni döndürdüğü, geçersiz girdiyi reddettiği ve hiçbir şey saklamadığı; 1900'den bugüne her doğum tarihi için okuma metni bulunduğu.
- **Kontroller:** `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` geçiyor. `pnpm lint` bu branch'ten önce de 48 hatayla başarısızdı; sayı değişmedi, yeni dosyalar temiz.

## Bilerek dokunulmayanlar

- "Human Design" ifadesi (ürün sahibinin kararı). ABD'de Jovian Archive Media Pte. Ltd. adına "JOVIAN ARCHIVE HUMAN DESIGN" (tescil no. 7892431, 2025) ve "MYBODYGRAPH HUMAN DESIGN" tescilli; başka bir şirketin "HUMAN DESIGN" kaydı da var (4579387). Türkiye ve hedef ülkelerde marka araştırması bir avukata yaptırılmalı. Ayrıca yapılan iş numerolojidir; bu adın kullanımı yanıltıcı bulunabilir.
- Mobil uygulama (`mobile/`), `api/` klasörü, piramit ve sinerji verileri. Sinerji/piramit için hesaplama kuralı kodda yok; tahminle bağlanmadı.
- Soru formu (`questions` kopyası) kodda tanımlı ama ekranda yok; sonuç yalnızca isim ve tarihten hesaplanır.

## Sıradaki işler (arka uç, öncelik sırasıyla)

1. **Ödeme sağlayıcısı kararı.** Stripe Türkiye'de yok. Şirketin kurulu olduğu ülkeye göre Stripe / iyzico / Paddle / Lemon Squeezy seçilmeli. Kalan ödeme işleri buna bağlı.
2. ~~**Ücretli içeriği sunucuya taşı.**~~ `feature/premium-gating` ile yapıldı (yukarıdaki "Plan erişimi"). Kalan: plan matrisinin kurucu tarafından onaylanması ve canlıda iki ayrı test hesabıyla doğrulama.
3. ~~**Webhook düzeltmeleri.**~~ `feature/release-hardening` ile yapıldı: plan faturalanan fiyattan belirlenir, eski olay yeni durumu ezmez, aynı olay iki kez uygulanmaz, aboneliksiz checkout aktif yazmaz.
4. ~~**Stripe API sürümü ve idempotency.**~~ Yapıldı: `Stripe-Version: 2024-06-20` sabit; webhook her iki `current_period_end` konumunu okur; checkout isteğine idempotency anahtarı eklendi.
5. ~~**Hesap silmeyi kalıcı bir işe çevir.**~~ Yapıldı: ilerleme `account_deletions` tablosunda; tekrar denemede Stripe iptali tekrarlanmaz; Stripe'ta zaten silinmiş abonelik engel olmaz. Bekleyen silmeler için: [docs/OPERATIONS.md](docs/OPERATIONS.md) madde 5.
6. ~~**İstek sınırını paylaşılan bir depoya taşı.**~~ Yapıldı: sayaçlar D1 `rate_limits` tablosunda, anahtar SHA-256 özeti (ham IP saklanmaz). D1 hata verirse bellekteki sınıra düşer. Okuma API'sinde sınır oturum kontrolünden önce uygulanır.
7. ~~**Güvenlik başlıkları ve CI.**~~ Yapıldı: `web/middleware.ts` (CSP, HSTS, frame koruması vb.) ve `docs/github-ci.yml` → `.github/workflows/ci.yml` olarak eklenmeli (test, tsc, build, istemci paketinde ücretli metin kontrolü; lint raporlanır ama henüz engellemez).
8. **Temizlik.** Kısmen yapıldı (`feature/system-prep`): lint, kullanılmayan bileşenler, `experience.tsx`, motor kopyası koruması. Kalan: `api/` klasörü (önce eski dağıtım kontrolü), kullanılmayan npm bağımlılıkları (carousel, takvim, OTP vb.).
9. **Dağıtım öncesi:** `web/drizzle/0002_*.sql` migration'ı kod yayınlanmadan önce uygulanmalı. Kontrol listesi: [docs/OPERATIONS.md](docs/OPERATIONS.md) madde 6.
10. **Yasal:** `/kvkk` sayfası taslak. Veri sorumlusu: Furkan Öksüz (şahıs işletmesi). Kalan köşeli parantezli alanlar (adres, vergi no, KEP, yurt dışı aktarım mekanizması, fatura saklama süresi) doldurulmalı ve metni avukat incelemeli.
11. **Veri hataları:** Kurucu kararı (3 Kasım 2026): veri olduğu gibi kalıyor. İdeal iş 33 ve yetenek 0 için ekranda "Bu bölüm hazırlanıyor." görünmeye devam eder; yetenek 1 (vitrin 33 ile aynı metin) ve hayat yolu 123/213 (aynı metin) olduğu gibi gösterilir. Ayrıntı: [audit/RAPOR-DENETIMI.md](audit/RAPOR-DENETIMI.md).
