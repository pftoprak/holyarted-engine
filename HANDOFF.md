# Devir notu — `feature/no-login-local`

Bu branch, uygulamanın **giriş ve ödeme olmadan** yerelde ve yayında çalışabilmesi için hazırlandı. Arka uç (hesap, ödeme, üyelik) kodu silinmedi; tek bir ayarla kapatıldı. Bu belge yapılanları ve sıradaki işleri anlatır. Genel eksik listesi için [RELEASE-READINESS.md](RELEASE-READINESS.md).

## Çalıştırma

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Hiçbir anahtar gerekmez. `http://localhost:3000` adresinde isim, soyisim ve doğum tarihi girilince tam portre ve detaylı okuma açılır.

## Ayar: `HOLYARTED_ACCOUNTS_ENABLED`

| Değer | Davranış |
| --- | --- |
| tanımsız / `false` (varsayılan) | Google girişi, üyelik/fiyat bölümü, kilit paneli ve "kaydet" alanları gizli. 4 portre kartı + ilişki ve iş bakışı herkese açık. `/profile` sayfası ve `/api/portrait`, `/api/account*`, `/api/billing/*` (webhook dahil) adresleri Supabase, D1 veya Stripe'a dokunmadan **404** döner. `/api/health` dış servise bakmadan `ok` döner. |
| `true` | Önceki davranış birebir geri gelir (giriş, üyelik, Stripe, kayıtlı portre). Bu durumda `.env.example` içindeki diğer değişkenler de gerekir. |

Ayarın okunduğu yer: [web/lib/features.ts](web/lib/features.ts).

## Bu branch'te yapılanlar

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
2. **Ücretli içeriği sunucuya taşı.** Bayrak açıldığında Basic kullanıcı, Plus/Premium metinleri yine istemci kodundan okuyabilir (`slice(0, 2)` yalnızca gizler). Kartlar da `/api/reading` gibi sunucudan, üyeliğe göre filtrelenerek gelmeli. Detaylı okumanın hangi planda açık olacağı da burada karara bağlanmalı; şu an `/api/reading` herkese açık.
3. **Webhook düzeltmeleri.** Planı checkout metadata'sı yerine `items.data[0].price.id` alanından belirle; olay sırası bozuk geldiğinde iptal edilmiş aboneliğin "active" olmasını engelle; event-id ile tekilleştir; boş subscription ID ile active yazılmasını engelle.
4. **Stripe API sürümünü sabitle** (`Stripe-Version` başlığı; yeni sürümlerde `current_period_end` abonelik kalemine taşındı) ve checkout isteklerine idempotency key ekle.
5. **Hesap silmeyi kalıcı bir işe çevir.** Stripe → D1 → Supabase sırası yarıda kalırsa kaldığı yerden devam edebilmeli.
6. **İstek sınırını paylaşılan bir depoya taşı** (Cloudflare Rate Limiting / Durable Object / KV); bellekteki kayıtlar worker'lar arasında paylaşılmıyor ve temizlenmiyor. Kimlik doğrulamadan önce IP tabanlı sınır uygula.
7. **Güvenlik başlıkları** (CSP, HSTS, frame koruması) ve **CI** (`.github/workflows`: test, tsc, build, lint). Lint'teki 48 hata çoğunlukla `components/ui` altındaki hazır bileşenlerden.
8. **Temizlik ve yasal metin.** Çalışmayan `api/` klasörünü kaldır/arşivle; web ve mobil hesaplama motorunu tek pakette birleştir; gizlilik metnine veri işleyenleri (Supabase, Stripe, Cloudflare) ve KVKK aydınlatmasını ekle.
