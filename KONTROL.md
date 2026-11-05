# Kontrol rehberi: son hal

Tüm değişiklikler `feature/system-prep` branch'inde toplu duruyor. Branch iki PR'a bölünmüş durumda:

- **PR #5** (`review/son-hal`): 28 Ekim – 4 Kasım arasındaki ilk büyük kısım.
- **PR #6** (`feature/system-prep`): PR #5'in üzerine eklenen sistem hazırlığı.

İkisi de ana branch'e (`clean-skeleton`) **birleştirilmedi**. Birleştirme kararı bu kontrolden sonra verilecek.

> **Önemli:** `holyarted.com` şu an yayında, ama Ekim öncesinden kalma **eski bir sürüm** çalışıyor. O sürümde Plus ve Premium kart metinleri tarayıcıya giden kodda açıkta (4 Kasım'da doğrulandı). Bu branch o açığı kapatıyor; ancak canlıya alınınca etkili olur.

| Konu | PR | Ayrıntı |
| --- | --- | --- |
| Rapor denetimi (36 kişi), sunum düzeltmeleri | #2 → #5 | [audit/RAPOR-DENETIMI.md](audit/RAPOR-DENETIMI.md) |
| Premium: ücretli içerik sunucuda, plana göre | #3 → #5 | [HANDOFF.md](HANDOFF.md), "Plan erişimi" |
| Ödeme, hesap silme, istek sınırı, güvenlik başlıkları, KVKK taslağı | #4 → #5 | [docs/OPERATIONS.md](docs/OPERATIONS.md) |
| Sağlayıcıdan bağımsız ödeme, yalnız ücretsiz yayın, hata bildirimi, elle plan verme, telefon düzeltmesi | #6 | HANDOFF.md, "Sistem hazırlığı" |

## 1. Çalıştırma

```sh
git fetch origin
git checkout feature/system-prep
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Ardından `http://localhost:3000` adresini aç.

- **Ziyaretçi görünümü (varsayılan):** Giriş ve ödeme anahtarı tanımlı olmadığı için site yalnız ücretsiz sürümle çalışır.
- **Her şeyi görmek için:** `web/.env.local` dosyasına `HOLYARTED_ACCOUNTS_ENABLED=false` yaz ve `pnpm dev`'i yeniden başlat. Bu ayar **yalnızca yerel bilgisayar içindir**.

Otomatik kontroller:

```sh
pnpm test                          # 40 test
pnpm exec tsc --noEmit
pnpm lint                          # 0 uyarı
pnpm build && pnpm check:bundle    # ücretli metin tarayıcı paketine sızmış mı
```

## 2. Kontrol listesi

**Ziyaretçi (anahtarsız, varsayılan)**
- [ ] Google ile giriş düğmesi, üyelik bölümü ve "Üyelik" menü bağlantısı görünmüyor.
- [ ] Ad, soyad ve doğum tarihi girince 2 portre kartı açık geliyor. Kilit panelinde "Üyelikler yakında açılıyor" yazıyor.
- [ ] Detaylı okumada Vitrin açık. Diğer bölümler ve "İlişkide sen" bölümünde "Yakında açılacak" yazıyor.
- [ ] Ana sayfadaki önizlemede 2 kart açık, 2 kart kilitli.
- [ ] TR/EN geçişinde metinler ve hata mesajları dili değiştiriyor.
- [ ] Geçersiz isim (sadece rakam ya da emoji) Türkçe hata veriyor ve önceki sonuç ekrandan kalkıyor.
- [ ] `/privacy`, `/terms` ve `/kvkk` açılıyor; KVKK sayfası "TASLAK" diyor. `/profile` 404 veriyor.
- [ ] `/yok` gibi var olmayan bir adres, Holyarted tasarımlı iki dilli 404 sayfasını gösteriyor.
- [ ] Telefon genişliğinde menü açılıyor ve sayfa yana kaymıyor.
- [ ] Sekme simgesi kahverengi zemin üzerinde "H".

**Açık mod (`HOLYARTED_ACCOUNTS_ENABLED=false`)**
- [ ] 4 kart, ilişki ve iş bakışları, dört okuma bölümü ve "İlişkide sen" açık.
- [ ] Barış Kaya, 03.03.1995: İdeal iş "Bu bölüm hazırlanıyor." diyor (veri hatası, bilerek bırakıldı).
- [ ] Ece Su Kaya, 11.03.2008: İdeal iş başlığı "Yöneldiğin alanlar" (25 yaş altı).

**Metin ve ürün**
- [ ] "Neden bu sonuç" satırları anlaşılır mı?
- [ ] Plan dağılımı doğru mu? (HANDOFF.md'deki tablo; kurucu onayı bekliyor.)
- [ ] KVKK taslağındaki ifadeler doğru mu? (Hukuki inceleme ayrıca gerekli.)

## 3. Bu sürümde denenemeyenler

Supabase ve ödeme anahtarları olmadığı için şunlar **yalnızca otomatik testlerle** doğrulandı, gerçek ortamda denenmedi:

- Google ile giriş
- Ödeme ve plan yükseltme
- Plus ve Premium kullanıcı görünümü
- Elle plan verme
- Hesap silme
- Paylaşılan istek sınırı

Bunlar için staging ortamı gerekiyor ([docs/OPERATIONS.md](docs/OPERATIONS.md) madde 6).

## 4. Canlıya çıkmadan önce kalanlar

1. **Canlıdaki eski sürüm değiştirilmeli.** PR #5 ve #6 birleştirilip yayınlanmalı. Bundan önce migration `0002` ve `0003` uygulanmalı, `SITE_URL` tanımlanmalı.
2. **Ödeme sağlayıcısı kararı.** Stripe Türkiye'de çalışmıyor. Kod, sağlayıcı değişimine hazır.
3. **Satış belgeleri.** Mesafeli satış sözleşmesi, ön bilgilendirme formu, iade ve cayma koşulları, çerez metni. KVKK'daki boş alanlar: adres, vergi no, KEP.
4. **"Human Design" adı.** Marka incelemesi yapılmalı.
5. **Veri hataları.** İdeal iş 33 bir Premium bölümü ve boş görünüyor.
6. **Alan adı:**
   - `www.holyarted.com` DNS kaydı yok; bu adrese gelen ziyaretçi hata alıyor.
   - DMARC kaydı yok.
7. **Mobil uygulama.** Sunucuya bağlı değil. 4 kartın kısa sürümlerini ücretsiz gösteriyor; mağazaya çıkmadan önce web API'sine bağlanmalı.
8. **CI dosyası.** [docs/github-ci.yml](docs/github-ci.yml), GitHub web arayüzünden `.github/workflows/ci.yml` olarak eklenmeli.

## 5. Geri bildirim

Notlarını PR #5 ya da #6'ya yorum olarak yazabilirsin. Satır satır yorum için "Files changed" sekmesi kullanılabilir.
