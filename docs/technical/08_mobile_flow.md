# Mobil Saha Uygulaması Akış Dokümanı

## Genel Bakış
Mobil uygulama saha kullanıcıları (6 kişi) için tasarlanmıştır. React Native (Expo) ile geliştirilecektir. MVP'de online çalışma zorunludur.

---

## 1. Login Ekranı
**Amaç:** Saha kullanıcısının sisteme girişi
**Görünen veri:** Email ve şifre input
**Aksiyonlar:**
- Email + şifre ile giriş
- "Beni hatırla" seçeneği
- Hatalı giriş → hata mesajı
**Validation:**
- Boş alan kontrolü
- İnternet bağlantısı kontrolü

---

## 2. Ana Ekran — Bugünkü Plan
**Amaç:** Bugün ziyaret edilecek müşterileri listelemek
**Görünen veri:**
- Bugünün tarihi
- Planlı müşteri listesi (sıralı)
  - Her item: firma adı, yetkili kişi, adres kısaltması, durum badge'i
  - Durum renkleri: 🔵 Bekliyor, 🟡 Ziyaret ediliyor, 🟢 Tamamlandı, 🔴 Atlandı
- Bugünkü özet: X planlı / Y tamamlandı
**Aksiyonlar:**
- Müşteri detayına git
- Ziyaret başlat (sadece yakındaysa aktif)
- Haftalık plana geç
- Yenile (pull-to-refresh)

---

## 3. Haftalık Plan Ekranı
**Amaç:** Haftanın tüm planını görmek ve düzenlemek
**Görünen veri:**
- Hafta seçici
- Gün bazlı müşteri listesi (Pzt-Cum)
- Her gün: planlı müşteri sayısı, tamamlanan sayısı
**Aksiyonlar:**
- Gün seçerek o günün detayını görme
- Müşteri ekleme (atanmamış müşteriler listesinden)
- Müşteri çıkarma (ziyaret başlatılmamışsa)
- Sıra değiştirme
**Kısıtlar:**
- Geçmiş günler düzenlenemez
- Ziyaret başlatılmış müşteri çıkarılamaz

---

## 4. Müşteri Detay Ekranı
**Amaç:** Seçilen potansiyel müşterinin detaylarını görmek
**Görünen veri:**
- Firma adı
- Yetkili kişi
- Telefon (tıklanabilir — arama başlatır)
- Adres (tıklanabilir — harita açar)
- Sektör
- Notlar
- Son ziyaret bilgisi (varsa): tarih, sonuç, not
- Mesafe bilgisi (mevcut konumdan)
**Aksiyonlar:**
- Telefon ara
- Haritada göster (native maps açılır)
- Ziyaret başlat butonu

---

## 5. Ziyaret Başlatma
**Amaç:** GPS doğrulaması ile ziyareti başlatmak
**Akış:**
1. Kullanıcı "Ziyaret Başlat" butonuna basar
2. Sistem GPS konumunu alır
3. Müşteri koordinatı ile kullanıcı konumu karşılaştırılır
4. **Mesafe ≤ 200m** → Ziyaret başlar
5. **Mesafe > 200m** → Hata mesajı: "Müşteri konumuna yakın değilsiniz (Xm uzaktasınız)"

**GPS alınamıyorsa:**
- "Konum bilgisi alınamıyor. Lütfen konum servislerini açın." mesajı
- Ziyaret başlatılamaz

**Zaten aktif ziyaret varsa:**
- "Devam eden bir ziyaretiniz var. Önce mevcut ziyareti sonlandırın." mesajı

**Ziyaret başladığında:**
- Başlangıç zamanı kaydedilir
- GPS koordinatı kaydedilir
- Ekran "Aktif Ziyaret" moduna geçer
- Kronometrik süre sayacı başlar

---

## 6. Aktif Ziyaret Ekranı
**Amaç:** Devam eden ziyaretin yönetimi
**Görünen veri:**
- Müşteri bilgisi (firma adı, yetkili)
- Geçen süre (kronometrik)
- Başlangıç saati
**Aksiyonlar:**
- Görüşme sonucu seçimi (zorunlu):
  - ✅ Çalışmaya Yatkın
  - ⚖️ Nötr
  - ❌ Çalışmaya Yatkın Değil
- Not girişi (opsiyonel, text area)
- "Ziyareti Sonlandır" butonu
- "Ziyareti İptal Et" butonu

---

## 7. Ziyaret Sonlandırma
**Akış:**
1. Kullanıcı sonuç seçer (zorunlu)
2. Not girer (opsiyonel)
3. "Ziyareti Sonlandır" butonuna basar
4. Onay dialogu: "Ziyareti sonlandırmak istediğinize emin misiniz?"
5. Onay → bitiş zamanı ve GPS kaydedilir, süre hesaplanır
6. Başarılı → "Ziyaret kaydedildi" mesajı, ana ekrana dönüş

**Sonuç seçilmemişse:**
- "Lütfen görüşme sonucunu seçin" uyarısı
- Sonlandırma engellenir

---

## 8. Ziyaret İptal
**Akış:**
1. "Ziyareti İptal Et" butonuna basılır
2. İptal sebebi girişi (zorunlu, text input)
3. Onay dialogu
4. Onay → ziyaret "cancelled" olarak kaydedilir
5. Ana ekrana dönüş

---

## 9. Geçmiş Ziyaretlerim
**Amaç:** Kullanıcının geçmiş ziyaretlerini görmesi
**Görünen veri:**
- Liste: tarih, müşteri, sonuç badge, süre
- Tarih filtresi
**Aksiyonlar:**
- Ziyaret detay görüntüleme
- Filtreleme (tarih, sonuç)

---

## Navigasyon Yapısı (Bottom Tab)

```
Bottom Tabs:
├── 🏠 Bugün (ana ekran, bugünkü plan)
├── 📅 Haftalık Plan
├── 📋 Geçmiş
└── 👤 Profil
```

---

## Hata Senaryoları

| Senaryo | Davranış |
|---------|----------|
| İnternet yok | "İnternet bağlantısı yok" banner, işlemler engellenir |
| GPS kapalı | "Konum servisleri kapalı" uyarısı, ayarlara yönlendirme |
| GPS alınamıyor | "Konum alınamıyor, lütfen açık alanda deneyin" |
| Mesafe > 200m | "Müşteriye Xm uzaktasınız, yaklaşmanız gerekiyor" |
| Session timeout | Login ekranına yönlendirme |
| API hatası | "Bir hata oluştu, lütfen tekrar deneyin" + retry butonu |
| Aktif ziyaret varken uygulama kapanırsa | Sonraki girişte aktif ziyaret hatırlatması |

---

## Bildirimler (MVP Sonrası)
- Planlanan ziyaret saatinde push notification
- Yakındaki müşteri hatırlatması
- Gün sonu tamamlanmamış ziyaret uyarısı
