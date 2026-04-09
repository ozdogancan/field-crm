# İş Kuralları

Bu doküman uygulamanın tüm iş kurallarını tanımlar. Geliştirme sırasında bu kurallara uyulması zorunludur.

---

## 1. Potansiyel Müşteri Kuralları

### 1.1 Müşteri Sisteme Alım
- Müşteri Excel (.xlsx) ile veya API entegrasyonu ile alınır
- Zorunlu alanlar: firma_adi, yetkili_kisi, telefon, adres, enlem, boylam
- Opsiyonel alanlar: email, sektor, notlar
- Enlem/boylam olmadan müşteri ziyaret planına eklenemez

### 1.2 Duplicate Kontrolü
- Aynı firma_adi + telefon kombinasyonu duplicate sayılır
- Import sırasında duplicate kayıtlar atlanır ve import loguna yazılır
- Admin duplicate listesini görebilir ve manuel birleştirebilir (Faz 4)

### 1.3 Müşteri Durumları
- **Aktif**: Planlamaya ve ziyarete açık
- **Pasif**: Deaktif edilmiş, planlara dahil edilemez
- **Ziyaret Edildi**: En az bir ziyaret tamamlanmış (aktif kalır)

---

## 2. Haftalık Rut Planı Kuralları

### 2.1 Plan Oluşturma
- Her plan bir kullanıcıya ve bir haftaya aittir (yıl + hafta numarası)
- Bir kullanıcının bir haftada tek planı olabilir
- Plan, potansiyel müşterilerin listesini ve ziyaret sırasını içerir
- Admin herkes için plan oluşturabilir
- Saha kullanıcısı sadece kendi planını oluşturabilir

### 2.2 Plan Düzenleme
- Saha kullanıcısı kendi planına müşteri ekleyebilir / çıkarabilir
- Saha kullanıcısı ziyaret sırasını değiştirebilir
- Admin herkesin planını düzenleyebilir
- Ziyaret başlatılmış bir müşteri plandan çıkarılamaz
- Geçmiş haftaların planları düzenlenemez (readonly)

### 2.3 Müşteri Atama
- Bir müşteri aynı hafta içinde sadece bir kullanıcıya atanabilir
- Farklı haftalarda aynı müşteri farklı kullanıcılara atanabilir
- Pasif müşteriler plana eklenemez

---

## 3. Ziyaret Kuralları

### 3.1 Ziyaret Başlatma
- Ziyaret başlatmak için kullanıcının müşteri konumuna yakın olması ZORUNLU
- GPS toleransı: **200 metre**
- GPS konumu alınamıyorsa ziyaret başlatılamaz
- Kullanıcının aynı anda sadece 1 aktif ziyareti olabilir
- Önceki ziyaret sonlandırılmadan yeni ziyaret başlatılamaz

### 3.2 Ziyaret Süreci
- Ziyaret başladığında başlangıç zamanı ve GPS koordinatı kaydedilir
- Ziyaret sırasında kullanıcı görüşme sonucunu seçer
- Görüşme sonucu seçenekleri:
  - **Çalışmaya Yatkın**: Müşteri ilgili, iş birliği potansiyeli var
  - **Nötr**: Belirsiz, tekrar ziyaret gerekebilir
  - **Çalışmaya Yatkın Değil**: Müşteri ilgisiz veya uygun değil
- Görüşme sonucu seçimi **zorunlu**
- Not girişi **opsiyonel**

### 3.3 Ziyaret Sonlandırma
- Sonuç seçilmeden ziyaret sonlandırılamaz
- Sonlandırma anında bitiş zamanı ve GPS koordinatı kaydedilir
- Ziyaret süresi otomatik hesaplanır (bitiş - başlangıç)
- Sonlandırma sonrası ziyaret düzenlenemez

### 3.4 Ziyaret Durumları
- **Başlatıldı**: Ziyaret devam ediyor
- **Tamamlandı**: Sonuç girildi ve sonlandırıldı
- **İptal**: Kullanıcı ziyareti iptal etti (sebep zorunlu)

---

## 4. Loglama Kuralları

### 4.1 Log Oluşturma Zamanları
- Kullanıcı girişi / çıkışı
- Müşteri oluşturma / düzenleme / silme
- Excel import başlangıç / bitiş / hata
- Plan oluşturma / düzenleme
- Ziyaret başlatma / sonlandırma / iptal
- Mail gönderim başarı / hata

### 4.2 Log İçeriği
- Tarih/saat
- Kullanıcı ID ve adı
- Aksiyon tipi
- Etkilenen kayıt (entity_type + entity_id)
- Önceki değer (değişiklik varsa)
- Yeni değer
- IP adresi (web) veya cihaz bilgisi (mobil)

---

## 5. Mail Kuralları

### 5.1 Gün Sonu Özet Mail
- Her gün saat **18:00**'de gönderilir
- Alıcı: admin tarafından belirlenen mail adresi (veya adresleri)
- İçerik:
  - Tarih
  - Kullanıcı bazlı ziyaret özeti
  - Toplam planlanan ziyaret sayısı
  - Toplam gerçekleşen ziyaret sayısı
  - Sonuç dağılımı (yatkın / nötr / değil)
  - Ziyaret edilmeyen müşteriler listesi
- Mail gönderim başarısı/hatası loglanır

### 5.2 Mail Retry
- Gönderim başarısız olursa 3 kez dener (5dk aralıkla)
- 3 deneme sonrası hata logu oluşturulur
- Admin bilgilendirilir

---

## 6. Varsayımlar ve Kararlar

| Konu | Varsayım | Değiştirilebilir? |
|------|----------|-------------------|
| GPS toleransı | 200 metre | Evet, admin ayarı yapılabilir |
| Mail gönderim saati | 18:00 | Evet, admin ayarı |
| Offline çalışma | MVP'de yok | Faz sonrasında |
| Müşteri başına tek kullanıcı/hafta | Evet | İş kuralı |
| Sonuç seçimi zorunlu | Evet | İş kuralı |
| Not alanı opsiyonel | Evet | İş kuralı |
| Aynı anda tek ziyaret | Evet | İş kuralı |
| Geçmiş plan düzenleme | Hayır | İş kuralı |
| Ziyaret sonrası düzenleme | Hayır | İş kuralı |
