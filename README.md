# HOLYARTED

## Proje yapısı

- `web/`: React ve Vinext web uygulaması; Cloudflare Workers/D1 çalışma ortamı.
- `mobile/`: Expo mobil uygulaması.
- `api/`: Ayrı JavaScript hesaplama ve içerik API'leri.
- `data/`: Hesaplama ve yorumlama veri kümeleri.

## Web uygulamasını yerelde çalıştırma

Node.js 22.13 veya üzeri ve pnpm gerekir. `node` komutunun PATH üzerinde erişilebilir olması gerekir; paketlerin kurulum adımları da Node kullanır.

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Terminalde gösterilen yerel adresi açın (varsayılan: `http://localhost:3000`).
İsim, soyisim ve doğum tarihiyle temel portre oluşturmak için dış servis anahtarı gerekmez.

## Kontroller

`web/` klasöründe:

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

`pnpm test` hesaplama, özel API yanıtı ve yerel hesap/veri izolasyonu testlerini birlikte çalıştırır.
`pnpm test:engine` yalnızca hesaplama testlerini çalıştırır.

## Bağlantı gerektiren özellikler

Google ile giriş Supabase yapılandırmasına bağlıdır. Üyelik ve ödeme için Stripe yapılandırması, kayıtlı portreler ve üyelik kayıtları için D1 veritabanı ve `web/drizzle/` altındaki şema değişiklikleri gerekir.

Gerekli değişken adları `web/.env.example` dosyasında bulunur. Gerçek anahtarlar sürüm kontrolüne eklenmemelidir. Yerel ve yayın ortamlarının bağlantıları ayrı yapılandırılmalıdır.

## Son yerel doğrulama — 25 Eylül 2026

- 13 otomatik test, TypeScript kontrolü ve üretim derlemesi geçti.
- Türkçe arayüzde portre oluşturma tarayıcıda doğrulandı.
- Gizlilik, kullanım koşulları ve hesap giriş sayfaları açıldı.
- Form gönderimi alan değerlerini doğrudan okur; otomatik doldurma/tarih alanı ile React durumu arasındaki fark sonucu boş tarih okunmasını önler.
- Form alanları kayıt katmanının mevcut 80 karakter sınırını uygular. Hesaplama motoru, sonuç metinleri ve tasarım korunmuştur.
- Google oturumu, kalıcı kayıt, ödeme ve mobil uygulama bu kontrolde uçtan uca test edilmedi.

Web portresi şu anda hesaplanan sinyalleri önceden yazılmış metinlere eşler. Önceki konuşmalardaki dört kapsamlı rapor protokolü bu web akışının parçası değildir.

## Yerel hesap testlerinin kapsamı

`web/tests/account.test.mjs`, gerçek API, kimlik doğrulama ve veri erişim kodunu çalıştırır. Gerçek SQL şemaları bellekteki SQLite üzerinde uygulanır; D1 aktarım katmanı ve Supabase HTTP yanıtları yerel test karşılıklarıyla değiştirilir. Dış ağa, gerçek kullanıcılara veya ödeme sistemine erişilmez.

- Oturumsuz ve geçersiz oturumlu isteklerin reddedilmesi.
- İki ayrı kullanıcı arasında kayıt, tekrar okuma, dışa aktarma ve silme izolasyonu.
- Gövde veya URL ile başka bir kullanıcı kimliği verilmesinin etkisiz olması.
- Geçersiz güncellemenin mevcut portreyi bozmaması.
- Üyelik durumunun doğru kullanıcıya ait olması ve dışa aktarmada ödeme tanımlayıcılarının bulunmaması.
- Servis hatalarında özel verilerin yanıta veya loglara aktarılmaması.

Bu testler gerçek Google OAuth akışını, tarayıcıdaki oturum geri yüklemeyi veya Cloudflare D1 ortamını uçtan uca doğrulamaz. Bunlar ayrı bir test hesabıyla sonraki adımdır. Tam hesap silme henüz uygulanmamıştır; mevcut silme işlemi yalnızca kayıtlı portreyi kaldırır.
