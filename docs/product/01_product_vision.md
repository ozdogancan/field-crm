# Ürün Vizyonu — Field CRM

## Amaç
Sahadaki potansiyel müşterileri sisteme alıp, 6 saha çalışanının haftalık rut planına dahil etmek. Mobil uygulama üzerinden bu müşterileri ziyaret ettirmek, ziyaret sonucunu kayıt altına almak ve gün sonunda belirlenen kişiye toplu mail göndermek.

## Hedef Kullanıcılar
1. **Admin / Merkez Kullanıcı** — Potansiyel müşteri verisini yükler, servis entegrasyonunu yönetir, kullanıcıları ve planları takip eder, log ve raporları görür
2. **Saha Kullanıcısı (6 kişi)** — Kendi haftalık rut planını oluşturur/düzenler, mobilde planlı potansiyel müşterileri görür, noktadaysa ziyaret başlatır, görüşme sonucunu girer, ziyareti kapatır
3. **Mail Alıcısı / Yönetici** — Gün sonu toplu özet mail alır

## Temel Problem
Saha ekiplerinin potansiyel müşteri ziyaretlerinin takibi manuel yapılıyor, ziyaret sonuçları kaybolabiliyor, raporlama gecikiyor.

## Çözüm Yaklaşımı
- Web tabanlı admin panel ile müşteri verisi yönetimi ve planlama
- Mobil uygulama ile saha ziyaret yönetimi (GPS doğrulamalı)
- Otomatik loglama ve gün sonu mail özeti

## MVP Kapsamı
- Kullanıcı girişi ve rol yönetimi (admin + saha)
- Excel ile potansiyel müşteri import
- Haftalık rut planı oluşturma ve düzenleme
- Mobilde plan görüntüleme ve ziyaret yönetimi
- GPS doğrulamalı ziyaret başlatma
- Görüşme sonucu girişi (yatkın / nötr / yatkın değil)
- Ziyaret loglama
- Gün sonu toplu mail özeti

## MVP Dışı (Sonraki Fazlar)
- Dış servis (API) ile otomatik müşteri çekme
- Offline-first mobil deneyim
- Gelişmiş raporlama ve dashboard
- Push notification
- Müşteri segmentasyonu
- Performans skorlama
- Harita üzerinde rut optimizasyonu

## Riskler ve Belirsizlikler
- GPS doğrulama hassasiyeti (kaç metre tolerans?)  → Varsayım: 200m
- Offline senaryoda ne olacak? → MVP'de online zorunlu, sonraki fazda offline
- Excel format standardı? → Varsayım: belirli sütun yapısında .xlsx
- Mail gönderim saati? → Varsayım: her gün 18:00
- Bir müşteri birden fazla kullanıcıya atanabilir mi? → Varsayım: hayır, tek kullanıcıya atanır
