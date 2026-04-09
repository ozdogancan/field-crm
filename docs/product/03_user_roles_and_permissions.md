# Kullanıcı Rolleri ve Yetki Matrisi

## Roller

### 1. Admin (Merkez Kullanıcı)
- Sistemi yönetir
- Potansiyel müşteri verisini yükler
- Kullanıcıları oluşturur ve yönetir
- Haftalık planları görür ve müdahale edebilir
- Tüm ziyaret loglarını ve raporları görür
- Mail ayarlarını yönetir

### 2. Saha Kullanıcısı (Field User)
- Sadece kendisine atanmış verileri görür
- Kendi haftalık rut planını oluşturur / düzenler
- Mobil uygulamada planlı müşterilerini görür
- GPS doğrulaması ile ziyaret başlatır
- Görüşme sonucu girer
- Ziyareti sonlandırır
- Kendi geçmiş ziyaretlerini görür

### 3. Mail Alıcısı / Yönetici (Report Viewer)
- Doğrudan sisteme giriş yapmaz (MVP'de)
- Gün sonu toplu özet mailini alır
- İleride read-only dashboard erişimi verilebilir

---

## Yetki Matrisi

| Aksiyon | Admin | Saha Kullanıcısı | Mail Alıcısı |
|---------|-------|-------------------|--------------|
| **Kimlik & Yetki** | | | |
| Sisteme giriş | ✅ | ✅ | ❌ |
| Kullanıcı oluşturma | ✅ | ❌ | ❌ |
| Kullanıcı düzenleme | ✅ | ❌ | ❌ |
| Kullanıcı silme/deaktif etme | ✅ | ❌ | ❌ |
| Kendi profilini düzenleme | ✅ | ✅ | ❌ |
| **Müşteri Yönetimi** | | | |
| Müşteri listesi görüntüleme | ✅ (tümü) | ✅ (atananlar) | ❌ |
| Müşteri ekleme (tekil) | ✅ | ❌ | ❌ |
| Excel ile toplu import | ✅ | ❌ | ❌ |
| Müşteri düzenleme | ✅ | ❌ | ❌ |
| Müşteri silme/deaktif etme | ✅ | ❌ | ❌ |
| **Planlama** | | | |
| Tüm planları görme | ✅ | ❌ | ❌ |
| Kendi planını görme | ✅ | ✅ | ❌ |
| Plan oluşturma (kendi için) | ❌ | ✅ | ❌ |
| Plan oluşturma (başkası için) | ✅ | ❌ | ❌ |
| Plan düzenleme (kendi) | ✅ | ✅ | ❌ |
| Plan düzenleme (başkası) | ✅ | ❌ | ❌ |
| Müşteri atama (plana ekleme) | ✅ | ✅ (kendi) | ❌ |
| **Ziyaret Yönetimi** | | | |
| Ziyaret başlatma | ❌ | ✅ (GPS ile) | ❌ |
| Ziyaret sonucu girme | ❌ | ✅ | ❌ |
| Ziyaret sonlandırma | ❌ | ✅ | ❌ |
| Tüm ziyaret loglarını görme | ✅ | ❌ | ❌ |
| Kendi ziyaret loglarını görme | ✅ | ✅ | ❌ |
| **Raporlama** | | | |
| Dashboard görme | ✅ | ❌ | ❌ |
| Rapor oluşturma | ✅ | ❌ | ❌ |
| Mail özeti alma | ✅ | ❌ | ✅ |
| **Sistem** | | | |
| Log görüntüleme | ✅ | ❌ | ❌ |
| Mail ayarları | ✅ | ❌ | ❌ |
| Import geçmişi | ✅ | ❌ | ❌ |

---

## Veri Erişim Kuralları

### Admin
- Tüm kullanıcıların verilerini görür
- Tüm müşterileri görür
- Tüm planları ve ziyaretleri görür

### Saha Kullanıcısı
- Sadece kendisine atanmış müşterileri görür
- Sadece kendi planını görür ve düzenler
- Sadece kendi ziyaretlerini görür
- Başka kullanıcının verisine erişemez

### Güvenlik Kuralları
- Her API isteğinde JWT token kontrolü
- Role-based middleware ile yetki kontrolü
- Saha kullanıcısı sadece kendi user_id'si ile eşleşen verilere erişebilir
- Admin dışında hiçbir rol kullanıcı yönetimi yapamaz
