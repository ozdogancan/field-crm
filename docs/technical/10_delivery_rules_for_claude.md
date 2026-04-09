# Claude Code Geliştirme Kuralları

Bu doküman, Field CRM projesinde Claude Code ile çalışırken uyulması gereken kuralları tanımlar.

---

## 1. Çalışma Prensipleri

### 1.1 İteratif Geliştirme
- Her seferinde sadece istenen küçük parçayı ele al
- Büyük değişiklikleri küçük, yönetilebilir adımlara böl
- Her adım sonunda çalışır durumda kod bırak

### 1.2 Analiz Önce
- Kod yazmadan önce mevcut durumu analiz et
- Değişikliğin etki alanını belirle
- İş kurallarıyla uyumluluğu kontrol et

### 1.3 Modüler Çalışma
- Frontend, backend ve integration katmanlarını birbirine karıştırma
- Her modül kendi sorumluluğunu taşır
- Modül dışına taşma

---

## 2. Değişiklik Yönetimi

### 2.1 Mevcut Yapıyı Koruma
- **Kullanıcı açıkça istemedikçe mevcut çalışan yapıyı BOZMA**
- Çalışan kodu değiştirmeden önce neden değişmesi gerektiğini açıkla
- Breaking change varsa önceden bildir

### 2.2 Refactor Kuralları
- Refactor gerekiyorsa önce gerekçeni yaz
- Kullanıcı onayı olmadan refactor yapma
- Refactor sırasında yeni özellik ekleme
- Refactor sonrasında mevcut testlerin geçtiğinden emin ol

### 2.3 Dosya Değişiklik Disiplini
- Sadece ilgili dosyalarda değişiklik yap
- Gereksiz dosyalara dokunma
- Yeni dosya oluşturmadan önce mevcut yapıya uygun mu kontrol et
- Import/export zincirini kırma

---

## 3. İş Kurallarını Koruma

### 3.1 Kritik İş Kuralları (Asla Bozulmamalı)
- GPS doğrulama (200m tolerans)
- Aynı anda tek aktif ziyaret
- Sonuç seçimi zorunluluğu
- Geçmiş plan düzenleme yasağı
- Rol bazlı erişim kontrolü
- Log kayıtlarının append-only olması
- Gün sonu mail özet mantığı

### 3.2 Kural Kontrolü
- Her değişiklikte ilgili iş kurallarını kontrol et
- 04_business_rules.md ile uyumluluğu doğrula
- İş kuralı değişikliği gerekiyorsa önce dokümanı güncelle

---

## 4. Kod Standardı

### 4.1 Genel
- TypeScript kullan (strict mode)
- ESLint + Prettier konfigürasyonu
- Anlamlı değişken ve fonksiyon isimleri (İngilizce)
- Yorum satırları İngilizce

### 4.2 Backend (NestJS)
- Controller → Service → Repository katmanlama
- DTO validation (class-validator)
- Guard'lar ile yetki kontrolü
- Her endpoint için error handling
- API response standardı: { success, data, error, message }

### 4.3 Frontend Web (Next.js)
- App Router kullan
- Server/Client component ayrımı
- Form validation (react-hook-form + zod)
- Loading ve error state'leri
- Responsive tasarım

### 4.4 Frontend Mobile (Expo/React Native)
- Fonksiyonel component'ler
- Custom hook'lar ile business logic ayrımı
- Platform-specific kod minimum
- GPS ve konum servisleri için abstraction layer

---

## 5. Test ve Doğrulama

### 5.1 Test Beklentileri
- Kritik iş kuralları için unit test zorunlu
- API endpoint'leri için integration test
- GPS doğrulama için mock test
- Test yazmadan "tamamlandı" deme

### 5.2 Doğrulama Adımları
- Kod derleniyor mu? (TypeScript hatası yok mu?)
- Mevcut testler geçiyor mu?
- Yeni testler yazıldı mı?
- İş kurallarına uygun mu?

---

## 6. Dosya ve Klasör Düzeni

```
/field-crm
├── /docs                    # Proje dokümanları
│   ├── /product            # Ürün dokümanları
│   ├── /technical          # Teknik dokümanlar
│   ├── /features           # Feature bazlı dokümanlar
│   └── /decisions          # Mimari karar kayıtları
├── /backend                 # NestJS backend
│   ├── /src
│   │   ├── /auth           # Kimlik doğrulama
│   │   ├── /users          # Kullanıcı yönetimi
│   │   ├── /prospects      # Müşteri yönetimi
│   │   ├── /route-plans    # Haftalık planlama
│   │   ├── /visits         # Ziyaret yönetimi
│   │   ├── /activity-logs  # Loglama
│   │   ├── /email-summary  # Mail servisi
│   │   ├── /common         # Ortak modüller
│   │   └── /config         # Konfigürasyon
│   └── /prisma             # Veritabanı şeması
├── /web                     # Next.js admin panel
│   ├── /app
│   │   ├── /dashboard
│   │   ├── /prospects
│   │   ├── /planning
│   │   ├── /visits
│   │   ├── /users
│   │   └── /settings
│   └── /components
├── /mobile                  # Expo React Native
│   ├── /app
│   │   ├── /(auth)
│   │   ├── /(tabs)
│   │   └── /visit
│   ├── /components
│   ├── /hooks
│   └── /services
└── /shared                  # Ortak tipler ve sabitler
    ├── /types
    └── /constants
```

---

## 7. Görev Kapanış Formatı

Her görev tamamlandığında aşağıdaki formatla rapor ver:

```
## Yapılanlar
- [değişiklik 1]
- [değişiklik 2]

## Değişen Dosyalar
- path/to/file1.ts — [ne değişti]
- path/to/file2.ts — [ne değişti]

## İş Kurallarına Etkisi
- [etkilenen kural ve nasıl etkilendiği]
- veya "İş kurallarına etkisi yok"

## Riskler
- [varsa risk]
- veya "Bilinen risk yok"

## Sonraki En Mantıklı Adım
- [önerilen sonraki görev]
```

---

## 8. Belirsizlik Yönetimi
- Belirsiz durumlarda en mantıklı varsayımı yap
- Varsayımı açıkça belirt: "VARSAYIM: ..."
- Kullanıcıya doğrulatılması gereken noktaları listele
- Kritik belirsizliklerde kod yazmadan önce sor
