import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    const stats = await this.reportsService.getDashboardStats();
    return ApiResponseHelper.success(stats);
  }

  @Get('user-performance')
  async getUserPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.reportsService.getUserPerformance({ startDate, endDate });
    return ApiResponseHelper.success(data);
  }

  @Get('weekly-trend')
  async getWeeklyTrend(@Query('weeksBack') weeksBack?: string) {
    const data = await this.reportsService.getWeeklyTrend(
      weeksBack ? parseInt(weeksBack) : undefined,
    );
    return ApiResponseHelper.success(data);
  }

  @Get('daily-summary')
  async getDailySummary(@Query('date') date?: string) {
    const data = await this.reportsService.getDailySummary(date);
    return ApiResponseHelper.success(data);
  }
}
