import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ApiResponseHelper } from '../common/api-response.helper';

@ApiTags('Prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(private prospectsService: ProspectsService) {}

  @Get()
  @ApiOperation({ summary: 'Potansiyel müşterileri listele' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sector', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sector') sector?: string,
  ) {
    const result = await this.prospectsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      status,
      sector,
    });
    return ApiResponseHelper.paginated(result.prospects, result.total, result.page, result.limit);
  }

  @Get('unassigned')
  @Roles('admin')
  @ApiOperation({ summary: 'Atanmamış müşterileri listele' })
  @ApiQuery({ name: 'year', required: true })
  @ApiQuery({ name: 'week', required: true })
  async getUnassigned(@Query('year') year: string, @Query('week') week: string) {
    const prospects = await this.prospectsService.getUnassignedProspects(
      parseInt(year, 10),
      parseInt(week, 10),
    );
    return ApiResponseHelper.success(prospects);
  }

  @Get('import-history')
  @Roles('admin')
  @ApiOperation({ summary: 'Import geçmişi' })
  async getImportHistory(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.prospectsService.getImportHistory(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return ApiResponseHelper.paginated(result.batches, result.total, result.page, result.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Müşteri detayı' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const prospect = await this.prospectsService.findOne(id);
    return ApiResponseHelper.success(prospect);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni müşteri ekle' })
  async create(@Body() dto: CreateProspectDto, @Req() req: any) {
    const prospect = await this.prospectsService.create(dto, req.user.id);
    return ApiResponseHelper.success(prospect, 'Müşteri oluşturuldu');
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Müşteri güncelle' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProspectDto,
    @Req() req: any,
  ) {
    const prospect = await this.prospectsService.update(id, dto, req.user.id);
    return ApiResponseHelper.success(prospect, 'Müşteri güncellendi');
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  @ApiOperation({ summary: 'Müşteri aktif/pasif' })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const prospect = await this.prospectsService.toggleStatus(id, req.user.id);
    return ApiResponseHelper.success(prospect, `Müşteri ${prospect.status} yapıldı`);
  }

  @Post('import')
  @Roles('admin')
  @ApiOperation({ summary: 'Excel ile toplu import' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      return ApiResponseHelper.error('VALIDATION_ERROR', 'Dosya yüklenmedi');
    }
    const result = await this.prospectsService.importFromExcel(file.buffer, req.user.id);
    return ApiResponseHelper.success(result, 'Import tamamlandı');
  }
}
