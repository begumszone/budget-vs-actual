# Fatura Onay Sistemi

Muhasebe departmanı ile diğer departmanlar arasındaki **harcama** ve **fatura onay**
akışlarını tek yerde toplayan, mobil uyumlu kurumsal bir web uygulaması.

Next.js (App Router) + Prisma + TypeScript + Tailwind CSS ile geliştirildi.
Yerelde SQLite ile kutudan çıkar çıkmaz çalışır; Vercel'de Postgres'e geçirilir.

---

## İki temel akış

### 1) Harcama Formu (Çalışan → Muhasebe)

Herhangi bir çalışan yaptığı harcamayı fişiyle birlikte muhasebeye gönderir.

- **Örnek:** Begüm, ABC Ltd. müşteri ziyaretine giderken 700 TL taksi harcaması
  yapar, taksi fişinin fotoğrafını çeker, formu doldurup gönderir.
- Formda bulunan alanlar: ad-soyad (oturumdan gelir), **departman**, **harcama
  günü**, **tutar**, **harcama türü** (taksi, yemek, konaklama…), **harcamanın
  amacı** (hangi müşteri/iş için) ve **fiş/belge fotoğrafı**.
- Muhasebe formu inceler → **Onaylar / Reddeder**, onaylıysa **Ödendi** olarak
  işaretler. Her adım işlem geçmişine (zaman çizelgesi) yazılır.

### 2) Fatura Onayı (Muhasebe → Departman / Kişi)

Muhasebeye bir tedarikçiden fatura gelir; muhasebe faturayı sisteme yükleyip
ilgili departmana ya da kişiye onaya gönderir.

- **Örnek:** XYZ Limited Şirketi'nden gelen fatura, iş geliştirme departmanının
  aldığı bir marketing hizmetine aittir. Muhasebe faturanın PDF'ini yükler,
  **İş Geliştirme** departmanını (ya da o departmandan bir kişiyi) seçip onaya
  gönderir.
- Yönlendirme **departman** ya da **kişi** olarak yapılabilir (kullanıcıya seçim
  sunulur).
- Onaya gelen departman/kişi, faturayı görür ve **arka taraf verilerini** doldurur:
  **masraf merkezi**, **muhasebe (GL) hesabı**, **bütçe kalemi**, **proje/kampanya
  kodu**, **bütçede var mıydı?**, **hizmet dönemi** ve **not**. Ardından
  **Onaylar / Bilgi İster / Reddeder**.

---

## Roller

| Rol | Yetki |
| --- | --- |
| **Çalışan** (EMPLOYEE) | Harcama formu oluşturur, kendi formlarını görür |
| **Muhasebe** (ACCOUNTING) | Tüm harcamaları inceler; fatura yükler ve onaya yönlendirir |
| **Onaycı** (APPROVER) | Kendisine / departmanına gelen faturaları inceleyip karara bağlar |
| **Yönetici** (ADMIN) | Tüm yetkiler + kullanıcı/departman görünümü |

Erişim kontrolü sunucu tarafında uygulanır: bir onaycı yalnızca kendisine ya da
kendi departmanına yönlendirilmiş faturaları görebilir.

---

## Teknoloji

- **Next.js 15** (App Router, Server Actions) + **React 19**
- **Prisma ORM** — yerelde SQLite, production'da Postgres
- **TypeScript**, **Tailwind CSS** (mobil öncelikli, responsive tasarım)
- **jose** ile imzalı çerez tabanlı oturum, **bcryptjs** ile parola hash'i
- **zod** ile sunucu tarafı doğrulama
- Yüklenen dosyalar (fiş fotoğrafı / fatura PDF'i) veritabanında saklanır — harici
  bir depolama servisine (S3 vb.) gerek yoktur.

---

## Yerel kurulum

Gereksinim: Node.js 18+ (20/22 önerilir).

```bash
# 1. Bağımlılıklar
npm install

# 2. Ortam değişkenleri
cp .env.example .env
#   AUTH_SECRET için güçlü bir değer üretin:
#   openssl rand -base64 32

# 3. Veritabanını oluştur ve örnek verileri yükle
npm run db:push
npm run db:seed

# 4. Geliştirme sunucusu
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır.

### Demo hesapları

Tümünün parolası: **`parola123`**

| Rol | E-posta |
| --- | --- |
| Muhasebe | `muhasebe@sirket.com` |
| Çalışan (Begüm) | `begum@sirket.com` |
| Onaycı (İş Geliştirme) | `selin@sirket.com` |
| Onaycı (Pazarlama) | `kaan@sirket.com` |
| Çalışan (İş Geliştirme) | `ege@sirket.com` |
| Yönetici | `admin@sirket.com` |

Kullanıcı ve departmanlar `prisma/seed.ts` içinde tanımlıdır.

---

## Vercel'e dağıtım (Postgres ile)

Vercel'in sunucusuz ortamı kalıcı dosya sistemi tutmadığı için production'da
SQLite yerine **Postgres** kullanılmalıdır (Vercel Postgres / Neon / Supabase).

1. **Postgres oluşturun.** Vercel panelinde *Storage → Create → Postgres* (veya
   Neon) ile bir veritabanı oluşturun ve bağlantı adresini kopyalayın.

2. **Prisma sağlayıcısını değiştirin.** `prisma/schema.prisma` içinde:

   ```prisma
   datasource db {
     provider = "postgresql"   // "sqlite" idi
     url      = env("DATABASE_URL")
   }
   ```

3. **Ortam değişkenlerini** Vercel projesine ekleyin:
   - `DATABASE_URL` → Postgres bağlantı adresiniz
   - `AUTH_SECRET` → `openssl rand -base64 32` çıktısı

4. **İlk şemayı ve örnek verileri** yükleyin (yerelinizden, production DATABASE_URL
   ile bir kez):

   ```bash
   DATABASE_URL="<postgres-url>" npx prisma db push
   DATABASE_URL="<postgres-url>" npm run db:seed   # opsiyonel örnek veri
   ```

5. **Deploy edin.** GitHub reposunu Vercel'e bağlayın; `npm run build` komutu
   `prisma generate` çalıştırıp Next.js derlemesini yapar.

> İpucu: İlk gerçek kullanıcı için seed'i çalıştırmak yerine `prisma/seed.ts`
> içindeki kullanıcıları kendi kadronuza göre düzenleyip bir kez seed edin,
> sonra parolaları değiştirin.

---

## GitHub'da özel (private) yayınlama

Bu depo **public yapılmamalıdır**. GitHub'da:

1. Repo → **Settings → General → Danger Zone → Change repository visibility →
   Private** ile depoyu özel yapın.
2. `.env` dosyası `.gitignore` içinde olduğundan gizli anahtarlar (AUTH_SECRET,
   veritabanı adresi) repoya **hiç girmez**. Bunları yalnızca Vercel ortam
   değişkeni olarak tutun.
3. Ekip arkadaşlarınıza erişim için *Settings → Collaborators* üzerinden davet
   gönderebilirsiniz.

---

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Prisma client üretir + production derlemesi |
| `npm run start` | Production sunucusu |
| `npm run db:push` | Şemayı veritabanına uygular |
| `npm run db:seed` | Örnek departman/kullanıcıları yükler |

---

## Proje yapısı

```
prisma/
  schema.prisma        # Veri modeli (User, Department, ExpenseForm, Invoice, FileAsset, AuditEvent)
  seed.ts              # Örnek departman ve kullanıcılar
src/
  app/
    login/             # Giriş ekranı
    (app)/             # Oturum gerektiren alan (ortak navigasyon)
      dashboard/       # Role göre özet panel
      expenses/        # Harcama formları: liste / yeni / detay+onay
      invoices/        # Faturalar: liste / yeni / detay+onay
      admin/           # Kullanıcı & departman görünümü (yönetici)
    api/files/[id]/    # Yüklenen dosyaları güvenli sunma
  components/          # NavBar, StatusBadge, Timeline, FilePreview, ...
  lib/                 # db, auth, files, format, code yardımcıları
```
