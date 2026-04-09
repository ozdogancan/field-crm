import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: InstanceType<typeof PrismaClient>;

  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    const adapter = new PrismaPg(connectionString);
    this.client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user() { return this.client.user; }
  get refreshToken() { return this.client.refreshToken; }
  get prospect() { return this.client.prospect; }
  get prospectImportBatch() { return this.client.prospectImportBatch; }
  get weeklyRoutePlan() { return this.client.weeklyRoutePlan; }
  get routePlanItem() { return this.client.routePlanItem; }
  get visit() { return this.client.visit; }
  get activityLog() { return this.client.activityLog; }
  get emailDispatchLog() { return this.client.emailDispatchLog; }
  get appSetting() { return this.client.appSetting; }
}
