# HOLYARTED

- Yapılanlar ve sıradaki işler: [HANDOFF.md](HANDOFF.md)
- Yayın öncesi açık riskler: [RELEASE-READINESS.md](RELEASE-READINESS.md)
- Yedekleme, geri yükleme ve dağıtım kontrol listesi: [docs/OPERATIONS.md](docs/OPERATIONS.md)
- Kontrol rehberi: [KONTROL.md](KONTROL.md)

## Proje yapısı

- `web/`: React ve Vinext web uygulaması; Cloudflare Workers/D1 çalışma ortamı.
- `mobile/`: Expo mobil uygulaması. Henüz sunucuya bağlı değil; portreyi cihazda hesaplar.
- `api/`: Eski JavaScript API'leri. Repoda olmayan `@holyarted/api-shared` paketine bağlı olduğu için bu haliyle çalışmaz. Bilerek silinmedi (HANDOFF.md).
- `data/`: Hesaplama ve yorumlama veri kümeleri. Kurucu onayı olmadan değiştirilmez.
- `audit/`: Rapor denetimi (36 sentetik kişi) ve betiği.
- `docs/`: İşletme notları ve CI dosyası.

## Web uygulamasını yerelde çalıştırma

Node.js 22.13 veya üzeri ve pnpm gerekir.

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Varsayılan adres `http://localhost:3000`. Hiçbir anahtar gerekmez. Anahtarsız çalıştırıldığında site yalnız ücretsiz sürümle açılır: giriş ve üyelik bölümleri gizlenir, ücretli bölümler kilitli görünür. Her şeyi yerelde görmek için `web/.env.local` dosyasına `HOLYARTED_ACCOUNTS_ENABLED=false` yaz. Bu ayar **yalnızca yerel içindir**, yayında kullanılmaz.

## Kontroller

`web/` klasöründe:

```sh
pnpm test                          # 40 test
pnpm exec tsc --noEmit
pnpm lint
pnpm build && pnpm check:bundle    # ücretli metinler tarayıcı paketine girmiş mi
```

`pnpm test` şunları test eder:

- Hesaplama motoru ve web ile mobil kopyasının aynı sonucu vermesi.
- Plan bazlı içerik süzme.
- Ödeme olayları: sıra, tekrar ve fiyattan plan.
- Hesap silme ve kaldığı yerden devam etmesi.
- Elle verilen planlar.
- Paylaşılan istek sınırı.
- Hata bildirimi.
- Kullanıcılar arası veri izolasyonu.

Testler gerçek SQL şemasını bellekteki SQLite üzerinde çalıştırır. Dış ağa, gerçek kullanıcılara veya ödeme sistemine erişmez. CI dosyası: [docs/github-ci.yml](docs/github-ci.yml).

## Ayarlar

Tüm değişken adları `web/.env.example` dosyasında. Gerçek anahtarlar sürüm kontrolüne eklenmez. Özetle:

| Değişken | Ne işe yarar |
| --- | --- |
| `SITE_URL` | Sitenin gerçek adresi. Paylaşım önizlemesi, `robots.txt` ve `sitemap.xml` için gerekli. |
| `SUPABASE_*` | Google ile giriş. Yoksa giriş ve profil gizlenir. |
| `STRIPE_*` | Ödeme. Hepsi tanımlı değilse üyelik bölümü gizlenir. Sağlayıcı değişebilir: `web/lib/billing/`. |
| `ADMIN_TOKEN` | Elle plan verme (`web/scripts/grant.mjs`). Yoksa yönetici adresi kapalıdır. |
| `ERROR_REPORT_URL` | Sunucu hatalarının gönderileceği Slack veya Discord webhook adresi. İsteğe bağlı. |
| `HOLYARTED_ACCOUNTS_ENABLED` | Tanımsız ya da `true`: hesaplar açık. `false`: yalnızca yerel açık mod. |

Veritabanı şeması `web/drizzle/` altında. Yayından önce migration'lar sırayla uygulanmalı (docs/OPERATIONS.md).

## Sağlık kontrolü

`/api/health` adresi yalnızca `{ "status": "ok" }` ya da `503` ile `{ "status": "unavailable" }` döndürür:

- **Giriş ayarlı değilse:** Site yalnız ücretsiz sürümle çalışır ve dış servise bağlı değildir. Sonuç 200 olur.
- **Giriş ayarlıysa:** Veritabanına erişilemezse 503 döner.
