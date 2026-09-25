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

`pnpm test` hesaplama ve özel API yanıtı testlerini birlikte çalıştırır.
`pnpm test:engine` yalnızca hesaplama testlerini çalıştırır.

## Bağlantı gerektiren özellikler

Google ile giriş Supabase yapılandırmasına bağlıdır. Üyelik ve ödeme için Stripe yapılandırması, kayıtlı portreler ve üyelik kayıtları için D1 veritabanı ve `web/drizzle/` altındaki şema değişiklikleri gerekir.

Gerekli değişken adları `web/.env.example` dosyasında bulunur. Gerçek anahtarlar sürüm kontrolüne eklenmemelidir. Yerel ve yayın ortamlarının bağlantıları ayrı yapılandırılmalıdır.

## Son yerel doğrulama — 25 Eylül 2026

- 9 otomatik test, TypeScript kontrolü ve üretim derlemesi geçti.
- Türkçe arayüzde portre oluşturma tarayıcıda doğrulandı.
- Gizlilik, kullanım koşulları ve hesap giriş sayfaları açıldı.
- Form gönderimi alan değerlerini doğrudan okur; otomatik doldurma/tarih alanı ile React durumu arasındaki fark sonucu boş tarih okunmasını önler.
- Web hesaplama motoru ad ve soyadı ayrı ayrı doğrular ve kayıt katmanıyla aynı 80 karakter sınırını uygular.
- Google oturumu, kalıcı kayıt, ödeme ve mobil uygulama bu kontrolde uçtan uca test edilmedi.

Web portresi şu anda hesaplanan sinyalleri önceden yazılmış metinlere eşler. Önceki konuşmalardaki dört kapsamlı rapor protokolü bu web akışının parçası değildir.
