import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('trigger-summary')
  async triggerSummary(@Query('date') date?: string) {
    const result = await this.emailService.triggerDailySummary(date);
    return ApiResponseHelper.success(result, 'Gün sonu özeti oluşturuldu');
  }

  @Get('logs')
  async getEmailLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.emailService.getEmailLogs(
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
    return ApiResponseHelper.paginated(data.logs, data.total, data.page, data.limit);
  }
}
