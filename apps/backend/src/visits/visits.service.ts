import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartVisitDto } from './dto/start-visit.dto';
import { EndVisitDto } from './dto/end-visit.dto';
import { CancelVisitDto } from './dto/cancel-visit.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

const GPS_TOLERANCE_METERS = 200;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async startVisit(userId: string, dto: StartVisitDto) {
    // Check for active visit
    const activeVisit = await this.prisma.visit.findFirst({
      where: { userId, status: 'started' },
    });
    if (activeVisit) {
      throw new BadRequestException('Devam eden bir ziyaretiniz var. Önce onu sonlandırın.');
    }

    // Check prospect exists
    const prospect = await this.prisma.prospect.findUnique({
      where: { id: dto.prospectId },
    });
    if (!prospect) throw new NotFoundException('Müşteri bulunamadı');

    // GPS validation
    const distance = haversineDistance(
      dto.latitude,
      dto.longitude,
      Number(prospect.latitude),
      Number(prospect.longitude),
    );
    if (distance > GPS_TOLERANCE_METERS) {
      throw new BadRequestException(
        `Müşteri konumuna çok uzaksınız (${Math.round(distance)}m). Maksimum mesafe: ${GPS_TOLERANCE_METERS}m`,
      );
    }

    // Create visit
    const visit = await this.prisma.visit.create({
      data: {
        userId,
        prospectId: dto.prospectId,
        routePlanItemId: dto.routePlanItemId || null,
        startTime: new Date(),
        startLatitude: dto.latitude,
        startLongitude: dto.longitude,
        status: 'started',
      },
    });

    // Update route plan item status if linked
    if (dto.routePlanItemId) {
      await this.prisma.routePlanItem.update({
        where: { id: dto.routePlanItemId },
        data: { status: 'visited' },
      }).catch(() => {}); // ignore if not found
    }

    await this.activityLogs.log({
      userId,
      action: 'START_VISIT',
      entityType: 'Visit',
      entityId: visit.id,
      newValue: { prospectId: dto.prospectId, distance: Math.round(distance) },
    });

    return visit;
  }

  async endVisit(visitId: string, userId: string, dto: EndVisitDto) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Ziyaret bulunamadı');
    if (visit.userId !== userId) throw new BadRequestException('Bu ziyaret size ait değil');
    if (visit.status !== 'started') throw new BadRequestException('Bu ziyaret zaten sonlandırılmış');

    const endTime = new Date();
    const startTime = new Date(visit.startTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        endTime,
        endLatitude: dto.latitude,
        endLongitude: dto.longitude,
        result: dto.result,
        resultNotes: dto.resultNotes || null,
        status: 'completed',
        durationMinutes,
      },
    });

    // Update prospect status to visited
    await this.prisma.prospect.update({
      where: { id: visit.prospectId },
      data: { status: 'visited' },
    }).catch(() => {});

    await this.activityLogs.log({
      userId,
      action: 'END_VISIT',
      entityType: 'Visit',
      entityId: visitId,
      newValue: { result: dto.result, durationMinutes },
    });

    return updated;
  }

  async cancelVisit(visitId: string, userId: string, dto: CancelVisitDto) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Ziyaret bulunamadı');
    if (visit.userId !== userId) throw new BadRequestException('Bu ziyaret size ait değil');
    if (visit.status !== 'started') throw new BadRequestException('Bu ziyaret zaten sonlandırılmış');

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: 'cancelled',
        cancelReason: dto.cancelReason,
        endTime: new Date(),
      },
    });

    await this.activityLogs.log({
      userId,
      action: 'CANCEL_VISIT',
      entityType: 'Visit',
      entityId: visitId,
      newValue: { cancelReason: dto.cancelReason },
    });

    return updated;
  }

  async getActiveVisit(userId: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { userId, status: 'started' },
    });
    if (!visit) return null;

    const prospect = await this.prisma.prospect.findUnique({
      where: { id: visit.prospectId },
    });

    return { ...visit, prospect };
  }

  async getMyHistory(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      result?: string;
      status?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, result, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (result) where.result = result;
    if (status) where.status = status;

    const visits = await this.prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    const enriched = [];
    for (const visit of visits) {
      const prospect = await this.prisma.prospect.findUnique({ where: { id: visit.prospectId } });
      enriched.push({
        ...visit,
        prospect: prospect
          ? {
              id: prospect.id,
              companyName: prospect.companyName,
              contactPerson: prospect.contactPerson,
              address: prospect.address,
            }
          : null,
      });
    }

    const total = await this.prisma.visit.count({ where });
    return { visits: enriched, total, page, limit };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    result?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, userId, result, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (result) where.result = result;
    if (status) where.status = status;

    const visits = await this.prisma.visit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with user and prospect info
    const enriched = [];
    for (const visit of visits) {
      const user = await this.prisma.user.findUnique({ where: { id: visit.userId } });
      const prospect = await this.prisma.prospect.findUnique({ where: { id: visit.prospectId } });
      enriched.push({
        ...visit,
        user: user ? { id: user.id, fullName: user.fullName } : null,
        prospect: prospect ? {
          id: prospect.id,
          companyName: prospect.companyName,
          contactPerson: prospect.contactPerson,
          address: prospect.address,
        } : null,
      });
    }

    // Filter by date range in memory (mock DB doesn't support date range queries well)
    let filtered = enriched;
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(v => new Date(v.startTime) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(v => new Date(v.startTime) <= end);
    }

    const total = await this.prisma.visit.count({ where });

    return { visits: filtered, total, page, limit };
  }

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException('Ziyaret bulunamadı');

    const user = await this.prisma.user.findUnique({ where: { id: visit.userId } });
    const prospect = await this.prisma.prospect.findUnique({ where: { id: visit.prospectId } });

    return {
      ...visit,
      user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null,
      prospect: prospect ? {
        id: prospect.id,
        companyName: prospect.companyName,
        contactPerson: prospect.contactPerson,
        phone: prospect.phone,
        address: prospect.address,
        sector: prospect.sector,
      } : null,
    };
  }

  // Stats for dashboard
  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allVisits: any[] = await this.prisma.visit.findMany({ where: {} });
    const todayVisits = allVisits.filter((v: any) => new Date(v.startTime) >= today);

    const completed = todayVisits.filter((v: any) => v.status === 'completed');
    const resultCounts = {
      positive: completed.filter((v: any) => v.result === 'positive').length,
      neutral: completed.filter((v: any) => v.result === 'neutral').length,
      negative: completed.filter((v: any) => v.result === 'negative').length,
    };

    return {
      totalToday: todayVisits.length,
      completedToday: completed.length,
      inProgress: todayVisits.filter((v: any) => v.status === 'started').length,
      resultCounts,
    };
  }
}
