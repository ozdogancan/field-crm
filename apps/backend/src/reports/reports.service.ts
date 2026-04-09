import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProspects, activeProspects, totalUsers, allVisits, allPlans] = await Promise.all([
      this.prisma.prospect.count(),
      this.prisma.prospect.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { role: 'field_user', isActive: true } }),
      this.prisma.visit.findMany({ where: {} }),
      this.prisma.weeklyRoutePlan.findMany({ where: {} }),
    ]);

    const todayVisits = (allVisits as any[]).filter((v: any) => new Date(v.startTime) >= today);
    const completedToday = todayVisits.filter((v: any) => v.status === 'completed');
    const inProgressToday = todayVisits.filter((v: any) => v.status === 'started');

    // This week visits
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekVisits = (allVisits as any[]).filter((v: any) => new Date(v.startTime) >= weekStart);
    const completedThisWeek = weekVisits.filter((v: any) => v.status === 'completed');

    // Result distribution (all time)
    const allCompleted = (allVisits as any[]).filter((v: any) => v.status === 'completed');
    const resultCounts = {
      positive: allCompleted.filter((v: any) => v.result === 'positive').length,
      neutral: allCompleted.filter((v: any) => v.result === 'neutral').length,
      negative: allCompleted.filter((v: any) => v.result === 'negative').length,
    };

    // Average visit duration
    const durations = allCompleted
      .filter((v: any) => v.durationMinutes)
      .map((v: any) => v.durationMinutes);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0;

    // Active plans count
    const activePlans = (allPlans as any[]).filter(
      (p: any) => p.status === 'draft' || p.status === 'active',
    ).length;

    return {
      prospects: { total: totalProspects, active: activeProspects },
      users: { totalField: totalUsers },
      today: {
        totalVisits: todayVisits.length,
        completed: completedToday.length,
        inProgress: inProgressToday.length,
      },
      thisWeek: {
        totalVisits: weekVisits.length,
        completed: completedThisWeek.length,
      },
      overall: {
        totalVisits: (allVisits as any[]).length,
        totalCompleted: allCompleted.length,
        resultCounts,
        avgDurationMinutes: avgDuration,
      },
      activePlans,
    };
  }

  async getUserPerformance(params: { startDate?: string; endDate?: string }) {
    const fieldUsers = await this.prisma.user.findMany({
      where: { role: 'field_user', isActive: true },
    });

    const allVisits: any[] = await this.prisma.visit.findMany({ where: {} });

    let filtered = allVisits;
    if (params.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter((v: any) => new Date(v.startTime) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v: any) => new Date(v.startTime) <= end);
    }

    const performance = fieldUsers.map((user: any) => {
      const userVisits = filtered.filter((v: any) => v.userId === user.id);
      const completed = userVisits.filter((v: any) => v.status === 'completed');
      const cancelled = userVisits.filter((v: any) => v.status === 'cancelled');

      const positive = completed.filter((v: any) => v.result === 'positive').length;
      const neutral = completed.filter((v: any) => v.result === 'neutral').length;
      const negative = completed.filter((v: any) => v.result === 'negative').length;

      const durations = completed
        .filter((v: any) => v.durationMinutes)
        .map((v: any) => v.durationMinutes);
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : 0;

      return {
        userId: user.id,
        fullName: user.fullName,
        totalVisits: userVisits.length,
        completed: completed.length,
        cancelled: cancelled.length,
        results: { positive, neutral, negative },
        avgDurationMinutes: avgDuration,
        conversionRate: completed.length > 0
          ? Math.round((positive / completed.length) * 100)
          : 0,
      };
    });

    return performance.sort((a: { completed: number }, b: { completed: number }) => b.completed - a.completed);
  }

  async getWeeklyTrend(weeksBack = 8) {
    const allVisits: any[] = await this.prisma.visit.findMany({ where: {} });
    const weeks: { weekLabel: string; start: Date; end: Date }[] = [];

    for (let i = weeksBack - 1; i >= 0; i--) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1 - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const dd = start.getDate().toString().padStart(2, '0');
      const mm = (start.getMonth() + 1).toString().padStart(2, '0');
      weeks.push({ weekLabel: `${dd}/${mm}`, start, end });
    }

    return weeks.map((w) => {
      const weekVisits = allVisits.filter(
        (v: any) => new Date(v.startTime) >= w.start && new Date(v.startTime) <= w.end,
      );
      const completed = weekVisits.filter((v: any) => v.status === 'completed');
      return {
        week: w.weekLabel,
        total: weekVisits.length,
        completed: completed.length,
        positive: completed.filter((v: any) => v.result === 'positive').length,
      };
    });
  }

  async getDailySummary(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const allVisits: any[] = await this.prisma.visit.findMany({ where: {} });
    const dayVisits = allVisits.filter(
      (v: any) => new Date(v.startTime) >= targetDate && new Date(v.startTime) < nextDay,
    );

    const fieldUsers = await this.prisma.user.findMany({
      where: { role: 'field_user', isActive: true },
    });

    const userSummaries = [];
    for (const user of fieldUsers) {
      const uVisits = dayVisits.filter((v: any) => v.userId === (user as any).id);
      const completed = uVisits.filter((v: any) => v.status === 'completed');

      if (uVisits.length === 0) continue;

      const prospects = [];
      for (const v of uVisits) {
        const prospect = await this.prisma.prospect.findUnique({ where: { id: v.prospectId } });
        prospects.push({
          companyName: prospect ? (prospect as any).companyName : 'Bilinmeyen',
          result: v.result || v.status,
          duration: v.durationMinutes || 0,
          notes: v.resultNotes || v.cancelReason || '',
        });
      }

      userSummaries.push({
        userId: (user as any).id,
        fullName: (user as any).fullName,
        totalVisits: uVisits.length,
        completed: completed.length,
        results: {
          positive: completed.filter((v: any) => v.result === 'positive').length,
          neutral: completed.filter((v: any) => v.result === 'neutral').length,
          negative: completed.filter((v: any) => v.result === 'negative').length,
        },
        visits: prospects,
      });
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      totalVisits: dayVisits.length,
      completedVisits: dayVisits.filter((v: any) => v.status === 'completed').length,
      cancelledVisits: dayVisits.filter((v: any) => v.status === 'cancelled').length,
      users: userSummaries,
    };
  }
}
