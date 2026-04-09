# Veri Modeli

## Genel Bakış
Bu doküman Field CRM uygulamasının veritabanı tasarımını tanımlar. PostgreSQL kullanılacak, ORM olarak Prisma tercih edilecektir.

---

## Entity İlişki Özeti

```
users ──< weekly_route_plans ──< route_plan_items >── prospects
users ──< visits >── prospects
visits ──< visit_results
prospects ──< prospect_import_batches (via import_batch_id)
users ──< activity_logs
email_dispatch_logs (bağımsız)
```

---

## Tablolar

### 1. users
Sistem kullanıcıları (admin + saha).

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| email | VARCHAR(255) | ✅ | Unique, login için |
| password_hash | VARCHAR(255) | ✅ | Bcrypt hash |
| full_name | VARCHAR(255) | ✅ | Ad soyad |
| role | ENUM('admin','field_user') | ✅ | Kullanıcı rolü |
| phone | VARCHAR(20) | ❌ | Telefon |
| is_active | BOOLEAN | ✅ | Default: true |
| created_at | TIMESTAMP | ✅ | Oluşturma tarihi |
| updated_at | TIMESTAMP | ✅ | Güncelleme tarihi |

**İş kuralı:** Admin kullanıcılar saha ziyareti yapamaz. Saha kullanıcıları admin paneline erişemez.

---

### 2. prospects
Potansiyel müşteriler.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| company_name | VARCHAR(255) | ✅ | Firma adı |
| contact_person | VARCHAR(255) | ✅ | Yetkili kişi |
| phone | VARCHAR(20) | ✅ | Telefon |
| email | VARCHAR(255) | ❌ | Email |
| address | TEXT | ✅ | Açık adres |
| latitude | DECIMAL(10,7) | ✅ | Enlem |
| longitude | DECIMAL(10,7) | ✅ | Boylam |
| sector | VARCHAR(100) | ❌ | Sektör |
| notes | TEXT | ❌ | Notlar |
| status | ENUM('active','passive','visited') | ✅ | Default: active |
| import_batch_id | UUID | ❌ | FK → prospect_import_batches |
| created_at | TIMESTAMP | ✅ | |
| updated_at | TIMESTAMP | ✅ | |

**Unique constraint:** (company_name, phone) — duplicate kontrolü için.
**İş kuralı:** latitude/longitude olmadan müşteri plana eklenemez.

---

### 3. prospect_import_batches
Excel import işlem kayıtları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| file_name | VARCHAR(255) | ✅ | Yüklenen dosya adı |
| uploaded_by | UUID | ✅ | FK → users |
| total_rows | INT | ✅ | Toplam satır sayısı |
| success_count | INT | ✅ | Başarılı import sayısı |
| error_count | INT | ✅ | Hatalı satır sayısı |
| duplicate_count | INT | ✅ | Duplicate sayısı |
| status | ENUM('processing','completed','failed') | ✅ | |
| error_details | JSONB | ❌ | Hata detayları (satır no, hata mesajı) |
| created_at | TIMESTAMP | ✅ | |

**İş kuralı:** Her import batch'i loglanır. Hatalı satırlar detaylı kaydedilir.

---

### 4. weekly_route_plans
Haftalık rut planları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| user_id | UUID | ✅ | FK → users |
| year | INT | ✅ | Yıl (2026) |
| week_number | INT | ✅ | Hafta numarası (1-53) |
| status | ENUM('draft','active','completed') | ✅ | Default: draft |
| created_at | TIMESTAMP | ✅ | |
| updated_at | TIMESTAMP | ✅ | |

**Unique constraint:** (user_id, year, week_number) — kullanıcı başına haftalık tek plan.
**İş kuralı:** Geçmiş haftaların planları düzenlenemez.

---

### 5. route_plan_items
Plan içindeki müşteri atamaları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| plan_id | UUID | ✅ | FK → weekly_route_plans |
| prospect_id | UUID | ✅ | FK → prospects |
| visit_order | INT | ✅ | Ziyaret sırası |
| planned_date | DATE | ❌ | Planlanan gün |
| status | ENUM('pending','visited','skipped') | ✅ | Default: pending |
| created_at | TIMESTAMP | ✅ | |

**Unique constraint:** (plan_id, prospect_id) — aynı müşteri plana iki kez eklenemez.
**İş kuralı:** Ziyaret başlatılmış item plandan çıkarılamaz.

---

### 6. visits
Ziyaret kayıtları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| user_id | UUID | ✅ | FK → users |
| prospect_id | UUID | ✅ | FK → prospects |
| route_plan_item_id | UUID | ❌ | FK → route_plan_items |
| start_time | TIMESTAMP | ✅ | Ziyaret başlangıcı |
| end_time | TIMESTAMP | ❌ | Ziyaret bitişi |
| start_latitude | DECIMAL(10,7) | ✅ | Başlangıç GPS |
| start_longitude | DECIMAL(10,7) | ✅ | Başlangıç GPS |
| end_latitude | DECIMAL(10,7) | ❌ | Bitiş GPS |
| end_longitude | DECIMAL(10,7) | ❌ | Bitiş GPS |
| result | ENUM('positive','neutral','negative') | ❌ | Sonuç |
| result_notes | TEXT | ❌ | Görüşme notu |
| status | ENUM('started','completed','cancelled') | ✅ | Default: started |
| cancel_reason | TEXT | ❌ | İptal sebebi |
| duration_minutes | INT | ❌ | Otomatik hesaplanan süre |
| created_at | TIMESTAMP | ✅ | |

**İş kuralı:** 
- result → positive = Çalışmaya Yatkın, neutral = Nötr, negative = Çalışmaya Yatkın Değil
- Tamamlanmadan sonuç zorunlu
- Aynı anda tek aktif ziyaret

---

### 7. activity_logs
Audit trail.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| user_id | UUID | ✅ | FK → users |
| action | VARCHAR(50) | ✅ | Aksiyon tipi |
| entity_type | VARCHAR(50) | ✅ | Etkilenen tablo |
| entity_id | UUID | ❌ | Etkilenen kayıt |
| old_value | JSONB | ❌ | Önceki değer |
| new_value | JSONB | ❌ | Yeni değer |
| metadata | JSONB | ❌ | IP, cihaz bilgisi vb. |
| created_at | TIMESTAMP | ✅ | |

**İş kuralı:** Log kayıtları silinemez ve düzenlenemez (append-only).

---

### 8. email_dispatch_logs
Mail gönderim kayıtları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| dispatch_date | DATE | ✅ | Gönderim tarihi |
| recipient_email | VARCHAR(255) | ✅ | Alıcı |
| subject | VARCHAR(255) | ✅ | Konu |
| content_summary | JSONB | ✅ | Özet içerik (JSON) |
| status | ENUM('sent','failed','retrying') | ✅ | |
| retry_count | INT | ✅ | Default: 0 |
| error_message | TEXT | ❌ | Hata mesajı |
| sent_at | TIMESTAMP | ❌ | Gönderim zamanı |
| created_at | TIMESTAMP | ✅ | |

**İş kuralı:** Max 3 retry, 5dk aralıkla.

---

### 9. app_settings
Uygulama ayarları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| id | UUID | ✅ | PK |
| key | VARCHAR(100) | ✅ | Unique, ayar anahtarı |
| value | TEXT | ✅ | Ayar değeri |
| description | VARCHAR(255) | ❌ | Açıklama |
| updated_at | TIMESTAMP | ✅ | |

**Örnek ayarlar:**
- `gps_tolerance_meters` → 200
- `email_summary_time` → 18:00
- `email_recipients` → ["yonetici@firma.com"]
- `max_retry_count` → 3

---

## MVP Zorunlu Tablolar
- users, prospects, weekly_route_plans, route_plan_items, visits, activity_logs, email_dispatch_logs, app_settings

## Sonraki Fazlar İçin
- prospect_import_batches (Faz 1 sonunda)
- integration_jobs tablosu (Faz 4 — dış servis entegrasyonu)
- notifications tablosu (push notification eklenirse)

---

## İndeksler (Performans)
- prospects: (company_name, phone), (status), (latitude, longitude)
- weekly_route_plans: (user_id, year, week_number)
- visits: (user_id, status), (prospect_id), (created_at)
- activity_logs: (user_id), (entity_type, entity_id), (created_at)
- email_dispatch_logs: (dispatch_date), (status)
