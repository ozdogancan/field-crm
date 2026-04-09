# CLAUDE.md — Field CRM Proje Kuralları

## Proje Özeti
Sahadaki potansiyel müşterileri yönetmek için web (admin) + mobil (saha) CRM uygulaması.
6 saha kullanıcısı, haftalık rut planı, GPS doğrulamalı ziyaret, gün sonu mail özeti.

## Teknoloji Stack
- **Backend:** NestJS + Prisma + PostgreSQL
- **Web:** Next.js 15 (App Router) + shadcn/ui + Tailwind
- **Mobile:** Expo (React Native) + expo-location
- **Shared:** TypeScript, monorepo (npm workspaces)
- **Auth:** JWT (access + refresh token)
- **Mail:** Nodemailer/Resend + @nestjs/schedule

## Geliştirme Kuralları

### Temel Prensipler
- İteratif geliştirme — her seferinde sadece istenen küçük parçayı ele al
- Mevcut çalışan yapıyı kullanıcı açıkça istemedikçe **BOZMA**
- Frontend, backend, mobile katmanlarını birbirine karıştırma
- Refactor gerekiyorsa önce gerekçe yaz, onay bekle

### İş Kuralları (Asla Bozulmamalı)
- GPS doğrulama: 200m tolerans
- Aynı anda tek aktif ziyaret
- Görüşme sonucu seçimi zorunlu (yatkın / nötr / değil)
- Geçmiş hafta planları düzenlenemez
- Ziyaret başlatılmış müşteri plandan çıkarılamaz
- Bir müşteri aynı hafta tek kullanıcıya atanabilir
- Log kayıtları append-only (silinemez, düzenlenemez)
- Gün sonu mail 18:00'de gönderilir, max 3 retry

### Kod Standardı
- TypeScript strict mode
- Backend: Controller → Service → Repository katmanlama
- API response: `{ success, data, error, message }`
- Anlamlı değişken/fonksiyon isimleri (İngilizce)
- Her modül kendi klasöründe izole

### Görev Tamamlama Formatı
Her görev sonunda şu başlıklarla rapor ver:
1. Yapılanlar
2. Değişen dosyalar
3. İş kurallarına etkisi
4. Riskler
5. Sonraki en mantıklı adım

## Doküman Referansları
Detaylı kurallar ve tasarım `/docs` klasöründe:
- `/docs/product/` — Ürün vizyonu, kapsam, roller, iş kuralları
- `/docs/technical/` — Veri modeli, akışlar, mimari, geliştirme kuralları
- `/docs/features/` — Feature bazlı detay dokümanları
- `/docs/decisions/` — Mimari karar kayıtları (ADR)

## Klasör Yapısı
```
/field-crm
├── /docs                # Proje dokümanları
├── /apps
│   ├── /backend         # NestJS API
│   ├── /web             # Next.js admin panel
│   └── /mobile          # Expo saha uygulaması
├── /packages
│   └── /shared          # Ortak tipler ve sabitler
└── CLAUDE.md            # Bu dosya
```

## Sprint Planı
- Sprint 1: Auth + User/Role + Prospect model + Excel import + Prospect listeleme (web)
- Sprint 2: Haftalık plan modeli + Plan ekranı (web) + Plan listeleme (mobil)
- Sprint 3: GPS doğrulama + Ziyaret başlat/sonlandır + Log kaydı
- Sprint 4: Gün sonu mail + Dashboard + Temel raporlama
