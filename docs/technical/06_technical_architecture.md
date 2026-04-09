# Teknik Mimari

## Genel Bakış
Field CRM, modüler monolith yaklaşımıyla geliştirilecektir. 6 kullanıcılık küçük ölçekli bir uygulama olduğu için microservice karmaşıklığına gerek yoktur. Ancak modüller arası sınırlar net tutularak ileride ayrıştırma kolaylaştırılacaktır.

---

## Teknoloji Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS (modüler yapı, dependency injection, guard/interceptor desteği)
- **ORM:** Prisma (type-safe, migration desteği, PostgreSQL uyumlu)
- **Veritabanı:** PostgreSQL 16
- **Auth:** JWT (access token + refresh token)
- **Validation:** class-validator + class-transformer
- **Mail:** Nodemailer (SMTP) veya Resend API
- **Scheduler:** @nestjs/schedule (cron job — gün sonu mail için)
- **API:** REST (GraphQL gereksiz karmaşıklık — 6 kullanıcı için REST yeterli)

**Neden NestJS?**
- Modüler yapı (her modül izole)
- Built-in dependency injection
- Guard'lar ile yetki kontrolü
- Interceptor'lar ile loglama
- Swagger ile otomatik API dokümantasyonu
- TypeScript native

### Frontend Web (Admin Panel)
- **Framework:** Next.js 15 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Form:** react-hook-form + zod
- **State:** React Server Components + SWR/TanStack Query (client data fetching)
- **Tablo:** TanStack Table
- **Grafik:** Recharts (dashboard için)
- **Excel:** SheetJS (xlsx parse/export)

**Neden Next.js?**
- SSR/SSG desteği
- App Router ile modern yapı
- API routes ile BFF pattern mümkün
- shadcn/ui ile hızlı UI geliştirme
- Vercel deploy kolaylığı

### Frontend Mobile (Saha Uygulaması)
- **Framework:** React Native + Expo (SDK 52)
- **Navigation:** Expo Router (file-based routing)
- **UI:** Bileşen kütüphanesi: React Native Paper veya NativeWind
- **GPS:** expo-location
- **State:** Zustand (hafif, basit)
- **HTTP:** Axios veya fetch
- **Storage:** expo-secure-store (token), AsyncStorage (cache)

**Neden Expo/React Native?**
- Web ekibiyle aynı dil (TypeScript)
- Claude Code ile verimli geliştirme
- expo-location ile GPS desteği kolay
- Expo Go ile hızlı test
- EAS Build ile app store dağıtımı

---

## Mimari Diyagram

```
┌─────────────────┐  ┌─────────────────┐
│   Next.js Web   │  │  Expo Mobile    │
│  (Admin Panel)  │  │ (Saha App)      │
└────────┬────────┘  └────────┬────────┘
         │                     │
         │      HTTPS/REST     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │    NestJS Backend   │
         │                     │
         │  ┌───────────────┐  │
         │  │ Auth Module   │  │
         │  │ User Module   │  │
         │  │ Prospect Mod. │  │
         │  │ Plan Module   │  │
         │  │ Visit Module  │  │
         │  │ Log Module    │  │
         │  │ Mail Module   │  │
         │  └───────────────┘  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │    PostgreSQL       │
         └─────────────────────┘
```

---

## API Tasarım Prensipleri

### Endpoint Yapısı
- Base: `/api/v1/`
- Resource-based: `/api/v1/prospects`, `/api/v1/visits`
- Nested ilişkiler: `/api/v1/route-plans/:id/items`
- Auth: `/api/v1/auth/login`, `/api/v1/auth/refresh`

### Response Standardı
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Zorunlu alanlar eksik",
    "details": [
      { "field": "company_name", "message": "Firma adı zorunludur" }
    ]
  }
}
```

---

## Güvenlik

### Authentication
- JWT access token (15dk ömür)
- JWT refresh token (7 gün ömür)
- Refresh token veritabanında saklanır
- Logout'ta refresh token silinir

### Authorization
- Role-based access control (RBAC)
- NestJS Guard'ları ile endpoint koruma
- Admin guard: `@Roles('admin')`
- Field user guard: `@Roles('field_user')`
- Owner guard: kullanıcı sadece kendi verisine erişebilir

### Genel
- HTTPS zorunlu (production)
- Rate limiting (login: 5 istek/15dk)
- Input sanitization
- SQL injection koruması (Prisma parameterized queries)
- CORS konfigürasyonu

---

## Deploy Stratejisi

### MVP (Başlangıç)
- **Backend:** Railway veya Render (free/hobby tier yeterli — 6 kullanıcı)
- **Web:** Vercel (Next.js native)
- **DB:** Supabase PostgreSQL (free tier) veya Railway PostgreSQL
- **Mobile:** Expo Go (geliştirme), EAS Build (production)

### Production (Sonrası)
- Backend: DigitalOcean App Platform veya VPS
- DB: Managed PostgreSQL
- Mobile: App Store / Google Play

---

## Monorepo Yapısı

Proje monorepo olarak yönetilecek (npm workspaces veya turborepo):

```
/field-crm
├── package.json          # Root package (workspaces tanımı)
├── /packages
│   └── /shared           # Ortak tipler, sabitler, validasyon
├── /apps
│   ├── /backend          # NestJS
│   ├── /web              # Next.js
│   └── /mobile           # Expo
└── /docs                 # Dokümanlar
```

**Neden monorepo?**
- Shared types ile frontend/backend tip tutarlılığı
- Tek git repo ile kolay yönetim
- Ortak validasyon kuralları paylaşımı

---

## Riskler ve Dikkat Edilecekler

| Risk | Önlem |
|------|-------|
| GPS doğrulama hassasiyeti cihazdan cihaza farklı | 200m tolerans + test |
| Offline senaryoda veri kaybı | MVP'de online zorunlu, Faz sonrası offline |
| JWT token çalınması | Secure storage, kısa ömürlü access token |
| Excel import'ta büyük dosya | Max 1000 satır limiti (MVP) |
| Mail gönderim hatası | 3x retry + error logging |
| Monorepo karmaşıklığı | Başlangıçta basit npm workspaces, gerekirse turborepo |

---

## MVP İçin Fazla Karmaşık, Sonraya Bırakılacaklar
- Real-time notification (WebSocket)
- Offline-first (service worker / local DB sync)
- Harita üzerinde rut optimizasyonu
- CI/CD pipeline (başlangıçta manuel deploy)
- Monitoring / APM
- Dış servis API entegrasyonu
