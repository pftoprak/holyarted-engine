# Kontrol rehberi: `review/son-hal`

Bu branch, 28 Ekim – 4 Kasım 2026 arasındaki tüm değişiklikleri tek yerde toplar. Ana branch'e (`clean-skeleton`) **henüz birleştirilmedi**; birleştirme kararı kontrolden sonra verilecek.

İçindekiler:

| Konu | Önceki PR | Ayrıntı |
| --- | --- | --- |
| Girişsiz yerel mod, detaylı okuma | #1 (birleşti) | [HANDOFF.md](HANDOFF.md) |
| Rapor denetimi (36 kişi), sunum düzeltmeleri | #2 | [audit/RAPOR-DENETIMI.md](audit/RAPOR-DENETIMI.md) |
| Premium: ücretli içerik sunucuda, plana göre | #3 | HANDOFF.md, "Plan erişimi" |
| Ödeme, hesap silme, istek sınırı, güvenlik, belgeler, Türkçe düzeltmeler | #4 | [docs/OPERATIONS.md](docs/OPERATIONS.md) |

## 1. Çalıştırma

```sh
git fetch origin
git checkout review/son-hal
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Ardından `http://localhost:3000` adresini aç.

- **Ziyaretçi görünümü (varsayılan):** Giriş yapmamış biri ne görüyorsa onu görürsün. Basic kartlar açık, ücretli bölümler kilitli.
- **Her şeyi görmek için:** `web/.env.local` dosyası oluştur, içine `HOLYARTED_ACCOUNTS_ENABLED=false` yaz ve `pnpm dev`'i yeniden başlat. Bu ayar sadece yerel bilgisayar içindir; canlıda **asla** kullanılmamalı.

Otomatik kontroller:

```sh
pnpm test                           # 32 test
pnpm exec tsc --noEmit
pnpm build && pnpm check:bundle     # ücretli metin tarayıcı paketine sızmış mı
```

## 2. Kontrol listesi

**Ziyaretçi (giriş yok)**
- [ ] Ad, soyad ve doğum tarihi girince 2 portre kartı ve kilit paneli görünüyor.
- [ ] Detaylı okumada yalnızca Vitrin açık. Yetenekler ve Hayat yolu "Plus ile açılır", İdeal iş "Premium ile açılır" diyor.
- [ ] "İlişkide sen" bölümü kilitli.
- [ ] Ana sayfadaki önizleme yalnızca 2 kart gösteriyor; diğer ikisi kilitli.
- [ ] TR/EN geçişinde kartlar ve hata mesajları dili değiştiriyor.
- [ ] `/privacy`, `/terms`, `/kvkk` açılıyor. KVKK sayfası "TASLAK" diyor.
- [ ] Var olmayan bir adres (örneğin `/yok`) Holyarted tasarımlı 404 sayfasını gösteriyor.
- [ ] Telefon genişliğinde sayfa yana kaymıyor.

**Açık mod (`HOLYARTED_ACCOUNTS_ENABLED=false`)**
- [ ] 4 kart, ilişki ve iş bakışı ile tüm okuma bölümleri açık.
- [ ] Barış Kaya, 03.03.1995: İdeal iş "Bu bölüm hazırlanıyor." diyor (veri hatası, bilerek bırakıldı).
- [ ] Ece Su Kaya, 11.03.2008: İdeal iş başlığı "Yöneldiğin alanlar" (25 yaş altı).

**Metin ve ürün**
- [ ] "Neden bu sonuç" satırları anlaşılır mı?
- [ ] Plan dağılımı doğru mu? (HANDOFF.md'deki tablo; kurucu onayı bekliyor.)
- [ ] KVKK taslağındaki ifadeler doğru mu? (Hukuki inceleme ayrıca gerekli.)

## 3. Bu sürümde denenemeyenler

Supabase ve Stripe anahtarları olmadığı için şunlar **yalnızca otomatik testlerle** doğrulandı, gerçek ortamda denenmedi:

- Google ile giriş
- Ödeme ve plan yükseltme
- Plus ve Premium kullanıcı görünümü
- Hesap silme
- Paylaşılan istek sınırı

Bunlar için staging ortamı gerekiyor ([docs/OPERATIONS.md](docs/OPERATIONS.md) madde 6).

## 4. Canlıya çıkmadan önce kalanlar

1. **Ödeme sağlayıcısı kararı.** Stripe Türkiye'de çalışmıyor.
2. **Satış belgeleri.** Mesafeli satış sözleşmesi, ön bilgilendirme formu, iade ve cayma koşulları, çerez metni. KVKK'daki boş alanlar: adres, vergi no, KEP.
3. **"Human Design" adı.** Marka incelemesi yapılmalı.
4. **Veri hataları.** İdeal iş 33 bir Premium bölümü ve boş görünüyor.
5. **Staging ve uçtan uca test.** Migration `0002` uygulanmalı, iki ayrı test hesabıyla baştan sona denenmeli.
6. **CI dosyası.** [docs/github-ci.yml](docs/github-ci.yml), GitHub web arayüzünden `.github/workflows/ci.yml` olarak eklenmeli.

## 5. Geri bildirim

Notlarını PR'a yorum olarak yazabilirsin. Satır satır yorum için "Files changed" sekmesi kullanılabilir.
