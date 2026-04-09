# Web Admin Akış Dokümanı

## Genel Bakış
Web uygulaması admin kullanıcılar için tasarlanmıştır. Next.js App Router ile geliştirilecektir.

---

## 1. Login Ekranı
**Amaç:** Sisteme giriş
**Görünen veri:** Email ve şifre input alanları
**Aksiyonlar:**
- Email + şifre ile giriş
- Hatalı giriş durumunda hata mesajı
**Validation:**
- Email formatı kontrolü
- Boş alan kontrolü
- 5 başarısız denemeden sonra 15dk bekleme

---

## 2. Dashboard
**Amaç:** Günlük ve haftalık özet metrikleri görmek
**Görünen veri:**
- Bugünkü toplam planlanan ziyaret sayısı
- Bugünkü tamamlanan ziyaret sayısı
- Sonuç dağılımı (yatkın / nötr / değil) — pasta grafik
- Kullanıcı bazlı performans tablosu
- Son 7 günlük trend
**Aksiyonlar:**
- Tarih filtresi
- Kullanıcı filtresi
- Detay sayfalarına yönlendirme

---

## 3. Kullanıcı Yönetimi
**Amaç:** Saha kullanıcılarını oluşturmak ve yönetmek
**Görünen veri:**
- Kullanıcı listesi (ad, email, rol, durum)
**Aksiyonlar:**
- Yeni kullanıcı oluştur (ad, email, şifre, rol, telefon)
- Kullanıcı düzenle
- Kullanıcı aktif/pasif yap
**Validation:**
- Email unique kontrolü
- Şifre min 8 karakter
- Rol seçimi zorunlu

---

## 4. Potansiyel Müşteri Listesi
**Amaç:** Tüm potansiyel müşterileri görmek ve yönetmek
**Görünen veri:**
- Tablo: firma adı, yetkili, telefon, adres, sektör, durum, son ziyaret tarihi
**Aksiyonlar:**
- Arama (firma adı, yetkili, telefon)
- Filtreleme (durum, sektör)
- Sıralama
- Müşteri detay görüntüleme
- Müşteri düzenleme
- Müşteri aktif/pasif yapma
- Tekil müşteri ekleme
**Validation:**
- Zorunlu alanlar: firma_adi, yetkili_kisi, telefon, adres, enlem, boylam
- Duplicate uyarısı (aynı firma + telefon)

---

## 5. Excel Import Ekranı
**Amaç:** Toplu müşteri verisi yüklemek
**Görünen veri:**
- Dosya yükleme alanı
- Şablon indirme linki
- Son import geçmişi tablosu (tarih, dosya adı, toplam/başarılı/hatalı/duplicate)
**Aksiyonlar:**
- .xlsx dosya seçimi ve yükleme
- Yükleme öncesi önizleme (ilk 10 satır)
- Import başlat
- Import sonucu görüntüleme (başarılı/hatalı/duplicate detayı)
- Şablon dosyası indirme
**Hata senaryoları:**
- Yanlış format → dosya reddedilir, format hatası gösterilir
- Eksik zorunlu alan → satır atlanır, hata loglanır
- Duplicate → satır atlanır, duplicate loglanır
- Geçersiz koordinat → satır atlanır, hata loglanır

---

## 6. Haftalık Plan Ekranı
**Amaç:** Kullanıcılar için haftalık rut planı oluşturmak ve düzenlemek
**Görünen veri:**
- Hafta seçici (yıl + hafta)
- Kullanıcı seçici (dropdown)
- Sol panel: atanmamış müşteriler listesi
- Sağ panel: seçili kullanıcının haftalık planı (gün bazlı)
- Her plan item: müşteri adı, adres, sıra no
**Aksiyonlar:**
- Hafta ve kullanıcı seçimi
- Müşteri listesinden plana sürükle-bırak veya ekle butonu
- Plan içinde sıra değiştirme
- Plan item silme (ziyaret başlatılmamışsa)
- Planlanan güne müşteri atama
- Plan kaydet
**Validation:**
- Aynı müşteri aynı hafta başka kullanıcıda mı kontrol
- Pasif müşteri plana eklenemez
- Geçmiş hafta planı düzenlenemez

---

## 7. Ziyaret Log Ekranı
**Amaç:** Tüm ziyaret kayıtlarını görmek
**Görünen veri:**
- Tablo: tarih, kullanıcı, müşteri, başlangıç saati, bitiş saati, süre, sonuç, not
**Aksiyonlar:**
- Tarih aralığı filtresi
- Kullanıcı filtresi
- Sonuç filtresi (yatkın / nötr / değil)
- Excel'e export
- Detay görüntüleme (GPS koordinatları dahil)

---

## 8. Aktivite Log Ekranı
**Amaç:** Sistem genelinde yapılan aksiyonları izlemek
**Görünen veri:**
- Tablo: tarih/saat, kullanıcı, aksiyon, etkilenen kayıt, detay
**Aksiyonlar:**
- Tarih filtresi
- Kullanıcı filtresi
- Aksiyon tipi filtresi
- Detay görüntüleme

---

## 9. Mail Ayarları
**Amaç:** Gün sonu mail ayarlarını yönetmek
**Görünen veri:**
- Alıcı email adresleri listesi
- Gönderim saati
- Son gönderim logları
**Aksiyonlar:**
- Alıcı ekleme / çıkarma
- Gönderim saati değiştirme
- Manuel mail tetikleme (test)
- Mail log görüntüleme

---

## Navigasyon Yapısı

```
Sidebar:
├── Dashboard
├── Müşteriler
│   ├── Liste
│   └── Excel Import
├── Planlama
│   └── Haftalık Plan
├── Ziyaretler
│   └── Ziyaret Logları
├── Sistem
│   ├── Kullanıcılar
│   ├── Aktivite Logları
│   └── Mail Ayarları
└── Çıkış
```
