import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class PlanningService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(params: { userId?: string; year?: number; weekNumber?: number }) {
    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.year) where.year = params.year;
    if (params.weekNumber) where.weekNumber = params.weekNumber;

    const plans = await this.prisma.weeklyRoutePlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Attach items and user info to each plan
    const result = [];
    for (const plan of plans) {
      const items = await this.prisma.routePlanItem.findMany({
        where: { planId: plan.id },
        orderBy: { visitOrder: 'asc' },
      });

      // Enrich items with prospect info
      const enrichedItems = [];
      for (const item of items) {
        const prospect = await this.prisma.prospect.findUnique({ where: { id: item.prospectId } });
        enrichedItems.push({
          ...item,
          prospect: prospect ? {
            id: prospect.id,
            companyName: prospect.companyName,
            contactPerson: prospect.contactPerson,
            phone: prospect.phone,
            address: prospect.address,
            sector: prospect.sector,
          } : null,
        });
      }

      const user = await this.prisma.user.findUnique({ where: { id: plan.userId } });
      result.push({
        ...plan,
        user: user ? { id: user.id, fullName: user.fullName } : null,
        items: enrichedItems,
      });
    }

    return result;
  }

  async findOne(id: string) {
    const plan = await this.prisma.weeklyRoutePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan bulunamadi');

    const items = await this.prisma.routePlanItem.findMany({
      where: { planId: plan.id },
      orderBy: { visitOrder: 'asc' },
    });

    const enrichedItems = [];
    for (const item of items) {
      const prospect = await this.prisma.prospect.findUnique({ where: { id: item.prospectId } });
      enrichedItems.push({
        ...item,
        prospect: prospect ? {
          id: prospect.id,
          companyName: prospect.companyName,
          contactPerson: prospect.contactPerson,
          phone: prospect.phone,
          address: prospect.address,
          sector: prospect.sector,
        } : null,
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: plan.userId } });

    return {
      ...plan,
      user: user ? { id: user.id, fullName: user.fullName } : null,
      items: enrichedItems,
    };
  }

  async create(dto: CreatePlanDto, adminUserId: string) {
    // Check if user exists and is a field user
    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!targetUser) throw new BadRequestException('Kullanici bulunamadi');
    if (targetUser.role !== 'field_user') throw new BadRequestException('Sadece saha kullanicilarina plan atanabilir');

    // Check for existing plan
    const existing = await this.prisma.weeklyRoutePlan.findFirst({
      where: { userId: dto.userId, year: dto.year, weekNumber: dto.weekNumber },
    });
    if (existing) throw new BadRequestException('Bu kullanici icin bu hafta zaten bir plan var');

    // Validate prospects
    for (const item of dto.items) {
      const prospect = await this.prisma.prospect.findUnique({ where: { id: item.prospectId } });
      if (!prospect) throw new BadRequestException(`Musteri bulunamadi: ${item.prospectId}`);
      if (prospect.status === 'passive') throw new BadRequestException(`Pasif musteri plana eklenemez: ${prospect.companyName}`);
    }

    // Create plan
    const plan = await this.prisma.weeklyRoutePlan.create({
      data: {
        userId: dto.userId,
        year: dto.year,
        weekNumber: dto.weekNumber,
        status: 'draft',
      },
    });

    // Create items - compute plannedDate from year + weekNumber + dayOfWeek
    for (const item of dto.items) {
      const plannedDate = this.getDateFromWeekDay(dto.year, dto.weekNumber, item.dayOfWeek);
      await this.prisma.routePlanItem.create({
        data: {
          planId: plan.id,
          prospectId: item.prospectId,
          visitOrder: item.visitOrder,
          plannedDate,
          status: 'pending',
        },
      });
    }

    await this.activityLogs.log({
      userId: adminUserId,
      action: 'CREATE_PLAN',
      entityType: 'WeeklyRoutePlan',
      entityId: plan.id,
      newValue: { userId: dto.userId, year: dto.year, weekNumber: dto.weekNumber, itemCount: dto.items.length },
    });

    return this.findOne(plan.id);
  }

  async update(id: string, dto: UpdatePlanDto, adminUserId: string) {
    const plan = await this.prisma.weeklyRoutePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan bulunamadi');

    // Check if past week
    const now = new Date();
    const currentWeekData = this.getWeekNumber(now);
    if (plan.year < currentWeekData.year ||
        (plan.year === currentWeekData.year && plan.weekNumber < currentWeekData.week)) {
      throw new BadRequestException('Gecmis hafta plani duzenlenemez');
    }

    if (dto.status) {
      await this.prisma.weeklyRoutePlan.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    if (dto.items) {
      // Delete existing items
      await this.prisma.routePlanItem.deleteMany({ where: { planId: id } });

      // Validate and create new items
      for (const item of dto.items) {
        const prospect = await this.prisma.prospect.findUnique({ where: { id: item.prospectId } });
        if (!prospect) throw new BadRequestException(`Musteri bulunamadi: ${item.prospectId}`);
        if (prospect.status === 'passive') throw new BadRequestException(`Pasif musteri plana eklenemez: ${prospect.companyName}`);

        const plannedDate = this.getDateFromWeekDay(plan.year, plan.weekNumber, item.dayOfWeek);
        await this.prisma.routePlanItem.create({
          data: {
            planId: id,
            prospectId: item.prospectId,
            visitOrder: item.visitOrder,
            plannedDate,
            status: 'pending',
          },
        });
      }

      await this.activityLogs.log({
        userId: adminUserId,
        action: 'UPDATE_PLAN',
        entityType: 'WeeklyRoutePlan',
        entityId: id,
        newValue: { itemCount: dto.items.length },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string, adminUserId: string) {
    const plan = await this.prisma.weeklyRoutePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan bulunamadi');

    // Delete items first
    await this.prisma.routePlanItem.deleteMany({ where: { planId: id } });
    await this.prisma.weeklyRoutePlan.delete({ where: { id } });

    await this.activityLogs.log({
      userId: adminUserId,
      action: 'DELETE_PLAN',
      entityType: 'WeeklyRoutePlan',
      entityId: id,
    });

    return { deleted: true };
  }

  // Helper: get ISO week number
  private getWeekNumber(date: Date): { year: number; week: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  }

  // Helper: get date from year + week + dayOfWeek
  private getDateFromWeekDay(year: number, week: number, dayOfWeek: number): Date {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfJan4 = jan4.getUTCDay() || 7;
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setUTCDate(jan4.getUTCDate() - dayOfJan4 + 1);
    const targetDate = new Date(mondayOfWeek1);
    targetDate.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7 + (dayOfWeek - 1));
    return targetDate;
  }

  // Get current week info
  getCurrentWeek() {
    return this.getWeekNumber(new Date());
  }
}
