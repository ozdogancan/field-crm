import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const adapter = new PrismaPg(process.env.DIRECT_URL || process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fieldcrm.com' },
    update: {},
    create: {
      email: 'admin@fieldcrm.com',
      passwordHash: adminHash,
      fullName: 'Admin Kullanıcı',
      role: 'admin',
      phone: '+905551000001',
      isActive: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 6 field users
  const fieldHash = await bcrypt.hash('saha1234', 10);
  const fieldUsers = [
    { name: 'Ahmet Yılmaz', email: 'ahmet@fieldcrm.com', phone: '+905551000002' },
    { name: 'Mehmet Demir', email: 'mehmet@fieldcrm.com', phone: '+905551000003' },
    { name: 'Ayşe Kaya', email: 'ayse@fieldcrm.com', phone: '+905551000004' },
    { name: 'Fatma Çelik', email: 'fatma@fieldcrm.com', phone: '+905551000005' },
    { name: 'Ali Öztürk', email: 'ali@fieldcrm.com', phone: '+905551000006' },
    { name: 'Zeynep Arslan', email: 'zeynep@fieldcrm.com', phone: '+905551000007' },
  ];

  for (const u of fieldUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: fieldHash,
        fullName: u.name,
        role: 'field_user',
        phone: u.phone,
        isActive: true,
      },
    });
    console.log(`✅ Field user: ${user.fullName}`);
  }

  // Sample prospects (Istanbul)
  const prospects = [
    { company: 'ABC Tekstil', contact: 'Hasan Yıldız', phone: '+902121234501', sector: 'Tekstil', lat: 41.0082, lng: 28.9784, address: 'Sultanahmet, Fatih, İstanbul' },
    { company: 'XYZ Gıda', contact: 'Elif Korkmaz', phone: '+902121234502', sector: 'Gıda', lat: 41.0136, lng: 28.9550, address: 'Karaköy, Beyoğlu, İstanbul' },
    { company: 'Mega İnşaat', contact: 'Burak Şahin', phone: '+902121234503', sector: 'İnşaat', lat: 41.0370, lng: 28.9850, address: 'Levent, Beşiktaş, İstanbul' },
    { company: 'Star Otomotiv', contact: 'Canan Aydın', phone: '+902121234504', sector: 'Otomotiv', lat: 40.9923, lng: 29.0242, address: 'Kadıköy Merkez, İstanbul' },
    { company: 'Doğa Kozmetik', contact: 'Selin Polat', phone: '+902121234505', sector: 'Kozmetik', lat: 41.0053, lng: 28.9770, address: 'Eminönü, Fatih, İstanbul' },
    { company: 'Vatan Elektronik', contact: 'Emre Kılıç', phone: '+902121234506', sector: 'Elektronik', lat: 41.0500, lng: 28.9930, address: 'Maslak, Sarıyer, İstanbul' },
    { company: 'Lider Mobilya', contact: 'Derya Arslan', phone: '+902121234507', sector: 'Mobilya', lat: 41.0200, lng: 29.0050, address: 'Üsküdar Merkez, İstanbul' },
    { company: 'Güneş Enerji', contact: 'Okan Demir', phone: '+902121234508', sector: 'Enerji', lat: 41.0680, lng: 29.0060, address: 'Beykoz, İstanbul' },
    { company: 'Anadolu Lojistik', contact: 'Merve Yılmaz', phone: '+902121234509', sector: 'Lojistik', lat: 40.9800, lng: 29.0560, address: 'Pendik, İstanbul' },
    { company: 'Yıldız Medikal', contact: 'Kerem Özkan', phone: '+902121234510', sector: 'Medikal', lat: 41.0430, lng: 28.9470, address: 'Şişli Merkez, İstanbul' },
    { company: 'Barış Kimya', contact: 'Gizem Toprak', phone: '+902121234511', sector: 'Kimya', lat: 41.0290, lng: 28.8890, address: 'Bayrampaşa, İstanbul' },
    { company: 'Deniz Turizm', contact: 'Cem Aktaş', phone: '+902121234512', sector: 'Turizm', lat: 41.0060, lng: 28.9680, address: 'Sirkeci, Fatih, İstanbul' },
  ];

  for (const p of prospects) {
    const prospect = await prisma.prospect.upsert({
      where: { prospect_company_phone: { companyName: p.company, phone: p.phone } },
      update: {},
      create: {
        companyName: p.company,
        contactPerson: p.contact,
        phone: p.phone,
        email: `info@${p.company.toLowerCase().replace(/\s/g, '').replace(/[ıİşŞçÇğĞüÜöÖ]/g, '')}com`,
        address: p.address,
        latitude: p.lat,
        longitude: p.lng,
        sector: p.sector,
        status: 'active',
      },
    });
    console.log(`✅ Prospect: ${prospect.companyName}`);
  }

  // App settings
  const settings = [
    { key: 'gps_tolerance_meters', value: '200', description: 'GPS tolerans mesafesi (metre)' },
    { key: 'email_summary_time', value: '18:00', description: 'Gün sonu mail gönderim saati' },
    { key: 'email_recipients', value: 'yonetici@fieldcrm.com', description: 'Mail alıcıları' },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`✅ Setting: ${s.key}`);
  }

  console.log('\n✅ Seed tamamlandı!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed hatası:', e);
  process.exit(1);
});
