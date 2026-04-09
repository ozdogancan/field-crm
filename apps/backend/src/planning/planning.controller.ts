import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('current-week')
  getCurrentWeek() {
    return ApiResponseHelper.success(this.planningService.getCurrentWeek());
  }

  @Get('me/current')
  async getMyCurrentPlan(@Req() req: any) {
    const currentWeek = this.planningService.getCurrentWeek();
    const plan = await this.planningService.findByUserWeek(req.user.id, currentWeek.year, currentWeek.week);
    return ApiResponseHelper.success(plan);
  }

  @Get()
  @Roles('admin')
  async findAll(
    @Query('userId') userId?: string,
    @Query('year') year?: string,
    @Query('weekNumber') weekNumber?: string,
  ) {
    const plans = await this.planningService.findAll({
      userId,
      year: year ? parseInt(year) : undefined,
      weekNumber: weekNumber ? parseInt(weekNumber) : undefined,
    });
    return ApiResponseHelper.success(plans);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const plan = await this.planningService.findOne(id);
    return ApiResponseHelper.success(plan);
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreatePlanDto, @Req() req: any) {
    const plan = await this.planningService.create(dto, req.user.id);
    return ApiResponseHelper.success(plan, 'Plan olusturuldu');
  }

  @Patch(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto, @Req() req: any) {
    const plan = await this.planningService.update(id, dto, req.user.id);
    return ApiResponseHelper.success(plan, 'Plan guncellendi');
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @Req() req: any) {
    const result = await this.planningService.delete(id, req.user.id);
    return ApiResponseHelper.success(result, 'Plan silindi');
  }
}
