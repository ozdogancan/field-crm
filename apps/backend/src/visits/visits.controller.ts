import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { StartVisitDto } from './dto/start-visit.dto';
import { EndVisitDto } from './dto/end-visit.dto';
import { CancelVisitDto } from './dto/cancel-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post('start')
  async startVisit(@Body() dto: StartVisitDto, @Req() req: any) {
    const visit = await this.visitsService.startVisit(req.user.id, dto);
    return ApiResponseHelper.success(visit, 'Ziyaret başlatıldı');
  }

  @Patch(':id/end')
  async endVisit(@Param('id') id: string, @Body() dto: EndVisitDto, @Req() req: any) {
    const visit = await this.visitsService.endVisit(id, req.user.id, dto);
    return ApiResponseHelper.success(visit, 'Ziyaret sonlandırıldı');
  }

  @Patch(':id/cancel')
  async cancelVisit(@Param('id') id: string, @Body() dto: CancelVisitDto, @Req() req: any) {
    const visit = await this.visitsService.cancelVisit(id, req.user.id, dto);
    return ApiResponseHelper.success(visit, 'Ziyaret iptal edildi');
  }

  @Get('active')
  async getActiveVisit(@Req() req: any) {
    const visit = await this.visitsService.getActiveVisit(req.user.id);
    return ApiResponseHelper.success(visit);
  }

  @Get('today-stats')
  async getTodayStats() {
    const stats = await this.visitsService.getTodayStats();
    return ApiResponseHelper.success(stats);
  }

  @Get()
  @Roles('admin')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('result') result?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.visitsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId,
      result,
      status,
      startDate,
      endDate,
    });
    return ApiResponseHelper.paginated(data.visits, data.total, data.page, data.limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const visit = await this.visitsService.findOne(id);
    return ApiResponseHelper.success(visit);
  }
}
