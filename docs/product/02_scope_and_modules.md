# Kapsam ve Modüller

## Genel Bakış
Field CRM uygulaması web, mobil ve backend olmak üzere 3 ana katmandan oluşur. Her katman modüler yapıda geliştirilecektir.

---

## A. Kimlik ve Yetki Modülü
- Kullanıcı girişi (email + şifre)
- Rol bazlı erişim kontrolü (RBAC)
- Admin / Saha Kullanıcısı ayrımı
- Oturum yönetimi (JWT)

## B. Potansiyel Müşteri Yönetimi
- Excel dosyası ile toplu import
- Dış servis entegrasyonu ile otomatik çekme (Faz 4)
- Müşteri kaydı doğrulama
- Duplicate (çift kayıt) tespiti
- Aktif / Pasif durum yönetimi
- Müşteri bilgileri: firma adı, yetkili kişi, telefon, adres, koordinat, sektör, notlar

## C. Planlama Motoru
- Haftalık rut planı oluşturma
- Kullanıcı bazlı müşteri atama (admin tarafından)
- Kullanıcının kendi planını düzenlemesi
- Planlanan ziyaret sıralaması
- Hafta bazlı plan geçmişi

## D. Mobil Ziyaret Yönetimi
- Planlı müşteri listesi görüntüleme
- Müşteri detay ve adres/harita bilgisi
- GPS bazlı ziyaret başlatma (200m tolerans)
- Ziyaret sonucu girişi
- Ziyaret sonlandırma
- Ziyaret süresi otomatik hesaplama

## E. Sonuç Yönetimi
- Görüşme sonucu seçimi:
  - ✅ Çalışmaya Yatkın
  - ⚖️ Nötr
  - ❌ Çalışmaya Yatkın Değil
- Opsiyonel not alanı
- Zaman damgası (başlangıç + bitiş)
- Kullanıcı damgası

## F. Log ve Audit
- Kim, ne zaman, ne yaptı kaydı
- Plan oluşturma / değiştirme logları
- Ziyaret başlatma / sonlandırma logları
- Excel import logları
- Mail gönderim logları

## G. Bildirim ve Mail
- Gün sonu toplu özet mail (her gün 18:00)
- Kullanıcı bazlı ziyaret özeti
- Sonuç bazlı dağılım
- Hata durumlarında admin'e bilgilendirme maili

## H. Raporlama (Faz 3-4)
- Planlanan vs gerçekleşen ziyaret sayısı
- Sonuç dağılımı (yatkın / nötr / değil)
- Kişi bazlı verimlilik
- Haftalık / aylık trend

---

## Modül-Platform Matrisi

| Modül | Web | Mobil | Backend |
|-------|-----|-------|---------|
| Kimlik ve Yetki | ✅ | ✅ | ✅ |
| Müşteri Yönetimi | ✅ | 🔍 (readonly) | ✅ |
| Planlama | ✅ | ✅ (düzenleme) | ✅ |
| Ziyaret Yönetimi | 🔍 (log görüntüleme) | ✅ | ✅ |
| Sonuç Yönetimi | 🔍 | ✅ | ✅ |
| Log ve Audit | ✅ | ❌ | ✅ |
| Mail | ❌ | ❌ | ✅ |
| Raporlama | ✅ | ❌ | ✅ |

---

## Web Modülleri (Admin Panel)
1. Login ekranı
2. Dashboard (özet metrikler)
3. Kullanıcı yönetimi
4. Potansiyel müşteri listesi
5. Excel import ekranı
6. Haftalık plan oluşturma / düzenleme
7. Ziyaret log görüntüleme
8. Rapor ekranı

## Mobil Modüller (Saha Uygulaması)
1. Login ekranı
2. Haftalık plan listesi (bugünkü ziyaretler önce)
3. Müşteri detay ekranı
4. Ziyaret başlat (GPS kontrollü)
5. Görüşme sonucu seçimi + not
6. Ziyaret sonlandır
7. Geçmiş ziyaretlerim

## Backend Modülleri
1. auth — kimlik doğrulama
2. users — kullanıcı CRUD
3. roles — rol ve yetki yönetimi
4. prospects — potansiyel müşteri CRUD
5. prospect-import — excel import servisi
6. route-plans — haftalık rut planı
7. visits — ziyaret yönetimi
8. visit-results — ziyaret sonuçları
9. gps-validation — konum doğrulama servisi
10. activity-logs — aktivite loglama
11. email-summary — gün sonu mail servisi

## Entegrasyon Modülleri (Faz 4)
1. prospect-integrations — dış servis ile müşteri çekme
2. integration-jobs — entegrasyon iş takibi
