# İşletme notları: yedekleme, geri yükleme ve dağıtım

Bu belge canlıya çıkmadan önce ve sonra yapılacak teknik işleri anlatır. Genel eksik listesi için [RELEASE-READINESS.md](../RELEASE-READINESS.md).

> **Açık soru (önce bu çözülmeli):** Site, OpenAI Sites üzerinden barındırılıyor (`web/.openai/hosting.json`). Veritabanı Cloudflare D1. Bu D1 veritabanına `wrangler` ile doğrudan erişimimiz olup olmadığı, yedeklemenin barındırma sağlayıcısında mı yoksa bizde mi yapılacağı doğrulanmadı. Aşağıdaki komutlar doğrudan erişim varsayar. Erişim yoksa aynı işlerin sağlayıcıdan nasıl istendiği yazılı olarak alınmalı.

## 1. Veri nerede duruyor

| Veri | Yer | Kaynağı | Yedek gerekir mi |
| --- | --- | --- | --- |
| Üyelik (plan, durum, Stripe müşteri/abonelik kimliği) | D1 `memberships` | Stripe'tan türetilir | Evet. Kaybolursa Stripe'tan yeniden kurulabilir (madde 4). |
| Kayıtlı portre (ad, soyad, doğum tarihi) | D1 `portraits` | Kullanıcı girdisi | **Evet. Başka kopyası yok.** |
| Uygulanmış Stripe olayları | D1 `stripe_events` | Teknik kayıt | Hayır, kaybı zararsız. |
| İstek sınırı sayaçları (özetlenmiş anahtar) | D1 `rate_limits` | Teknik kayıt | Hayır. Bir saatten eski satırlar kendiliğinden silinir. |
| Süren hesap silmeleri | D1 `account_deletions` | Teknik kayıt | Evet (madde 5). |
| Kullanıcı hesabı (e-posta, Google kimliği) | Supabase Auth | Google girişi | Supabase planına bağlı (madde 3). |
| Ödeme, abonelik, fatura | Stripe | Stripe | Stripe'ın sorumluluğunda. Ödeme bilgisinin asıl kaynağı Stripe'tır. |
| Numeroloji metinleri | Repo, `data/*.json` | Excel | Git'te duruyor. |

D1 yedekleri kişisel veri içerir: ad, doğum tarihi, e-posta. Yedekler şifreli saklanmalı, erişim en az kişiyle sınırlanmalı.

## 2. D1 yedeği

- **Zamanda geri dönüş (Time Travel):** D1 son 30 günün (ücretsiz planda 7 gün) herhangi bir dakikasına geri dönebilir. Ayrı bir kurulum gerekmez.
  ```sh
  npx wrangler d1 time-travel info <DB_ADI>
  npx wrangler d1 time-travel restore <DB_ADI> --timestamp=<ISO_ZAMAN>
  ```
- **Haftalık dışa aktarım:** Time Travel aynı hesaba bağlıdır. Hesap kaybına karşı haftada bir dışa aktarım alınıp şifreli olarak başka bir yerde saklanmalı. Saklama süresi en fazla 35 gün; eski dosyalar silinir.
  ```sh
  npx wrangler d1 export <DB_ADI> --remote --output=holyarted-d1-<TARİH>.sql
  ```

## 3. Supabase yedeği

Ücretsiz planda otomatik yedek **yoktur**. Pro planda günlük yedek vardır, noktasal geri dönüş ise ek ücretlidir. Canlıya çıkmadan önce plan seçilmeli. Supabase'de yalnızca hesap kimliği tutulduğu için kayıp durumunda kullanıcılar yeniden giriş yapabilir. Ancak D1'deki kayıtlar eski kullanıcı kimliğine bağlı olduğundan eşleşme kopar. Bu yüzden Pro plan önerilir.

## 4. Geri yükleme sonrası yapılacaklar

1. **Silinmiş hesapları tekrar sil.** Yedek alındıktan sonra hesabını silen kişilerin verisi geri yüklemeyle geri gelir. Supabase'de artık bulunmayan her `user_id` için D1'deki `portraits` ve `memberships` satırları silinmeli (KVKK).
2. **Üyelikleri Stripe ile eşitle.** Stripe panelinde "Events" bölümünden geri yükleme zamanından sonraki `customer.subscription.*` ve `checkout.session.completed` olayları yeniden gönderilir. Webhook aynı olayı iki kez uygulamaz ve eski bir olayın yeni durumu ezmesine izin vermez. Bu yüzden yeniden göndermek güvenlidir.
3. **Kontrol:** `/api/health` 200 dönmeli. Bir test hesabıyla giriş yapılmalı, portre açılmalı ve plan doğru görünmeli.

## 5. Yarıda kalan hesap silmeleri

Silme sırası şöyledir: Stripe aboneliği iptal → D1 kayıtları → Supabase hesabı. İlerleme `account_deletions` tablosunda tutulur. Kullanıcı tekrar denerse işlem kaldığı yerden devam eder; Stripe iptali iki kez yapılmaz.

Bir saatten uzun süredir bekleyen silmeleri görmek için:

```sql
SELECT user_id, requested_at, billing_canceled, attempts, last_attempt_at
FROM account_deletions
WHERE last_attempt_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour');
```

Bu satırlar elle tamamlanır:
1. `billing_canceled = 0` ise Stripe panelinden abonelik iptal edilir.
2. D1'de `portraits` ve `memberships` satırları silinir.
3. Supabase panelinden kullanıcı silinir.
4. En son `account_deletions` satırı silinir.

Bu kontrol haftada bir yapılmalı.

## 6. Dağıtım öncesi kontrol listesi

- [ ] **Migration:** `web/drizzle/0002_*.sql` (paylaşılan istek sınırı, Stripe olay kaydı, hesap silme takibi, `billing_event_at` sütunu) kod yayınlanmadan **önce** uygulanmalı. Uygulanmazsa hesap ve ödeme istekleri hata verir.
  ```sh
  npx wrangler d1 migrations apply <DB_ADI> --remote
  ```
- [ ] `HOLYARTED_ACCOUNTS_ENABLED` canlıda tanımsız ya da `true` olmalı. **Asla `false` olmamalı**; `false` tüm ücretli içeriği açar.
- [ ] `.env.example` içindeki tüm değişkenler tanımlı olmalı. Eksikse `/api/health` 503 döner.
- [ ] Stripe webhook uç noktası şu olayları göndermeli: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] Supabase özel alan adı kullanılıyorsa `web/lib/security-headers.ts` içindeki `connect-src` satırına eklenmeli. Şu an yalnızca `*.supabase.co` izinli.
- [ ] GitHub'da `clean-skeleton` için branch koruması açılmalı: birleştirmeden önce CI geçmeli.

## 7. Güvenlik başlıkları

`web/middleware.ts` her yanıta şu başlıkları ekler: CSP, HSTS (2 yıl, alt alan adları dahil), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Değerler `web/lib/security-headers.ts` içindedir.

CSP'de `'unsafe-inline'` betikleri açıktır, çünkü çatı sayfa verisini satır içi betiklerle gönderir. İleride nonce tabanlı CSP'ye geçilebilir.

HSTS `preload` listesine eklenmedi. Alan adı sahibi karar verirse eklenebilir.

## 8. Tatbikat

Üç ayda bir, staging ortamında: D1'i 1 saat önceye geri yükle, madde 4'ü uygula, süreyi ve sorunları buraya yaz.

| Tarih | Kim | Süre | Not |
| --- | --- | --- | --- |
| — | — | — | Henüz yapılmadı |
