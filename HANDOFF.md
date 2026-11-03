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

- "Human Design" ifadesi (ürün sahibinin kararı). Not: Bu ad büyük olasılıkla tescilli bir markadır ve yapılan iş numerolojidir; lansmandan önce gözden geçirilmeli.
- Mobil uygulama (`mobile/`), `api/` klasörü, piramit ve sinerji verileri. Sinerji/piramit için hesaplama kuralı kodda yok; tahminle bağlanmadı.
- Soru formu (`questions` kopyası) kodda tanımlı ama ekranda yok; sonuç yalnızca isim ve tarihten hesaplanır.

## Sıradaki işler (arka uç, öncelik sırasıyla)

1. **Ödeme sağlayıcısı kararı.** Stripe Türkiye'de yok. Şirketin kurulu olduğu ülkeye göre Stripe / iyzico / Paddle / Lemon Squeezy seçilmeli. Kalan ödeme işleri buna bağlı.
2. ~~**Ücretli içeriği sunucuya taşı.**~~ `feature/premium-gating` ile yapıldı (yukarıdaki "Plan erişimi"). Kalan: plan matrisinin kurucu tarafından onaylanması ve canlıda iki ayrı test hesabıyla doğrulama.
3. **Webhook düzeltmeleri.** Planı checkout metadata'sı yerine `items.data[0].price.id` alanından belirle; olay sırası bozuk geldiğinde iptal edilmiş aboneliğin "active" olmasını engelle; event-id ile tekilleştir; boş subscription ID ile active yazılmasını engelle.
4. **Stripe API sürümünü sabitle** (`Stripe-Version` başlığı; yeni sürümlerde `current_period_end` abonelik kalemine taşındı) ve checkout isteklerine idempotency key ekle.
5. **Hesap silmeyi kalıcı bir işe çevir.** Stripe → D1 → Supabase sırası yarıda kalırsa kaldığı yerden devam edebilmeli.
6. **İstek sınırını paylaşılan bir depoya taşı** (Cloudflare Rate Limiting / Durable Object / KV); bellekteki kayıtlar worker'lar arasında paylaşılmıyor ve temizlenmiyor. Kimlik doğrulamadan önce IP tabanlı sınır uygula.
7. **Güvenlik başlıkları** (CSP, HSTS, frame koruması) ve **CI** (`.github/workflows`: test, tsc, build, lint). Lint'teki 48 hata çoğunlukla `components/ui` altındaki hazır bileşenlerden.
8. **Temizlik ve yasal metin.** Çalışmayan `api/` klasörünü kaldır/arşivle; web ve mobil hesaplama motorunu tek pakette birleştir; gizlilik metnine veri işleyenleri (Supabase, Stripe, Cloudflare) ve KVKK aydınlatmasını ekle.
