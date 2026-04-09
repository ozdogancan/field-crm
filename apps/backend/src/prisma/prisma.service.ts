import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Mock in-memory database - will be replaced with real Prisma when DB is ready
// To switch to real DB: uncomment Prisma imports and replace MockPrismaService

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private useMock = !process.env.DATABASE_URL;
  private mockDb: MockDatabase | null = null;
  private realClient: any = null;

  async onModuleInit() {
    if (this.useMock) {
      console.log('⚠️  DATABASE_URL not set — using in-memory mock database');
      this.mockDb = new MockDatabase();
      await this.mockDb.seed();
    } else {
      const { PrismaClient } = await import('../../generated/prisma/client');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const adapter = new PrismaPg(process.env.DATABASE_URL!);
      this.realClient = new PrismaClient({ adapter });
      await this.realClient.$connect();
    }
  }

  async onModuleDestroy() {
    if (this.realClient) {
      await this.realClient.$disconnect();
    }
  }

  get user() { return this.useMock ? this.mockDb!.user : this.realClient.user; }
  get refreshToken() { return this.useMock ? this.mockDb!.refreshToken : this.realClient.refreshToken; }
  get prospect() { return this.useMock ? this.mockDb!.prospect : this.realClient.prospect; }
  get prospectImportBatch() { return this.useMock ? this.mockDb!.prospectImportBatch : this.realClient.prospectImportBatch; }
  get weeklyRoutePlan() { return this.useMock ? this.mockDb!.weeklyRoutePlan : this.realClient.weeklyRoutePlan; }
  get routePlanItem() { return this.useMock ? this.mockDb!.routePlanItem : this.realClient.routePlanItem; }
  get visit() { return this.useMock ? this.mockDb!.visit : this.realClient.visit; }
  get activityLog() { return this.useMock ? this.mockDb!.activityLog : this.realClient.activityLog; }
  get emailDispatchLog() { return this.useMock ? this.mockDb!.emailDispatchLog : this.realClient.emailDispatchLog; }
  get appSetting() { return this.useMock ? this.mockDb!.appSetting : this.realClient.appSetting; }
}

// ============================================
// IN-MEMORY MOCK DATABASE
// ============================================
import { v4 as uuidv4 } from 'uuid';

type WhereFilter = Record<string, any>;

class MockCollection<T extends Record<string, any>> {
  private items: T[] = [];

  private matchesWhere(item: T, where: WhereFilter): boolean {
    if (!where) return true;
    for (const [key, val] of Object.entries(where)) {
      if (key === 'OR') {
        return (val as WhereFilter[]).some(cond => this.matchesWhere(item, cond));
      }
      if (key === 'AND') {
        return (val as WhereFilter[]).every(cond => this.matchesWhere(item, cond));
      }
      if (key === 'NOT') {
        return !this.matchesWhere(item, val);
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        if ('contains' in val) {
          const itemVal = String(item[key] || '');
          const search = String(val.contains);
          if (val.mode === 'insensitive') {
            if (!itemVal.toLowerCase().includes(search.toLowerCase())) return false;
          } else {
            if (!itemVal.includes(search)) return false;
          }
        } else if ('notIn' in val) {
          if ((val.notIn as any[]).includes(item[key])) return false;
        } else if ('in' in val) {
          if (!(val.in as any[]).includes(item[key])) return false;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  private applySelect(item: T, select?: Record<string, any>): any {
    if (!select) return { ...item };
    const result: any = {};
    for (const [key, val] of Object.entries(select)) {
      if (val === true) result[key] = item[key];
      // skip nested includes for mock
    }
    return result;
  }

  async findMany(args?: { where?: WhereFilter; skip?: number; take?: number; orderBy?: any; select?: any; include?: any }) {
    let results = this.items.filter(item => this.matchesWhere(item, args?.where || {}));
    if (args?.orderBy) {
      const key = Object.keys(args.orderBy)[0];
      const dir = args.orderBy[key];
      results.sort((a, b) => {
        if (dir === 'asc') return a[key] > b[key] ? 1 : -1;
        return a[key] < b[key] ? 1 : -1;
      });
    }
    if (args?.skip) results = results.slice(args.skip);
    if (args?.take) results = results.slice(0, args.take);
    if (args?.select) return results.map(r => this.applySelect(r, args.select));
    return results.map(r => ({ ...r }));
  }

  async findUnique(args: { where: WhereFilter; select?: any; include?: any }) {
    const item = this.items.find(i => this.matchesWhere(i, args.where));
    if (!item) return null;
    if (args?.select) return this.applySelect(item, args.select);
    return { ...item };
  }

  async findFirst(args: { where: WhereFilter; select?: any }) {
    const item = this.items.find(i => this.matchesWhere(i, args.where));
    if (!item) return null;
    if (args?.select) return this.applySelect(item, args.select);
    return { ...item };
  }

  async create(args: { data: Partial<T>; select?: any }) {
    const item = { id: uuidv4(), createdAt: new Date(), updatedAt: new Date(), ...args.data } as unknown as T;
    this.items.push(item);
    if (args?.select) return this.applySelect(item, args.select);
    return { ...item };
  }

  async update(args: { where: WhereFilter; data: Partial<T>; select?: any }) {
    const idx = this.items.findIndex(i => this.matchesWhere(i, args.where));
    if (idx === -1) throw new Error('Record not found');
    this.items[idx] = { ...this.items[idx], ...args.data, updatedAt: new Date() };
    if (args?.select) return this.applySelect(this.items[idx], args.select);
    return { ...this.items[idx] };
  }

  async delete(args: { where: WhereFilter }) {
    const idx = this.items.findIndex(i => this.matchesWhere(i, args.where));
    if (idx === -1) return null;
    const [removed] = this.items.splice(idx, 1);
    return removed;
  }

  async deleteMany(args: { where: WhereFilter }) {
    const before = this.items.length;
    this.items = this.items.filter(i => !this.matchesWhere(i, args.where));
    return { count: before - this.items.length };
  }

  async count(args?: { where?: WhereFilter }) {
    return this.items.filter(item => this.matchesWhere(item, args?.where || {})).length;
  }

  _addRaw(item: T) {
    this.items.push(item);
  }
}

class MockDatabase {
  user = new MockCollection<any>();
  refreshToken = new MockCollection<any>();
  prospect = new MockCollection<any>();
  prospectImportBatch = new MockCollection<any>();
  weeklyRoutePlan = new MockCollection<any>();
  routePlanItem = new MockCollection<any>();
  visit = new MockCollection<any>();
  activityLog = new MockCollection<any>();
  emailDispatchLog = new MockCollection<any>();
  appSetting = new MockCollection<any>();

  async seed() {
    const bcrypt = await import('bcrypt');

    // Admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    this.user._addRaw({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@fieldcrm.com',
      passwordHash: adminHash,
      fullName: 'Admin Kullanıcı',
      role: 'admin',
      phone: '+905551000001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

    for (let i = 0; i < fieldUsers.length; i++) {
      this.user._addRaw({
        id: `00000000-0000-0000-0000-00000000000${i + 2}`,
        email: fieldUsers[i].email,
        passwordHash: fieldHash,
        fullName: fieldUsers[i].name,
        role: 'field_user',
        phone: fieldUsers[i].phone,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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

    for (let i = 0; i < prospects.length; i++) {
      this.prospect._addRaw({
        id: `10000000-0000-0000-0000-00000000000${String(i + 1).padStart(1, '0')}`,
        companyName: prospects[i].company,
        contactPerson: prospects[i].contact,
        phone: prospects[i].phone,
        email: `info@${prospects[i].company.toLowerCase().replace(/\s/g, '')}.com`,
        address: prospects[i].address,
        latitude: prospects[i].lat,
        longitude: prospects[i].lng,
        sector: prospects[i].sector,
        notes: null,
        status: 'active',
        importBatchId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // App settings
    this.appSetting._addRaw({ id: uuidv4(), key: 'gps_tolerance_meters', value: '200', description: 'GPS tolerans mesafesi (metre)', updatedAt: new Date() });
    this.appSetting._addRaw({ id: uuidv4(), key: 'email_summary_time', value: '18:00', description: 'Gün sonu mail gönderim saati', updatedAt: new Date() });
    this.appSetting._addRaw({ id: uuidv4(), key: 'email_recipients', value: 'yonetici@fieldcrm.com', description: 'Mail alıcıları', updatedAt: new Date() });

    console.log('✅ Mock database seeded: 1 admin, 6 field users, 12 prospects');
  }
}
