# 13 Haftalık Rolling Nakit Akışı — Veri Modeli v1

Türkiye'ye özgü haftalık likidite projeksiyon aracı için çekirdek veri modeli.
Hazırlık notu: alan isimleri İngilizce/snake_case, açıklamalar Türkçe. Sebep — Türkçe
karakterli alan isimleri (özellikle dotted-I) SQL, Python ve JS katmanlarında
normalizasyon hatası üretiyor.

---

## 1. Tasarım İlkeleri

1. **Kaynak bağımsızlığı.** Çekirdek model Logo'yu bilmez. Logo, Netsis, Excel — hepsi
   birer adaptör. Adaptör bu şemaya çevirir, çekirdek sadece bu şemayı görür.
2. **Her satırın bir kesinlik derecesi vardır.** Faturalanmış borç ile bütçelenmiş gider
   aynı tabloda ama aynı güvenilirlikte değil. Projeksiyon üç senaryoyu bu alandan üretir.
3. **Her satırın kaynağı izlenebilir.** `source_system` + `source_ref` ile geriye
   gidilebilmeli. Manuel müdahaleler ayrıca işaretli.
4. **Yanlış veri, eksik veriden tehlikelidir.** Vade = fatura tarihi olan kayıtlar
   şüpheli kabul edilir, sessizce kullanılmaz.
5. **Para birimi her zaman çift tutulur.** Orijinal döviz + TL karşılığı + kur ve kur tarihi.

---

## 2. Katman Mimarisi

```
[Logo SQL / Logo export / Netsis / Excel]
                 │
        ADAPTÖR KATMANI          ← kaynağa özgü, tek işi çevirmek
                 │
        ÇEKİRDEK TABLOLAR        ← standart şema (bölüm 3)
                 │
        TÜRETME KATMANI          ← vade düzeltme, tahsilat gecikmesi, vergi takvimi, kur senaryosu
                 │
        PROJEKSİYON MOTORU       ← haftalık kovalara dağıtım
                 │
        SUNUM                    ← tablo, grafik, veri kalitesi paneli
```

---

## 3. Çekirdek Tablolar

> **Tüm çekirdek tablolar `company_id` taşır.** v1 tek şirketle çalışır (bkz. 7.2), ancak
> alan baştan bulunur ve her sorgu üzerinden filtreler. Aşağıdaki tablolarda tek tek
> tekrar edilmedi. Sonradan eklemek her tabloyu, her sorguyu ve her ekranı değiştirmek
> demek olurdu; şimdi eklemek neredeyse bedava.

### 3.1 `party` — Cari hesap ana kaydı

| Alan | Tip | Not |
|---|---|---|
| `party_id` | PK | |
| `code` | text | Logo cari kodu |
| `name` | text | |
| `party_type` | enum | `customer`, `supplier`, `both`, `related`, `bank`, `government` |
| `default_term_days` | int | Varsayılan vade (gün). Vade eşleme tablosunun temeli |
| `default_term_source` | enum | `erp`, `contract`, `manual`, `assumed` |
| `payment_method` | enum | `transfer`, `cheque`, `note`, `dbs`, `cash`, `auto_debit` |
| `avg_delay_days` | decimal | Gerçekleşen gecikme ortalaması (türetilir, bkz. 4.2) |
| `is_critical` | bool | Ödenmemesi operasyonu durduran tedarikçi (elektrik, kira, ana tedarikçi) |

> Venüs Bilişim 15 gün, Sarper Petrol 3 gün, mali müşavir 30 gün — bunlar burada yaşar.
> Fatura bazında değil, cari bazında.

---

### 3.2 `open_item` — Açık borç/alacak kalemleri

Nakit akışının ana gövdesi. Fatura değil, **kapanmamış ödeme hareketi** seviyesinde tutulur.
Kısmi ödemeler doğru yansısın diye.

| Alan | Tip | Not |
|---|---|---|
| `item_id` | PK | |
| `party_id` | FK | |
| `direction` | enum | `in` (tahsilat), `out` (ödeme) |
| `doc_type` | enum | `invoice`, `expense`, `advance`, `other` |
| `doc_no` | text | |
| `doc_date` | date | Fatura tarihi |
| `due_date` | date | ERP'den gelen vade |
| `due_date_effective` | date | Türetilmiş gerçek vade (bkz. 4.1) |
| `amount_original` | decimal | Kalan (kapanmamış) tutar |
| `currency` | text | |
| `fx_rate` | decimal | |
| `fx_rate_date` | date | |
| `amount_try` | decimal | |
| `paid_amount` | decimal | Kısmi ödeme |
| `installment_no` | int | Taksitli ödeme planında sıra |
| `certainty` | enum | `committed`, `likely`, `estimated` |
| `due_date_quality` | enum | `reliable`, `suspect`, `missing`, `overridden` |
| `source_system` | text | |
| `source_ref` | text | Logo LOGICALREF vb. |

**Kritik kural:** `due_date == doc_date` ise `due_date_quality = suspect`.
Logo, ödeme planı bağlı değilse vadeyi fatura tarihine eşitler — boş bırakmaz.
Bu yüzden eksik veri, geçerli veri gibi görünür.

---

### 3.3 `instrument` — Çek / senet portföyü

Batı şablonlarında karşılığı yok. Ayrı tablo olmasının sebebi: çek yalnızca bir alacak değil,
ciro edilebildiği için aynı zamanda bir ödeme aracı.

| Alan | Tip | Not |
|---|---|---|
| `instrument_id` | PK | |
| `instrument_type` | enum | `cheque`, `promissory_note` |
| `direction` | enum | `received`, `issued` |
| `party_id` | FK | Keşideci / lehtar |
| `drawer_name` | text | Ciro edilmişse keşideci farklı olabilir |
| `bank_name` | text | |
| `due_date` | date | |
| `amount` | decimal | |
| `currency` | text | |
| `status` | enum | `portfolio`, `at_bank_collection`, `at_bank_collateral`, `endorsed`, `cleared`, `bounced`, `cancelled` |
| `risk_score` | decimal | Karşılıksız çıkma olasılığı (türetilir, bkz. 4.3) |
| `is_available_for_endorsement` | bool | Portföyde ve serbestse ödeme aracı olarak kullanılabilir |

**Projeksiyon etkisi:**
- `at_bank_collateral` → nakit girişi *değil*, teminat. Tahsil edilmiş sayılmaz.
- `endorsed` → ne giriş ne çıkış; ilgili `open_item` kapanır.
- `received` + `portfolio` → vade tarihinde giriş, `risk_score` ile ağırlıklandırılır.

---

### 3.4 `loan_schedule` — Kredi ödeme planı

| Alan | Tip | Not |
|---|---|---|
| `loan_id` | FK | |
| `installment_no` | int | |
| `due_date` | date | |
| `principal` | decimal | |
| `interest` | decimal | |
| `bsmv_kkdf` | decimal | Vergi ve fon payları ayrı — Türkiye'de ihmal edilemez |
| `currency` | text | |
| `loan_type` | enum | `spot`, `rotative`, `installment`, `bch`, `factoring`, `leasing`, `overdraft` |
| `bank_name` | text | |

> Mevcut kredi takip Excel'inde (28 kredi / 232 taksit satırı) bu yapı zaten var.
> İlk besleme kaynağı o dosya olabilir.

---

### 3.5 `credit_line` — Kullanılabilir limitler

Nakit açığının "nasıl kapanacağı" sorusunun cevabı. Bu tablo olmadan araç yalnızca
problem gösterir, çözüm göstermez.

| Alan | Tip |
|---|---|
| `line_id` | PK |
| `bank_name` | text |
| `line_type` | enum (`spot`, `rotative`, `overdraft`, `factoring`, `letter_of_guarantee`, `dbs`) |
| `limit_amount` | decimal |
| `used_amount` | decimal |
| `available_amount` | decimal (türetilir) |
| `currency` | text |
| `indicative_rate` | decimal |
| `expiry_date` | date |

---

### 3.6 `payroll_item` — Maaş / SGK

Sabit ve büyük. Ayrı tablo, çünkü tarihleri diğer kalemlerden bağımsız kurala tabi.

| Alan | Tip | Not |
|---|---|---|
| `period` | date | Ay |
| `component` | enum | `net_salary`, `sgk_employee`, `sgk_employer`, `income_tax_withholding`, `severance`, `bonus`, `meal_transport` |
| `amount` | decimal | |
| `payment_date` | date | |
| `headcount` | int | Senaryo analizi için |

---

### 3.7 `tax_calendar` — Vergi takvimi

**İçe aktarılmaz, üretilir.** Kural motoru kanuni son ödeme günlerini hesaplar;
hafta sonu / resmî tatil kayması dahil.

| Alan | Tip | Not |
|---|---|---|
| `tax_type` | enum | `vat`, `withholding`, `sgk`, `advance_corporate_tax`, `corporate_tax`, `stamp_duty`, `other` |
| `period` | date | |
| `statutory_due_date` | date | Kaymalar uygulanmış |
| `amount` | decimal | Tahmin veya kesin |
| `certainty` | enum | |

> Beyanname son günleri mevzuatla değişebiliyor. Kurallar kod içine gömülmemeli,
> yapılandırma dosyasında tutulmalı. Yıl başında bir kez güncellenir.

---

### 3.8 `bank_balance` — Açılış nakit pozisyonu

| Alan | Tip |
|---|---|
| `account_id` | PK |
| `bank_name` | text |
| `account_type` | enum (`current`, `deposit`, `pos_pending`, `cash`) |
| `balance` | decimal |
| `currency` | text |
| `as_of_date` | date |
| `is_restricted` | bool (bloke / teminat) |

`is_restricted = true` olanlar kullanılabilir nakde dahil edilmez.

---

### 3.9 `manual_entry` — Elle girilen kalemler

ERP'de olmayan her şey: planlanan yatırım, temettü, vergi cezası, tahsil edilecek dava alacağı.

| Alan | Tip |
|---|---|
| `entry_id` | PK |
| `label` | text |
| `direction` | enum |
| `expected_date` | date |
| `amount` | decimal |
| `currency` | text |
| `certainty` | enum |
| `created_by` | text |
| `note` | text |

---

## 4. Türetme Katmanı

### 4.1 Etkin vade hesabı (`due_date_effective`)

Öncelik sırası:

1. Manuel override varsa → o
2. `due_date_quality = reliable` ise → ERP vadesi
3. `party.default_term_days` doluysa → `doc_date + default_term_days`
4. Hiçbiri yoksa → cari tipine göre varsayılan + `quality = missing` işareti

Sonra tahsilat tarafı için gecikme katsayısı eklenir:
`projected_date = due_date_effective + party.avg_delay_days`

Ödeme (çıkış) tarafında gecikme **uygulanmaz** — kendi ödemelerini geciktirmeyi
plan olarak değil, senaryo olarak modellemek gerekir.

### 4.2 Tahsilat gecikme kalibrasyonu

Rolling yapının asıl faydası burada. Her hafta düşen hafta gerçekleşmiş veri olur:
`gerçekleşen tahsilat tarihi − beklenen tarih` farkı cari bazında birikir,
`party.avg_delay_days` bu geçmişten güncellenir. 3-4 ay sonra tahminler kendi verinle kalibre olur.

### 4.3 Çek risk skoru

Basit başla: keşideci bazında geçmiş karşılıksız oranı + portföy yaşı.
Veri yoksa sektör varsayılanı. Aşırı mühendislik yapılacak yer değil.

### 4.4 Haftalık kovalama

- Hafta anahtarı: ISO hafta, Pazartesi başlangıç (`2026-W33`)
- Ufuk: parametrik, varsayılan 13
- İşaret: giriş `+`, çıkış `−`
- Her hafta için: `opening_balance`, `total_in`, `total_out`, `net_flow`, `closing_balance`,
  `available_credit`, `liquidity_after_credit`

Üç senaryo, `certainty` alanından otomatik üretilir:

| Senaryo | Dahil edilenler |
|---|---|
| Kötümser | Yalnızca `committed`; tahsilatlara gecikme + çek riski uygulanmış |
| Baz | `committed` + `likely` |
| İyimser | Hepsi, gecikme uygulanmadan |

### 4.5 Kur senaryoları

v1 kapsamında (bkz. 7.3). Yalnızca `currency <> TRY` olan satırları ilgilendirir.

`open_item.amount_try`, kaydın **defter değeridir** — işlem anındaki kurla hesaplanmış
tarihsel bir gerçektir ve öyle kalır. İleri tarihli bir kalemin projeksiyondaki TL
karşılığı ondan okunmaz, senaryo kuruyla yeniden hesaplanır. İkisini karıştırmamak
önemli: biri olan, diğeri varsayılan.

Senaryo kuru hafta bazında tutulur — `(scenario, currency, week_key, rate)`, `week_key`
4.4'teki ISO hafta anahtarı:

| Senaryo | Kur eğrisi |
|---|---|
| `fixed` | `as_of` tarihindeki kur tüm ufka sabit uygulanır. Referans senaryo. |
| `forward` | Hafta bazında kur eğrisi; forward kotasyonundan alınır veya elle girilir. |
| `stress` | `fixed` üzerine tek parametreli şok (ör. TL %20 değer kaybı). |

Bunlar 4.4'teki kötümser/baz/iyimser senaryolarından **bağımsız bir eksendir**. Biri
tahsilatın *ne zaman ve ne kadarının* geleceğiyle, diğeri geldiğinde *kaç TL edeceğiyle*
ilgili. Raporda ikisi birlikte belirtilmeli, yoksa "kötümser" hangi kurla kötümser
belirsiz kalır.

**Kotasyon yönü.** Kur her zaman `1 [güçlü] = X [zayıf]` biçiminde, piyasada okunduğu
gibi girilir; anchor önceliği `EUR > GBP > USD > TRY`. Ters çevirme (bölme mi çarpma mı)
kullanıcıya sorulmaz, çift yönlü türetilir. Bu mantık bu depoda testleriyle birlikte
zaten yazılı — `src/lib/fxQuote.ts`, `src/lib/fxQuote.test.ts` — ve buraya olduğu gibi
taşınabilir.

**Kuru olmayan hafta varsayılmaz.** 1. bölümün 4. ilkesinin doğrudan sonucu: kuru
tanımsız bir hafta için dövizli kalem çevrilmez, işaretlenir ve dönüştürülmüş toplamın
dışında bırakılır. Sessizce 1.0 ya da son bilinen kur kabul edilmez — aksi halde eksik
kur, düşük ama geçerli görünen bir toplam üretir. Bu depodaki mevcut araç da aynı şekilde
davranıyor (`NoRateCell`), sebebi aynı.

---

## 5. Veri Kalitesi Paneli

Aracın en satılabilir tek ekranı olabilir. Şirket ERP'sindeki boşluğu ilk kez rakamla görür.

Gösterilecek kontroller:

- Vade = fatura tarihi olan açık kalemler (adet + tutar)
- Ödeme planı tanımlı olmayan cari sayısı ve bu carilerin toplam açık bakiyesi
- Vadesi geçmiş ama kapanmamış kalemler (gerçekten ödenmemiş mi, mahsup mu?)
- Vadesi geçmiş, portföyde duran çekler
- Kur bilgisi eksik dövizli kalemler
- Senaryo kuru tanımsız haftaya düşen dövizli kalemler (bkz. 4.5) — çevrilmeden bırakılan tutar
- Ufuk dışına düşen (13 hafta sonrası) tutar — "görünmeyen" kısmın büyüklüğü

Her satır tıklanabilir olmalı, altındaki kayıt listesine inmeli. Aksi halde uyarı
soyut kalır ve kimse düzeltmez.

---

## 6. Logo Eşleme Notları

> Bu bölüm doğrulanacak. Logo tablo/alan isimleri sürüme ve firma-dönem numarasına göre
> değişiyor. **Erişim varken export şablonlarının kolon yapısı not alınmalı** —
> gerçek veri değil, sadece başlıklar ve format.

| Çekirdek tablo | Logo kaynağı (doğrulanacak) |
|---|---|
| `party` | Cari hesap kartları + ödeme planı tanımı |
| `open_item` | Cari hesap hareketleri, kapanmamış ödeme hareketleri |
| `instrument` | Çek/senet kartları + durum hareketleri |
| `loan_schedule` | Kredi modülü / mevcut Excel takip dosyası |
| `payroll_item` | Bordro veya elle |
| `bank_balance` | Banka hesap ekstresi / elle |

Not: `open_item` için fatura başlığı değil, ödeme hareketi (taksit) seviyesi gerekiyor.
Taksitli ödeme planında bir fatura birden çok satır üretir.

---

## 7. Kararlar

### 7.1 Besleme yöntemi → **Excel export ile başla, Logo SQL sonra**

İlk sürüm Logo'dan alınan export dosyalarını okur. Doğrudan SQL bağlantısı v1'de yok.

Gerekçe: BT erişimi, VPN ve izin süreci beklenmeden bu hafta başlanabilir. Ayrıca 6.
bölümün kendi uyarısı — Logo tablo ve alan isimlerinin sürüme ve firma-dönem numarasına
göre değişmesi — doğrudan SQL'i belirsizliği en yüksek seçenek yapıyor. Belirsiz olanı
ikinci adıma bırakmak doğru sıra.

Bu bir yol ayrımı değil, sıralama tercihi: 2. bölümdeki adaptör katmanı zaten kaynak
bağımsızlığı için var. SQL'e geçmek ikinci bir adaptör yazmak demek; çekirdek tablolar,
türetme kuralları, projeksiyon motoru ve ekranlar değişmez.

> **Doğrulanması gereken koşul.** Excel yolunun geçerliliği tek bir şeye bağlı:
> export'un **taksit (ödeme hareketi) seviyesinde** satır üretebilmesi. Yalnızca fatura
> başlığı veriyorsa taksit kırılımı kaybolur ve tutarlar yanlış haftaya düşer — bu da
> aracın tek işini bozar. 6. bölümdeki kolon yapısı notu alınırken ilk bakılacak şey bu.

### 7.2 Şirket kapsamı → **Tek şirket, `company_id` baştan var**

v1 tek şirketle çalışır; konsolidasyon ve grup içi eliminasyon yok. Ancak `company_id`
tüm çekirdek tablolarda baştan bulunur (bkz. 3. bölüm girişi). Sonradan eklemenin
maliyeti şemayı, sorguları ve ekranları tek tek elden geçirmek; şimdi eklemenin maliyeti
bir kolon.

### 7.3 Kur senaryosu → **v1'e dahil**

`fixed` / `forward` / `stress` üçlüsü ilk sürümde var. Tasarımı 4.5'te.

Kapsama alınmasını kolaylaştıran bir sebep: kotasyon yönü ve çevrim mantığı bu depoda
testleriyle birlikte zaten yazılı, sıfırdan başlanmıyor.

### 7.4 Enflasyon etkisi → **v2**

Reel nakit pozisyonu ayrı bir gösterge olarak v1'de yok. Hangi endeksin kullanılacağı
başlı başına bir karar ve çekirdek şemayı etkilemiyor — sonradan eklenebilir.

### 7.5 Kullanıcı sayısı → **v1 tek kullanıcı**

Tek kullanıcılı masaüstü/web sürümü. Çok kullanıcılı erişim, giriş ve yetkilendirme
backend + kimlik doğrulama gerektirir; v2.

---

## 8. Açık Kalan Tek Blokaj

**6. bölümdeki Logo eşlemesi doğrulanmadı.** Erişim varken export şablonlarının kolon
yapısı not alınmalı — gerçek veri değil, yalnızca başlıklar ve format. Öncelik sırası:

1. `open_item` taksit seviyesinde çıkıyor mu (bkz. 7.1 koşulu)
2. Vade alanı geliyor mu, geliyorsa `due_date == doc_date` oranı ne (3.2'deki kritik kural)
3. `source_ref` olarak kullanılabilecek bir kayıt anahtarı (LOGICALREF vb.) export'ta var mı
4. Çek/senet durum bilgisi hangi alanda ve hangi değerlerle geliyor (3.3'teki `status` enum'u)

---

*v1 — 7. bölümdeki beş karar alındı. Kod yazımından önce kalan tek blokaj 8. bölüm.*
